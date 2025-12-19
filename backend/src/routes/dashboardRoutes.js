// routes/dashboardRoutes.js - VERSÃO COMPLETA E ATUALIZADA COM DASHBOARD DE APROVAÇÃO
const express = require('express');
const { sequelize } = require('../config/database');
const { 
  Usuario, 
  Categoria, 
  Item, 
  Movimentacao, 
  Manutencao, 
  AlertasEstoque,
  Solicitacao,
  SolicitacaoItens,
  ModeloEquipamento,
  HistoricoSolicitacoes
} = require('../models/associations');
const { auth, authorizeProfiles } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 🔒 MIDDLEWARE ESPECÍFICO PARA DASHBOARD
// Apenas admin e técnico responsável (com acesso_dashboard = true)
router.use(auth, (req, res, next) => {
  // Verificar se usuário tem acesso ao dashboard
  if (!req.user.permissao_acesso_dashboard && 
      !['admin', 'admin_estoque', 'coordenador', 'gerente'].includes(req.user.perfil)) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissão para dashboard necessária.'
    });
  }
  next();
});

// =============================================
// DASHBOARD PRINCIPAL
// =============================================

// GET - Dados do dashboard principal COM DADOS REAIS
router.get('/', async (req, res) => {
  try {
    console.log('📊 Dashboard acessado por:', req.user.nome, '- Perfil:', req.user.perfil);
    
    // Buscar dados reais do banco
    const [
      totalItens,
      totalCategorias,
      itensEmManutencao,
      itensEmUso,
      itensDisponiveis,
      itensEstoqueBaixo,
      manutencoesAbertas,
      totalMovimentacoes,
      alertasAtivos
    ] = await Promise.all([
      // Total de itens
      Item.count(),
      
      // Total de categorias
      Categoria.count(),
      
      // Itens em manutenção
      Item.count({ where: { status: 'manutencao' } }),
      
      // Itens em uso
      Item.count({ where: { status: 'em_uso' } }),
      
      // Itens disponíveis
      Item.count({ where: { status: 'disponivel' } }),
      
      // Itens com estoque baixo (quantidade <= estoque_minimo)
      Item.count({ 
        where: { 
          quantidade: { [Op.lte]: sequelize.col('estoque_minimo') },
          quantidade: { [Op.gt]: 0 } // Não incluir estoque zero
        }
      }),
      
      // Manutenções abertas
      Manutencao.count({ where: { status: { [Op.in]: ['aberta', 'em_andamento'] } } }),
      
      // Movimentações dos últimos 30 dias
      Movimentacao.count({
        where: {
          data_movimentacao: {
            [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Alertas ativos não lidos
      AlertasEstoque.count({ where: { lido: false } })
    ]);

    // Calcular valor do patrimônio
    const patrimonioResult = await Item.sum('valor_compra', {
      where: { 
        status: { [Op.in]: ['disponivel', 'em_uso', 'reservado'] }
      }
    });
    const valorPatrimonio = patrimonioResult || 0;

    // Itens por categoria
    const itensPorCategoria = await Categoria.findAll({
      attributes: [
        'id',
        'nome',
        [sequelize.fn('COUNT', sequelize.col('itens.id')), 'total_itens']
      ],
      include: [{
        model: Item,
        as: 'itens',
        attributes: [],
        required: false
      }],
      group: ['Categoria.id', 'Categoria.nome'],
      order: [[sequelize.literal('total_itens'), 'DESC']]
    });

    // Últimas movimentações (7 dias)
    const ultimasMovimentacoes = await Movimentacao.findAll({
      where: {
        data_movimentacao: {
          [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio'],
          required: false
        },
        { 
          model: Usuario, 
          as: 'usuario',
          attributes: ['id', 'nome'],
          required: false
        }
      ],
      order: [['data_movimentacao', 'DESC']],
      limit: 10
    });

    // Manutenções recentes
    const manutencoesRecentes = await Manutencao.findAll({
      where: {
        status: { [Op.in]: ['aberta', 'em_andamento'] }
      },
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio'],
          required: false
        },
        { 
          model: Usuario, 
          as: 'tecnico',
          attributes: ['id', 'nome'],
          required: false
        }
      ],
      order: [['data_abertura', 'DESC']],
      limit: 5
    });

    // Alertas de estoque crítico
    const alertasCriticos = await AlertasEstoque.findAll({
      where: { 
        lido: false,
        nivel_alerta: { [Op.in]: ['critico', 'zero'] }
      },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'nome', 'quantidade', 'estoque_minimo'],
          required: false
        }
      ],
      order: [['data_alerta', 'DESC']],
      limit: 5
    });

    const dashboardData = {
      success: true,
      message: 'Dashboard carregado com sucesso!',
      data: {
        usuario: {
          nome: req.user.nome,
          perfil: req.user.perfil,
          acesso_dashboard: req.user.permissao_acesso_dashboard
        },
        estatisticas: {
          totalItens,
          totalCategorias,
          itensEmManutencao,
          itensEmUso,
          itensDisponiveis,
          itensEstoqueBaixo,
          manutencoesAbertas,
          movimentacoesRecentes: totalMovimentacoes,
          alertasAtivos,
          valorPatrimonio: parseFloat(valorPatrimonio.toFixed(2))
        },
        itensPorCategoria: itensPorCategoria.map(cat => ({
          id: cat.id,
          nome: cat.nome,
          total_itens: cat.get('total_itens')
        })),
        ultimasMovimentacoes,
        manutencoesRecentes,
        alertasCriticos
      }
    };
    
    console.log('📊 Dashboard gerado com sucesso para:', req.user.nome);
    res.json(dashboardData);
  } catch (error) {
    console.error('💥 Erro no dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar dashboard',
      error: error.message
    });
  }
});

// =============================================
// DASHBOARD DE APROVAÇÃO (ADMIN ESTOQUE)
// =============================================

// 🎯 DASHBOARD DE APROVAÇÃO PARA ADMIN ESTOQUE
router.get('/aprovacao', authorizeProfiles('admin_estoque'), async (req, res) => {
  try {
    const { user } = req;
    const { periodo = 'hoje' } = req.query;

    console.log('👑 Dashboard de aprovação acessado por:', user.nome);

    // 🎯 Calcular datas do período
    let dataInicio, dataFim;
    const hoje = new Date();
    
    switch (periodo) {
      case 'hoje':
        dataInicio = new Date(hoje.setHours(0, 0, 0, 0));
        dataFim = new Date(hoje.setHours(23, 59, 59, 999));
        break;
      case 'semana':
        const primeiroDiaSemana = new Date(hoje);
        primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
        dataInicio = new Date(primeiroDiaSemana.setHours(0, 0, 0, 0));
        dataFim = new Date(hoje.setHours(23, 59, 59, 999));
        break;
      case 'mes':
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataInicio = new Date(primeiroDiaMes.setHours(0, 0, 0, 0));
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        dataFim = new Date(ultimoDiaMes.setHours(23, 59, 59, 999));
        break;
      default:
        dataInicio = new Date(hoje.setHours(0, 0, 0, 0));
        dataFim = new Date(hoje.setHours(23, 59, 59, 999));
    }

    // 📊 SOLICITAÇÕES PENDENTES (status = 'aprovada' - aguardando estoque)
    const solicitacoesPendentes = await Solicitacao.findAll({
      where: {
        status: 'aprovada',
        data_aprovacao_coordenador: {
          [Op.between]: [dataInicio, dataFim]
        }
      },
      include: [
        {
          model: Usuario,
          as: 'usuario_solicitante',
          attributes: ['id', 'nome', 'departamento'],
          required: true
        },
        {
          model: Usuario,
          as: 'usuario_aprovador',
          attributes: ['id', 'nome'],
          required: false
        },
        {
          model: SolicitacaoItens,
          as: 'itens',
          attributes: [
            'id',
            'nome_item',
            'quantidade_solicitada',
            'quantidade_aprovada',
            'valor_unitario_estimado',
            'tipo_item'
          ],
          required: false
        }
      ],
      order: [
        ['prioridade', 'DESC'],
        ['data_aprovacao_coordenador', 'ASC']
      ]
    });

    // 📊 ESTATÍSTICAS GERAIS
    const estatisticas = await Promise.all([
      // Total de solicitações no período
      Solicitacao.count({
        where: {
          status: 'aprovada',
          data_aprovacao_coordenador: { [Op.between]: [dataInicio, dataFim] }
        }
      }),
      
      // Solicitações pendentes
      Solicitacao.count({
        where: {
          status: 'aprovada',
          data_aprovacao_coordenador: { [Op.between]: [dataInicio, dataFim] }
        }
      }),
      
      // Solicitações aprovadas pelo estoque no período
      Solicitacao.count({
        where: {
          status: 'entregue',
          data_entrega: { [Op.between]: [dataInicio, dataFim] }
        }
      }),
      
      // Solicitações rejeitadas pelo estoque no período
      Solicitacao.count({
        where: {
          status: 'rejeitada_estoque',
          data_processamento_estoque: { [Op.between]: [dataInicio, dataFim] }
        }
      }),
      
      // Valor total pendente
      Solicitacao.sum('orcamento_estimado', {
        where: {
          status: 'aprovada',
          data_aprovacao_coordenador: { [Op.between]: [dataInicio, dataFim] }
        }
      }),
      
      // Total de itens no patrimônio
      Item.count({ where: { status: { [Op.ne]: 'descarte' } } }),
      
      // Valor total do patrimônio
      Item.sum('valor_compra', {
        where: { status: { [Op.ne]: 'descarte' } }
      }),
      
      // Itens com estoque baixo
      Item.count({
        where: {
          quantidade: { [Op.lte]: sequelize.col('estoque_minimo') },
          status: 'disponivel'
        }
      })
    ]);

    // 📊 DISTRIBUIÇÃO POR PRIORIDADE
    const distribuicaoPrioridade = await Solicitacao.findAll({
      where: {
        status: 'aprovada',
        data_aprovacao_coordenador: { [Op.between]: [dataInicio, dataFim] }
      },
      attributes: [
        'prioridade',
        [sequelize.fn('COUNT', sequelize.col('id')), 'value']
      ],
      group: ['prioridade'],
      order: [
        [sequelize.literal(`
          CASE prioridade 
            WHEN 'urgente' THEN 1
            WHEN 'alta' THEN 2
            WHEN 'media' THEN 3
            WHEN 'baixa' THEN 4
          END
        `)]
      ]
    });

    // 📊 DISTRIBUIÇÃO POR TIPO
    const distribuicaoTipo = await Solicitacao.findAll({
      where: {
        status: 'aprovada',
        data_aprovacao_coordenador: { [Op.between]: [dataInicio, dataFim] }
      },
      attributes: [
        'tipo',
        [sequelize.fn('COUNT', sequelize.col('id')), 'value']
      ],
      group: ['tipo']
    });

    // 📊 DETALHES DAS SOLICITAÇÕES
    const solicitacoesComDetalhes = await Promise.all(solicitacoesPendentes.map(async (solicitacao) => {
      const totalItens = await SolicitacaoItens.sum('quantidade_solicitada', {
        where: { solicitacao_id: solicitacao.id }
      });

      const valorTotal = await SolicitacaoItens.findAll({
        where: { solicitacao_id: solicitacao.id },
        attributes: [
          [sequelize.fn('SUM', 
            sequelize.literal('quantidade_solicitada * COALESCE(valor_unitario_estimado, 0)')
          ), 'total']
        ],
        raw: true
      });

      return {
        id: solicitacao.id,
        codigo_solicitacao: solicitacao.codigo_solicitacao,
        titulo: solicitacao.titulo,
        prioridade: solicitacao.prioridade,
        tipo: solicitacao.tipo,
        tipo_solicitacao: solicitacao.tipo_solicitacao,
        data_solicitacao: solicitacao.data_solicitacao,
        data_aprovacao_coordenador: solicitacao.data_aprovacao_coordenador,
        data_envio_estoque: solicitacao.data_envio_estoque,
        orcamento_estimado: solicitacao.orcamento_estimado,
        solicitante_nome: solicitacao.usuario_solicitante?.nome,
        departamento: solicitacao.usuario_solicitante?.departamento,
        aprovador_nome: solicitacao.usuario_aprovador?.nome,
        total_itens: totalItens || 0,
        valor_total_calculado: valorTotal[0]?.total || 0,
        itens: solicitacao.itens
      };
    }));

    res.json({
      success: true,
      data: {
        estatisticas: {
          totalSolicitacoes: estatisticas[0] || 0,
          solicitacoesPendentes: estatisticas[1] || 0,
          solicitacoesAprovadasPeriodo: estatisticas[2] || 0,
          solicitacoesRejeitadasPeriodo: estatisticas[3] || 0,
          valorTotalPendente: estatisticas[4] || 0,
          totalItensPatrimonio: estatisticas[5] || 0,
          valorPatrimonioTotal: estatisticas[6] || 0,
          itensBaixoEstoque: estatisticas[7] || 0
        },
        solicitacoesPendentes: solicitacoesComDetalhes,
        distribuicaoPrioridade: distribuicaoPrioridade.map(item => ({
          name: item.prioridade,
          value: item.get('value')
        })),
        distribuicaoTipo: distribuicaoTipo.map(item => ({
          name: item.tipo,
          value: item.get('value')
        }))
      }
    });

  } catch (error) {
    console.error('💥 Erro no dashboard de aprovação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar dados do dashboard de aprovação',
      details: error.message
    });
  }
});

// 🎯 APROVAR LOTE DE SOLICITAÇÕES
router.post('/aprovacao/aprovar-lote', authorizeProfiles('admin_estoque'), async (req, res) => {
  try {
    const { user } = req;
    const { solicitacao_ids, observacao } = req.body;

    if (!solicitacao_ids || !Array.isArray(solicitacao_ids) || solicitacao_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma solicitação selecionada'
      });
    }

    // Iniciar transação
    const transaction = await sequelize.transaction();

    try {
      const processados = [];

      for (const solicitacaoId of solicitacao_ids) {
        // Verificar se solicitação existe e está no status correto
        const solicitacao = await Solicitacao.findOne({
          where: {
            id: solicitacaoId,
            status: 'aprovada'
          },
          transaction
        });

        if (!solicitacao) {
          processados.push({
            id: solicitacaoId,
            success: false,
            error: 'Solicitação não encontrada ou já processada'
          });
          continue;
        }

        // Buscar itens da solicitação
        const itensSolicitacao = await SolicitacaoItens.findAll({
          where: { solicitacao_id: solicitacaoId },
          transaction
        });

        // Processar cada item do estoque
        for (const itemSolicitacao of itensSolicitacao) {
          if (itemSolicitacao.tipo_item === 'estoque' && itemSolicitacao.item_id) {
            // Atualizar estoque do item
            const item = await Item.findByPk(itemSolicitacao.item_id, { transaction });
            if (item) {
              const novaQuantidade = item.quantidade - itemSolicitacao.quantidade_solicitada;
              
              if (novaQuantidade < 0) {
                throw new Error(`Estoque insuficiente para item ${item.nome}`);
              }

              await item.update({
                quantidade: novaQuantidade
              }, { transaction });

              // Registrar movimentação
              await Movimentacao.create({
                item_id: item.id,
                usuario_id: user.id,
                tipo: 'saida',
                quantidade: itemSolicitacao.quantidade_solicitada,
                destinatario: solicitacao.usuario_solicitante_id,
                observacao: `Entrega via solicitação ${solicitacao.codigo_solicitacao}`
              }, { transaction });
            }
          }

          // Atualizar status do item da solicitação
          await itemSolicitacao.update({
            status_item: 'entregue',
            quantidade_entregue: itemSolicitacao.quantidade_solicitada
          }, { transaction });
        }

        // Atualizar status da solicitação
        await solicitacao.update({
          status: 'entregue',
          usuario_estoque_id: user.id,
          data_processamento_estoque: new Date(),
          data_entrega: new Date(),
          observacoes_estoque: observacao || 'Aprovado em lote via dashboard'
        }, { transaction });

        // Registrar histórico
        await HistoricoSolicitacoes.create({
          solicitacao_id: solicitacao.id,
          usuario_id: user.id,
          acao: 'entrega',
          descricao: `Solicitação entregue em lote. Observação: ${observacao || 'Nenhuma'}`
        }, { transaction });

        processados.push({
          id: solicitacaoId,
          success: true
        });
      }

      // Commit da transação
      await transaction.commit();

      const totalSucesso = processados.filter(p => p.success).length;
      const totalErro = processados.filter(p => !p.success).length;

      res.json({
        success: true,
        data: {
          processados,
          totalSucesso,
          totalErro,
          message: `${totalSucesso} solicitação(ões) processadas com sucesso`
        }
      });

    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('💥 Erro ao aprovar lote:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitações em lote',
      details: error.message
    });
  }
});

// 🎯 REJEITAR LOTE DE SOLICITAÇÕES
router.post('/aprovacao/rejeitar-lote', authorizeProfiles('admin_estoque'), async (req, res) => {
  try {
    const { user } = req;
    const { solicitacao_ids, motivo } = req.body;

    if (!solicitacao_ids || !Array.isArray(solicitacao_ids) || solicitacao_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma solicitação selecionada'
      });
    }

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Motivo da rejeição é obrigatório'
      });
    }

    // Iniciar transação
    const transaction = await sequelize.transaction();

    try {
      const processados = [];

      for (const solicitacaoId of solicitacao_ids) {
        // Verificar se solicitação existe e está no status correto
        const solicitacao = await Solicitacao.findOne({
          where: {
            id: solicitacaoId,
            status: 'aprovada'
          },
          transaction
        });

        if (!solicitacao) {
          processados.push({
            id: solicitacaoId,
            success: false,
            error: 'Solicitação não encontrada ou já processada'
          });
          continue;
        }

        // Atualizar status da solicitação
        await solicitacao.update({
          status: 'rejeitada_estoque',
          usuario_estoque_id: user.id,
          data_processamento_estoque: new Date(),
          motivo_rejeicao: motivo
        }, { transaction });

        // Atualizar status dos itens da solicitação
        await SolicitacaoItens.update({
          status_item: 'rejeitado'
        }, {
          where: { solicitacao_id: solicitacaoId },
          transaction
        });

        // Registrar histórico
        await HistoricoSolicitacoes.create({
          solicitacao_id: solicitacao.id,
          usuario_id: user.id,
          acao: 'rejeicao_estoque',
          descricao: `Solicitação rejeitada em lote. Motivo: ${motivo}`
        }, { transaction });

        processados.push({
          id: solicitacaoId,
          success: true
        });
      }

      // Commit da transação
      await transaction.commit();

      const totalSucesso = processados.filter(p => p.success).length;
      const totalErro = processados.filter(p => !p.success).length;

      res.json({
        success: true,
        data: {
          processados,
          totalSucesso,
          totalErro,
          message: `${totalSucesso} solicitação(ões) rejeitadas com sucesso`
        }
      });

    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('💥 Erro ao rejeitar lote:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitações em lote',
      details: error.message
    });
  }
});

// =============================================
// RELATÓRIOS E FUNCIONALIDADES EXISTENTES
// =============================================

// 📈 ENDPOINT PARA ALERTAS DE ESTOQUE
router.get('/alertas-estoque', async (req, res) => {
  try {
    const alertas = await AlertasEstoque.findAll({
      where: { lido: false },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'nome', 'categoria_id', 'quantidade', 'estoque_minimo'],
          include: [{
            model: Categoria,
            as: 'categoria',
            attributes: ['id', 'nome'],
            required: false
          }],
          required: false
        }
      ],
      order: [
        ['nivel_alerta', 'DESC'], // critico > baixo > zero
        ['data_alerta', 'DESC']
      ]
    });

    res.json({
      success: true,
      data: alertas,
      total: alertas.length
    });
  } catch (error) {
    console.error('💥 Erro ao buscar alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar alertas de estoque',
      error: error.message
    });
  }
});

// ✅ MARCAR ALERTA COMO LIDO
router.patch('/alertas/:id/marcar-lido', async (req, res) => {
  try {
    const alerta = await AlertasEstoque.findByPk(req.params.id);
    
    if (!alerta) {
      return res.status(404).json({
        success: false,
        message: 'Alerta não encontrado'
      });
    }

    await alerta.update({
      lido: true,
      data_leitura: new Date()
    });

    res.json({
      success: true,
      message: 'Alerta marcado como lido'
    });
  } catch (error) {
    console.error('💥 Erro ao marcar alerta como lido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar alerta como lido',
      error: error.message
    });
  }
});

// 📊 RELATÓRIO DE MOVIMENTAÇÕES
router.get('/relatorios/movimentacoes', authorizeProfiles('admin', 'admin_estoque', 'coordenador', 'gerente'), async (req, res) => {
  try {
    console.log('📤 Relatório de movimentações solicitado por:', req.user.nome);
    
    const { data_inicio, data_fim, tipo } = req.query;
    const where = {};

    // Aplicar filtros
    if (data_inicio && data_fim) {
      where.data_movimentacao = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim)]
      };
    }
    if (tipo) where.tipo = tipo;

    const movimentacoes = await Movimentacao.findAll({
      where,
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio', 'categoria_id'],
          include: [{
            model: Categoria,
            as: 'categoria',
            attributes: ['id', 'nome'],
            required: false
          }],
          required: false
        },
        { 
          model: Usuario, 
          as: 'usuario',
          attributes: ['id', 'nome', 'perfil', 'departamento'],
          required: false
        }
      ],
      order: [['data_movimentacao', 'DESC']],
      limit: 500
    });

    // Estatísticas detalhadas
    const totalMovimentacoes = movimentacoes.length;
    const entradas = movimentacoes.filter(m => m.tipo === 'entrada').length;
    const saidas = movimentacoes.filter(m => m.tipo === 'saida').length;
    const devolucoes = movimentacoes.filter(m => m.tipo === 'devolucao').length;
    const ajustes = movimentacoes.filter(m => m.tipo === 'ajuste').length;

    // Quantidade total movimentada
    const quantidadeTotal = movimentacoes.reduce((total, m) => total + (m.quantidade || 0), 0);

    res.json({
      success: true,
      data: {
        movimentacoes,
        estatisticas: {
          total_movimentacoes: totalMovimentacoes,
          entradas,
          saidas,
          devolucoes,
          ajustes,
          quantidade_total: quantidadeTotal
        },
        filtros: {
          data_inicio,
          data_fim,
          tipo
        }
      }
    });

  } catch (error) {
    console.error('💥 Erro no relatório de movimentações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de movimentações',
      error: error.message
    });
  }
});

// 🛠️ RELATÓRIO DE MANUTENÇÕES
router.get('/relatorios/manutencoes', authorizeProfiles('admin', 'admin_estoque', 'coordenador', 'gerente'), async (req, res) => {
  try {
    console.log('🔧 Relatório de manutenções solicitado por:', req.user.nome);
    
    const { data_inicio, data_fim, status, tipo_manutencao } = req.query;
    const where = {};

    if (data_inicio && data_fim) {
      where.data_abertura = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim)]
      };
    }
    if (status) where.status = status;
    if (tipo_manutencao) where.tipo_manutencao = tipo_manutencao;

    const manutencoes = await Manutencao.findAll({
      where,
      include: [
        { 
          model: Item, 
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio', 'numero_serie'],
          required: false
        },
        { 
          model: Usuario, 
          as: 'tecnico',
          attributes: ['id', 'nome', 'email'],
          required: false
        }
      ],
      order: [['data_abertura', 'DESC']],
      limit: 200
    });

    // Estatísticas
    const totalManutencoes = manutencoes.length;
    const manutencoesAbertas = manutencoes.filter(m => m.status === 'aberta').length;
    const manutencoesAndamento = manutencoes.filter(m => m.status === 'em_andamento').length;
    const manutencoesConcluidas = manutencoes.filter(m => m.status === 'concluida').length;
    const custoTotal = manutencoes.reduce((total, manut) => total + (parseFloat(manut.custo_manutencao) || 0), 0);

    // Tempo médio de resolução (apenas para concluídas)
    const manutencoesConcluidasComData = manutencoes.filter(m => m.status === 'concluida' && m.data_conclusao);
    const tempoMedio = manutencoesConcluidasComData.length > 0 
      ? manutencoesConcluidasComData.reduce((total, manut) => {
          const diff = new Date(manut.data_conclusao) - new Date(manut.data_abertura);
          return total + (diff / (1000 * 60 * 60 * 24)); // dias
        }, 0) / manutencoesConcluidasComData.length
      : 0;

    res.json({
      success: true,
      data: {
        manutencoes,
        estatisticas: {
          total_manutencoes: totalManutencoes,
          manutencoes_abertas: manutencoesAbertas,
          manutencoes_andamento: manutencoesAndamento,
          manutencoes_concluidas: manutencoesConcluidas,
          custo_total: parseFloat(custoTotal.toFixed(2)),
          tempo_medio_resolucao_dias: parseFloat(tempoMedio.toFixed(1))
        }
      }
    });

  } catch (error) {
    console.error('💥 Erro no relatório de manutenções:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de manutenções',
      error: error.message
    });
  }
});

// 📦 RELATÓRIO DE ITENS
router.get('/relatorios/itens', authorizeProfiles('admin', 'admin_estoque', 'coordenador', 'gerente'), async (req, res) => {
  try {
    console.log('📦 Relatório de itens solicitado por:', req.user.nome);
    
    const { categoria_id, status, estoque_baixo } = req.query;
    const where = {};

    if (categoria_id) where.categoria_id = categoria_id;
    if (status) where.status = status;
    if (estoque_baixo === 'true') {
      where.quantidade = { [Op.lte]: sequelize.col('estoque_minimo') };
    }

    const itens = await Item.findAll({
      where,
      include: [
        { 
          model: Categoria, 
          as: 'categoria',
          attributes: ['id', 'nome'],
          required: false
        },
        {
          model: Usuario,
          as: 'criador',
          attributes: ['id', 'nome'],
          required: false
        }
      ],
      order: [['nome', 'ASC']],
      limit: 500
    });

    // Estatísticas
    const totalItens = itens.length;
    const valorPatrimonio = itens.reduce((total, item) => total + (parseFloat(item.valor_compra) || 0), 0);
    const estoqueBaixoCount = itens.filter(item => item.quantidade <= item.estoque_minimo && item.quantidade > 0).length;
    const estoqueZeroCount = itens.filter(item => item.quantidade === 0).length;

    res.json({
      success: true,
      data: itens,
      estatisticas: {
        total_itens: totalItens,
        valor_total_patrimonio: parseFloat(valorPatrimonio.toFixed(2)),
        estoque_baixo: estoqueBaixoCount,
        estoque_zero: estoqueZeroCount
      }
    });

  } catch (error) {
    console.error('💥 Erro no relatório de itens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de itens',
      error: error.message
    });
  }
});

// 📊 RELATÓRIO DE SOLICITAÇÕES
router.get('/relatorios/solicitacoes', authorizeProfiles('admin', 'admin_estoque', 'coordenador', 'gerente'), async (req, res) => {
  try {
    console.log('📋 Relatório de solicitações solicitado por:', req.user.nome);
    
    const { data_inicio, data_fim, status, tipo_solicitacao } = req.query;
    const where = {};

    if (data_inicio && data_fim) {
      where.data_solicitacao = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim)]
      };
    }
    if (status) where.status = status;
    if (tipo_solicitacao) where.tipo_solicitacao = tipo_solicitacao;

    const solicitacoes = await Solicitacao.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: 'usuario_solicitante',
          attributes: ['id', 'nome', 'departamento'],
          required: true
        },
        {
          model: Usuario,
          as: 'usuario_aprovador',
          attributes: ['id', 'nome'],
          required: false
        },
        {
          model: Usuario,
          as: 'usuario_estoque',
          attributes: ['id', 'nome'],
          required: false
        }
      ],
      order: [['data_solicitacao', 'DESC']],
      limit: 200
    });

    // Estatísticas
    const totalSolicitacoes = solicitacoes.length;
    const solicitacoesPendentes = solicitacoes.filter(s => s.status === 'pendente_aprovacao').length;
    const solicitacoesAprovadas = solicitacoes.filter(s => s.status === 'aprovada').length;
    const solicitacoesEntregues = solicitacoes.filter(s => s.status === 'entregue').length;
    const solicitacoesRejeitadas = solicitacoes.filter(s => s.status.includes('rejeitada')).length;
    const valorTotal = solicitacoes.reduce((total, sol) => total + (parseFloat(sol.orcamento_estimado) || 0), 0);

    res.json({
      success: true,
      data: {
        solicitacoes,
        estatisticas: {
          total_solicitacoes: totalSolicitacoes,
          solicitacoes_pendentes: solicitacoesPendentes,
          solicitacoes_aprovadas: solicitacoesAprovadas,
          solicitacoes_entregues: solicitacoesEntregues,
          solicitacoes_rejeitadas: solicitacoesRejeitadas,
          valor_total: parseFloat(valorTotal.toFixed(2))
        }
      }
    });

  } catch (error) {
    console.error('💥 Erro no relatório de solicitações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de solicitações',
      error: error.message
    });
  }
});

module.exports = router;