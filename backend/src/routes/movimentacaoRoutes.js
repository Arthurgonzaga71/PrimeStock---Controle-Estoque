// routes/movimentacoesRoutes.js - VERSÃO COMPLETA CORRIGIDA
const express = require('express');
const { Movimentacao, Item, Usuario, AlertasEstoque } = require('../models/associations');
const { auth } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const router = express.Router();

// 🆕 SISTEMA DE PERMISSÕES POR ROTA
const permissoesRotas = {
  // 🔍 CONSULTAR
  consultar: (req, res, next) => {
    const perfil = req.usuario?.perfil;
    if (['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista'].includes(perfil)) {
      return next();
    }
    
    if (['estagiario', 'aprendiz'].includes(perfil)) {
      req.filtroUsuario = true;
      return next();
    }
    res.status(403).json({ 
      success: false, 
      message: 'Permissão para consultar movimentações negada' 
    });
  },
  
  // ✏️ CRIAR
  criar: (req, res, next) => {
    const perfil = req.usuario?.perfil;
    
    if (['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista'].includes(perfil)) {
      return next();
    }
    
    res.status(403).json({ 
      success: false, 
      message: 'Permissão para criar movimentações negada',
      perfil_atual: perfil
    });
  },
  
  // 🔄 DEVOLVER
  devolver: (req, res, next) => {
    const perfil = req.usuario?.perfil;
    
    if (['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista'].includes(perfil)) {
      return next();
    }
    
    res.status(403).json({ 
      success: false, 
      message: 'Permissão para devolver itens negada' 
    });
  }
};

// 🆕 FUNÇÃO: Verificar alertas de estoque
const verificarAlertasEstoque = async (itemId, transaction) => {
  try {
    const item = await Item.findByPk(itemId, { transaction });
    if (!item) return;

    const quantidade = item.quantidade || 0;
    const estoqueMinimo = item.estoque_minimo || 0;
    
    let nivelAlerta = null;
    let mensagem = '';
    
    if (quantidade === 0) {
      nivelAlerta = 'zero';
      mensagem = `${item.nome} está com estoque ZERO`;
    } else if (quantidade <= 2) {
      nivelAlerta = 'critico';
      mensagem = `${item.nome} está com estoque CRÍTICO`;
    } else if (quantidade <= estoqueMinimo) {
      nivelAlerta = 'baixo';
      mensagem = `${item.nome} está com estoque BAIXO`;
    }

    if (nivelAlerta) {
      const alertaExistente = await AlertasEstoque.findOne({
        where: {
          item_id: itemId,
          nivel_alerta: nivelAlerta,
          lido: false
        },
        transaction
      });

      if (!alertaExistente) {
        await AlertasEstoque.create({
          item_id: itemId,
          nivel_alerta: nivelAlerta,
          quantidade_atual: quantidade,
          estoque_minimo: estoqueMinimo,
          mensagem: mensagem,
          data_alerta: new Date()
        }, { transaction });
      }
    }
  } catch (error) {
    console.error('Erro ao verificar alertas de estoque:', error);
  }
};

// 🆕 FUNÇÃO: Calcular quantidade já devolvida (CORRIGIDA)
const calcularQuantidadeDevolvida = async (movimentacaoId, transaction = null) => {
  try {
    const options = transaction ? { transaction } : {};
    
    const devolucoes = await Movimentacao.findAll({
      where: {
        tipo: 'devolucao',
        [Op.or]: [
          { observacao: { [Op.like]: `%movimentação #${movimentacaoId}%` } },
          { observacao: { [Op.like]: `%saída #${movimentacaoId}%` } },
          { observacao: { [Op.like]: `%Devolução da movimentação #${movimentacaoId}%` } }
        ]
      },
      ...options
    });

    return devolucoes.reduce((total, dev) => total + dev.quantidade, 0);
  } catch (error) {
    console.error('Erro ao calcular quantidade devolvida:', error);
    return 0;
  }
};

// =============================================
// 🔍 ROTAS DE CONSULTA
// =============================================

// GET /api/movimentacoes - Listar todas as movimentações
router.get('/', auth, permissoesRotas.consultar, async (req, res) => {
  try {
    const { tipo, item_id, data_inicio, data_fim, page = 1, limit = 50 } = req.query;
    const where = {};
    
    if (tipo) where.tipo = tipo;
    if (item_id && !isNaN(parseInt(item_id))) where.item_id = parseInt(item_id);
    
    if (data_inicio && data_fim) {
      where.data_movimentacao = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim + ' 23:59:59')]
      };
    }
    
    if (req.filtroUsuario) {
      where.usuario_id = req.usuario.id;
    }

    const offset = (page - 1) * limit;

    const { count, rows: movimentacoes } = await Movimentacao.findAndCountAll({
      where,
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio', 'numero_serie', 'status', 'quantidade']
        },
        { 
          model: Usuario, 
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        }
      ],
      order: [['data_movimentacao', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // 🔥 CALCULAR QUANTIDADE DEVOLVIDA PARA CADA MOVIMENTAÇÃO
    const movimentacoesComDevolucao = await Promise.all(
      movimentacoes.map(async (mov) => {
        const movData = mov.toJSON();
        
        // Calcular quantidade devolvida apenas para saídas
        if (movData.tipo === 'saida' || movData.tipo === 'transferencia') {
          const quantidadeDevolvida = await calcularQuantidadeDevolvida(movData.id);
          
          let statusDevolucao = 'pendente';
          if (quantidadeDevolvida >= movData.quantidade) {
            statusDevolucao = 'devolvido';
          } else if (quantidadeDevolvida > 0) {
            statusDevolucao = 'parcial';
          }
          
          movData.status_devolucao = statusDevolucao;
          movData.quantidade_devolvida = quantidadeDevolvida;
          movData.quantidade_restante = movData.quantidade - quantidadeDevolvida;
        } else {
          movData.status_devolucao = null;
          movData.quantidade_devolvida = 0;
          movData.quantidade_restante = movData.quantidade;
        }
        
        return movData;
      })
    );

    res.json({
      success: true,
      data: movimentacoesComDevolucao,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar movimentações'
    });
  }
});

// GET /api/movimentacoes/:id - Buscar movimentação por ID
router.get('/:id', auth, permissoesRotas.consultar, async (req, res) => {
  try {
    const movimentacaoId = parseInt(req.params.id);
    
    if (isNaN(movimentacaoId) || movimentacaoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const movimentacao = await Movimentacao.findByPk(movimentacaoId, {
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio', 'numero_serie', 'status', 'quantidade']
        },
        { 
          model: Usuario, 
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    if (!movimentacao) {
      return res.status(404).json({
        success: false,
        message: 'Movimentação não encontrada'
      });
    }

    const movData = movimentacao.toJSON();
    
    // 🔥 CALCULAR QUANTIDADE DEVOLVIDA SE FOR SAÍDA
    if (movData.tipo === 'saida' || movData.tipo === 'transferencia') {
      const quantidadeDevolvida = await calcularQuantidadeDevolvida(movData.id);
      
      let statusDevolucao = 'pendente';
      if (quantidadeDevolvida >= movData.quantidade) {
        statusDevolucao = 'devolvido';
      } else if (quantidadeDevolvida > 0) {
        statusDevolucao = 'parcial';
      }
      
      movData.status_devolucao = statusDevolucao;
      movData.quantidade_devolvida = quantidadeDevolvida;
      movData.quantidade_restante = movData.quantidade - quantidadeDevolvida;
    }

    res.json({
      success: true,
      data: movData
    });
  } catch (error) {
    console.error('Erro ao buscar movimentação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar movimentação'
    });
  }
});

// =============================================
// ✏️ ROTAS DE CRIAÇÃO
// =============================================

// ✏️ PUT /api/movimentacoes/:id - Atualizar movimentação
router.put('/:id', auth, permissoesRotas.criar, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const movimentacaoId = parseInt(req.params.id);
    
    if (isNaN(movimentacaoId) || movimentacaoId <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const { 
      quantidade, 
      destinatario, 
      departamento_destino, 
      data_devolucao_prevista, 
      observacao 
    } = req.body;

    // Buscar movimentação existente
    const movimentacao = await Movimentacao.findByPk(movimentacaoId, {
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'quantidade']
        }
      ],
      transaction
    });

    if (!movimentacao) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Movimentação não encontrada'
      });
    }

    // 🔥 VERIFICAR SE JÁ TEM DEVOLUÇÕES (não pode editar quantidade se já houve devolução)
    if (quantidade && parseInt(quantidade) !== movimentacao.quantidade) {
      const quantidadeDevolvida = await calcularQuantidadeDevolvida(movimentacaoId, transaction);
      
      if (quantidadeDevolvida > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Não é possível alterar quantidade pois já existem devoluções (${quantidadeDevolvida} unidades devolvidas)`
        });
      }
    }

    // Validar se pode editar (não editar após 30 dias)
    const dataMovimentacao = new Date(movimentacao.data_movimentacao);
    const hoje = new Date();
    const diferencaDias = (hoje - dataMovimentacao) / (1000 * 60 * 60 * 24);
    
    if (diferencaDias > 30) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Movimentação muito antiga para edição (máximo 30 dias)'
      });
    }

    // Validar nova quantidade (se alterada)
    if (quantidade && parseInt(quantidade) !== movimentacao.quantidade) {
      const novaQuantidade = parseInt(quantidade);
      const diferencaQuantidade = novaQuantidade - movimentacao.quantidade;
      
      // Para saídas/transferências: verificar se tem estoque suficiente
      if (movimentacao.tipo === 'saida' || movimentacao.tipo === 'transferencia') {
        const item = movimentacao.item;
        if (diferencaQuantidade > 0) { // Aumentando a saída
          if (item.quantidade < diferencaQuantidade) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `Quantidade indisponível. Disponível: ${item.quantidade}`
            });
          }
          // Atualizar estoque
          await item.update({ 
            quantidade: item.quantidade - diferencaQuantidade 
          }, { transaction });
        } else if (diferencaQuantidade < 0) { // Reduzindo a saída
          // Devolver ao estoque
          await item.update({ 
            quantidade: item.quantidade + Math.abs(diferencaQuantidade)
          }, { transaction });
        }
      }
    }

    // Atualizar movimentação
    const updates = {};
    if (quantidade !== undefined) updates.quantidade = parseInt(quantidade);
    if (destinatario !== undefined) updates.destinatario = destinatario;
    if (departamento_destino !== undefined) updates.departamento_destino = departamento_destino;
    if (data_devolucao_prevista !== undefined) {
      updates.data_devolucao_prevista = data_devolucao_prevista 
        ? new Date(data_devolucao_prevista)
        : null;
    }
    if (observacao !== undefined) updates.observacao = observacao;

    await movimentacao.update(updates, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Movimentação atualizada com sucesso!',
      data: movimentacao
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao atualizar movimentação:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar movimentação',
      error: error.message
    });
  }
});

// POST /api/movimentacoes - Criar nova movimentação
router.post('/', auth, permissoesRotas.criar, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { 
      item_id, 
      tipo, 
      quantidade, 
      destinatario, 
      departamento_destino, 
      data_devolucao_prevista, 
      observacao 
    } = req.body;

    // 🔥 VALIDAÇÕES
    if (!item_id || isNaN(parseInt(item_id))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Item ID inválido'
      });
    }

    if (!tipo || !['entrada', 'saida', 'transferencia', 'devolucao'].includes(tipo)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tipo de movimentação inválido'
      });
    }

    if (!quantidade || isNaN(parseInt(quantidade)) || parseInt(quantidade) <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Quantidade inválida'
      });
    }

    // Buscar item
    const itemId = parseInt(item_id);
    const item = await Item.findByPk(itemId, { transaction });
    
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    const quantidadeNum = parseInt(quantidade);
    
    // Validar quantidade para saída
    if ((tipo === 'saida' || tipo === 'transferencia') && item.quantidade < quantidadeNum) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Quantidade indisponível. Disponível: ${item.quantidade}`
      });
    }

    // Criar movimentação
    const movimentacao = await Movimentacao.create({
      item_id: itemId,
      usuario_id: req.usuario.id,
      tipo: tipo,
      quantidade: quantidadeNum,
      destinatario: destinatario || null,
      departamento_destino: departamento_destino || null,
      data_devolucao_prevista: data_devolucao_prevista ? new Date(data_devolucao_prevista) : null,
      observacao: observacao || null,
      data_movimentacao: new Date()
    }, { transaction });

    // Atualizar quantidade do item
    let novaQuantidade = item.quantidade;
    if (tipo === 'entrada' || tipo === 'devolucao') {
      novaQuantidade += quantidadeNum;
    } else if (tipo === 'saida' || tipo === 'transferencia') {
      novaQuantidade -= quantidadeNum;
    }

    // Atualizar status
    let novoStatus = item.status;
    if (tipo === 'saida' && novaQuantidade === 0) {
      novoStatus = 'em_uso';
    } else if ((tipo === 'entrada' || tipo === 'devolucao') && novaQuantidade > 0) {
      novoStatus = 'disponivel';
    }

    await item.update({ 
      quantidade: novaQuantidade,
      status: novoStatus
    }, { transaction });

    // 🔔 VERIFICAR ALERTAS
    await verificarAlertasEstoque(itemId, transaction);

    await transaction.commit();

    // Buscar movimentação completa
    const movimentacaoCompleta = await Movimentacao.findByPk(movimentacao.id, {
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio', 'numero_serie', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Movimentação registrada com sucesso!',
      data: movimentacaoCompleta
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar movimentação:', error);
    
    let errorMessage = 'Erro ao registrar movimentação';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = 'Erro de validação nos dados';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

// POST /api/movimentacoes/saida - Saída específica
router.post('/saida', auth, permissoesRotas.criar, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { 
      item_id, 
      quantidade, 
      destinatario, 
      departamento_destino, 
      data_devolucao_prevista, 
      observacao 
    } = req.body;

    // 🔥 VALIDAÇÕES
    if (!item_id || isNaN(parseInt(item_id))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Item ID inválido'
      });
    }

    if (!quantidade || isNaN(parseInt(quantidade)) || parseInt(quantidade) <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Quantidade inválida'
      });
    }

    if (!destinatario || !destinatario.trim()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Destinatário é obrigatório'
      });
    }

    // Buscar item
    const itemId = parseInt(item_id);
    const item = await Item.findByPk(itemId, { transaction });
    
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    const quantidadeNum = parseInt(quantidade);
    
    // Verificar disponibilidade
    if (item.quantidade < quantidadeNum) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Quantidade indisponível. Disponível: ${item.quantidade}`
      });
    }

    if (item.status !== 'disponivel') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Item não disponível. Status: ${item.status}`
      });
    }

    // Criar saída
    const movimentacao = await Movimentacao.create({
      item_id: itemId,
      usuario_id: req.usuario.id,
      tipo: 'saida',
      quantidade: quantidadeNum,
      destinatario: destinatario.trim(),
      departamento_destino: departamento_destino || null,
      data_devolucao_prevista: data_devolucao_prevista ? new Date(data_devolucao_prevista) : null,
      observacao: observacao || `Saída para ${destinatario}`,
      data_movimentacao: new Date()
    }, { transaction });

    // Atualizar item
    const novaQuantidade = item.quantidade - quantidadeNum;
    const novoStatus = novaQuantidade === 0 ? 'em_uso' : 'disponivel';

    await item.update({ 
      quantidade: novaQuantidade,
      status: novoStatus
    }, { transaction });

    // 🔔 VERIFICAR ALERTAS
    await verificarAlertasEstoque(itemId, transaction);

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Saída registrada com sucesso!',
      data: movimentacao
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao registrar saída:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao registrar saída',
      error: error.message
    });
  }
});

// =============================================
// 🔄 ROTAS DE DEVOLUÇÃO
// =============================================

// POST /api/movimentacoes/devolucao/:id - Devolver movimentação
router.post('/devolucao/:id', auth, permissoesRotas.devolver, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const movimentacaoId = parseInt(req.params.id);
    
    if (isNaN(movimentacaoId) || movimentacaoId <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    // Buscar movimentação original
    const movimentacaoOriginal = await Movimentacao.findByPk(movimentacaoId, {
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'quantidade', 'status']
        }
      ],
      transaction
    });

    if (!movimentacaoOriginal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Movimentação não encontrada'
      });
    }

    if (movimentacaoOriginal.tipo !== 'saida' && movimentacaoOriginal.tipo !== 'transferencia') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Apenas saídas e transferências podem ser devolvidas'
      });
    }

    const item = movimentacaoOriginal.item;
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    // 🔥 VALIDAR QUANTIDADE JÁ DEVOLVIDA
    const quantidadeDevolvida = await calcularQuantidadeDevolvida(movimentacaoId, transaction);
    const quantidadeDisponivelParaDevolver = movimentacaoOriginal.quantidade - quantidadeDevolvida;
    
    if (quantidadeDisponivelParaDevolver <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta movimentação já foi totalmente devolvida',
        quantidade_devolvida: quantidadeDevolvida
      });
    }

    // 🔥 PERMITIR DEVOLUÇÃO PARCIAL OU TOTAL
    const { quantidade = quantidadeDisponivelParaDevolver, observacao } = req.body;
    const quantidadeDevolvidaAtual = parseInt(quantidade);
    
    if (quantidadeDevolvidaAtual <= 0 || quantidadeDevolvidaAtual > quantidadeDisponivelParaDevolver) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Quantidade inválida. Disponível para devolver: ${quantidadeDisponivelParaDevolver}`,
        quantidade_disponivel: quantidadeDisponivelParaDevolver
      });
    }

    // Criar devolução
    const movimentacaoDevolucao = await Movimentacao.create({
      item_id: item.id,
      usuario_id: req.usuario.id,
      tipo: 'devolucao',
      quantidade: quantidadeDevolvidaAtual,
      destinatario: `Devolução: ${movimentacaoOriginal.destinatario || 'Sem destinatário'}`,
      departamento_destino: movimentacaoOriginal.departamento_destino,
      observacao: observacao || `Devolução (${quantidadeDevolvidaAtual}/${movimentacaoOriginal.quantidade}) da movimentação #${movimentacaoId}`,
      data_movimentacao: new Date()
    }, { transaction });

    // Atualizar item
    const novaQuantidade = item.quantidade + quantidadeDevolvidaAtual;
    const novoStatus = novaQuantidade > 0 ? 'disponivel' : item.status;

    await item.update({ 
      quantidade: novaQuantidade,
      status: novoStatus
    }, { transaction });

    // 🔔 VERIFICAR ALERTAS
    await verificarAlertasEstoque(item.id, transaction);

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Devolução registrada com sucesso!',
      data: {
        devolucao: movimentacaoDevolucao,
        resumo: {
          id_original: movimentacaoOriginal.id,
          quantidade_original: movimentacaoOriginal.quantidade,
          quantidade_devolvida_total: quantidadeDevolvida + quantidadeDevolvidaAtual,
          quantidade_restante: quantidadeDisponivelParaDevolver - quantidadeDevolvidaAtual,
          totalmente_devolvido: (quantidadeDevolvida + quantidadeDevolvidaAtual) >= movimentacaoOriginal.quantidade
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao registrar devolução:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao registrar devolução',
      error: error.message
    });
  }
});

// POST /api/movimentacoes/devolucao-item/:itemId - Devolução direta
router.post('/devolucao-item/:itemId', auth, permissoesRotas.devolver, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const itemId = parseInt(req.params.itemId);
    
    if (isNaN(itemId) || itemId <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID do item inválido'
      });
    }

    const { quantidade, observacao } = req.body;

    if (!quantidade || isNaN(parseInt(quantidade)) || parseInt(quantidade) <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Quantidade inválida'
      });
    }

    // Buscar item
    const item = await Item.findByPk(itemId, { transaction });
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    const quantidadeNum = parseInt(quantidade);

    // Criar devolução
    const movimentacaoDevolucao = await Movimentacao.create({
      item_id: itemId,
      usuario_id: req.usuario.id,
      tipo: 'devolucao',
      quantidade: quantidadeNum,
      destinatario: 'Devolução Direta',
      observacao: observacao || 'Devolução direta',
      data_movimentacao: new Date()
    }, { transaction });

    // Atualizar item
    const novaQuantidade = item.quantidade + quantidadeNum;
    const novoStatus = novaQuantidade > 0 ? 'disponivel' : item.status;

    await item.update({ 
      quantidade: novaQuantidade,
      status: novoStatus
    }, { transaction });

    // 🔔 VERIFICAR ALERTAS
    await verificarAlertasEstoque(itemId, transaction);

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Devolução direta registrada!',
      data: movimentacaoDevolucao
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erro na devolução direta:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao registrar devolução',
      error: error.message
    });
  }
});

// GET /api/movimentacoes/:id/devolucoes - Listar devoluções de uma movimentação
router.get('/:id/devolucoes', auth, permissoesRotas.consultar, async (req, res) => {
  try {
    const movimentacaoId = parseInt(req.params.id);
    
    const movimentacao = await Movimentacao.findByPk(movimentacaoId);
    if (!movimentacao) {
      return res.status(404).json({
        success: false,
        message: 'Movimentação não encontrada'
      });
    }

    const devolucoes = await Movimentacao.findAll({
      where: {
        tipo: 'devolucao',
        [Op.or]: [
          { observacao: { [Op.like]: `%Devolução da movimentação #${movimentacaoId}%` } },
          { observacao: { [Op.like]: `%saída #${movimentacaoId}%` } }
        ]
      },
      include: [
        { 
          model: Usuario, 
          as: 'usuario',
          attributes: ['id', 'nome', 'email']
        }
      ],
      order: [['data_movimentacao', 'DESC']]
    });

    const quantidadeTotalDevolvida = devolucoes.reduce((total, dev) => total + dev.quantidade, 0);

    res.json({
      success: true,
      data: {
        movimentacao: {
          id: movimentacao.id,
          tipo: movimentacao.tipo,
          quantidade: movimentacao.quantidade,
          destinatario: movimentacao.destinatario,
          data_movimentacao: movimentacao.data_movimentacao
        },
        devolucoes: devolucoes,
        resumo: {
          total_devolvido: quantidadeTotalDevolvida,
          pendente: movimentacao.quantidade - quantidadeTotalDevolvida,
          totalmente_devolvido: quantidadeTotalDevolvida >= movimentacao.quantidade,
          percentual_devolvido: ((quantidadeTotalDevolvida / movimentacao.quantidade) * 100).toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar devoluções:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar devoluções'
    });
  }
});

// =============================================
// 🗑️ ROTA DELETE - COMPLETA
// =============================================

// DELETE /api/movimentacoes/:id - Excluir movimentação
router.delete('/:id', auth, permissoesRotas.criar, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const movimentacaoId = parseInt(req.params.id);
    
    if (isNaN(movimentacaoId) || movimentacaoId <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    // Buscar movimentação
    const movimentacao = await Movimentacao.findByPk(movimentacaoId, {
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'quantidade', 'status']
        }
      ],
      transaction
    });

    if (!movimentacao) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Movimentação não encontrada'
      });
    }

    // 🔥 VALIDAR SE PODE EXCLUIR (apenas nas primeiras 24 horas)
    const dataMovimentacao = new Date(movimentacao.data_movimentacao);
    const hoje = new Date();
    const diferencaHoras = (hoje - dataMovimentacao) / (1000 * 60 * 60);
    
    if (diferencaHoras > 24) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Só é possível excluir movimentações nas primeiras 24 horas após o registro',
        detalhes: {
          horas_passadas: diferencaHoras.toFixed(2),
          data_movimentacao: dataMovimentacao,
          data_atual: hoje
        }
      });
    }

    // 🔥 VALIDAR SE JÁ TEM DEVOLUÇÕES
    const quantidadeDevolvida = await calcularQuantidadeDevolvida(movimentacaoId, transaction);
    if (quantidadeDevolvida > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir movimentação que já possui devoluções registradas',
        quantidade_devolvida: quantidadeDevolvida
      });
    }

    const item = movimentacao.item;
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    // 🔥 REVERTER O ESTOQUE conforme o tipo
    let novaQuantidade = item.quantidade;
    
    if (movimentacao.tipo === 'saida' || movimentacao.tipo === 'transferencia') {
      // Se for saída/transferência, devolver ao estoque
      novaQuantidade = item.quantidade + movimentacao.quantidade;
    } else if (movimentacao.tipo === 'entrada' || movimentacao.tipo === 'devolucao') {
      // Se for entrada/devolução, remover do estoque
      novaQuantidade = item.quantidade - movimentacao.quantidade;
      
      if (novaQuantidade < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir esta movimentação pois o estoque ficaria negativo',
          estoque_atual: item.quantidade,
          quantidade_movimentacao: movimentacao.quantidade,
          estoque_resultante: novaQuantidade
        });
      }
    }

    // Atualizar status do item
    let novoStatus = item.status;
    if (novaQuantidade > 0) {
      novoStatus = 'disponivel';
    } else if (novaQuantidade === 0) {
      novoStatus = 'em_uso';
    }

    // Atualizar item
    await item.update({ 
      quantidade: novaQuantidade,
      status: novoStatus
    }, { transaction });

    // Excluir movimentação
    await movimentacao.destroy({ transaction });

    // 🔔 VERIFICAR ALERTAS
    await verificarAlertasEstoque(item.id, transaction);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Movimentação excluída com sucesso!',
      data: {
        id: movimentacaoId,
        item_nome: item.nome,
        tipo: movimentacao.tipo,
        quantidade: movimentacao.quantidade,
        novo_estoque: novaQuantidade
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro ao excluir movimentação:', error);
    
    res.status(400).json({
      success: false,
      message: 'Erro ao excluir movimentação',
      error: error.message
    });
  }
});

// =============================================
// 📊 ROTAS DE DASHBOARD
// =============================================

// GET /api/movimentacoes/dashboard/recentes - Movimentações recentes
router.get('/dashboard/recentes', auth, permissoesRotas.consultar, async (req, res) => {
  try {
    const movimentacoes = await Movimentacao.findAll({
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio']
        },
        { 
          model: Usuario, 
          as: 'usuario',
          attributes: ['id', 'nome']
        }
      ],
      order: [['data_movimentacao', 'DESC']],
      limit: 10,
      distinct: true
    });

    res.json({
      success: true,
      data: movimentacoes
    });
  } catch (error) {
    console.error('Erro ao buscar movimentações recentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar movimentações recentes'
    });
  }
});

// GET /api/movimentacoes/dashboard/estatisticas - Estatísticas
router.get('/dashboard/estatisticas', auth, permissoesRotas.consultar, async (req, res) => {
  try {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const [
      totalMovimentacoes,
      saidasMes,
      atrasadosCount
    ] = await Promise.all([
      Movimentacao.count({
        where: {
          data_movimentacao: {
            [Op.between]: [primeiroDiaMes, hoje]
          }
        },
        distinct: true
      }),
      Movimentacao.count({
        where: {
          tipo: 'saida',
          data_movimentacao: {
            [Op.between]: [primeiroDiaMes, hoje]
          }
        },
        distinct: true
      }),
      Movimentacao.count({
        where: {
          tipo: 'saida',
          data_devolucao_prevista: {
            [Op.lt]: hoje
          }
        },
        distinct: true
      })
    ]);

    res.json({
      success: true,
      data: {
        movimentacoes_mes: totalMovimentacoes,
        saidas_mes: saidasMes,
        atrasados: atrasadosCount
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

module.exports = router;