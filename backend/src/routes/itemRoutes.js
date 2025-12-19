// backend/src/routes/itemRoutes.js - VERSÃO CORRIGIDA (SEM MIDDLEWARE INEXISTENTE)
const express = require('express');
const { Item, Categoria, Usuario, Movimentacao, Manutencao } = require('../models/associations');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const router = express.Router();

// 🆕 PERMISSÕES DE ROTAS CONFIGURADAS (SIMPLIFICADO)
const permissoesRotas = {
  // 🔍 CONSULTAS - Todos podem ver (se tiver permissão pode_consultar)
  consultar: (req, res, next) => {
    if (req.user?.permissoes?.consultar || 
        ['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista'].includes(req.user?.perfil)) {
      return next();
    }
    res.status(403).json({ 
      success: false, 
      message: 'Permissão para consultar itens negada' 
    });
  },
  
  // ✏️ CADASTRAR/EDITAR - Técnico/Analista podem (conforme banco)
  cadastrarEditar: (req, res, next) => {
    const perfil = req.user?.perfil;
    
    // ✅ PERMITIDOS: Admin, Estoque, Coordenador, Gerente, Técnico, Analista
    if (['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista'].includes(perfil)) {
      return next();
    }
    
    res.status(403).json({ 
      success: false, 
      message: 'Permissão para cadastrar/editar itens negada',
      perfil_atual: perfil
    });
  },
  
  // 🗑️ DELETAR - Apenas Admin
  deletar: (req, res, next) => {
    if (req.user?.perfil === 'admin') {
      return next();
    }
    res.status(403).json({ 
      success: false, 
      message: 'Apenas administradores podem deletar itens' 
    });
  }
};

// 🆕 FUNÇÃO: IDENTIFICAR MODELO PELO PREFIXO DO CÓDIGO
const identificarModeloPeloCodigo = (codigo_barras) => {
  const modelosConhecidos = {
    '3b0602': {
      nome: 'MikroTik Router hAP ac3',
      categoria_id: 3,
      descricao: 'Router wireless dual-band Gigabit Ethernet MikroTik',
      fabricante: 'MikroTik'
    },
    '3b0603': {
      nome: 'MikroTik Router RB4011',
      categoria_id: 3,
      descricao: 'Router advanced com 10 portas Gigabit MikroTik',
      fabricante: 'MikroTik'
    },
    'DL': {
      nome: 'Dell Latitude',
      categoria_id: 1,
      descricao: 'Notebook corporativo Dell Latitude',
      fabricante: 'Dell'
    },
    'LEN': {
      nome: 'Lenovo ThinkPad',
      categoria_id: 1,
      descricao: 'Notebook corporativo Lenovo ThinkPad',
      fabricante: 'Lenovo'
    }
  };

  for (const [prefixo, modelo] of Object.entries(modelosConhecidos)) {
    if (codigo_barras && codigo_barras.startsWith(prefixo)) {
      return { ...modelo, prefixo_encontrado: prefixo };
    }
  }
  return null;
};

// 🔍 GET /api/itens - Listar todos os itens com filtros
router.get('/', 
  auth, 
  permissoesRotas.consultar,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        categoria_id,
        status, 
        search,
        estoque_minimo
      } = req.query;
      
      const offset = (page - 1) * limit;
      const where = {};
      
      // 🔥 FILTROS
      if (categoria_id && !isNaN(parseInt(categoria_id))) {
        where.categoria_id = parseInt(categoria_id);
      }
      
      if (status && status !== 'undefined') {
        where.status = status;
      }
      
      if (estoque_minimo === 'true') {
        where.quantidade = {
          [Op.lte]: sequelize.col('estoque_minimo')
        };
      }
      
      // 🔍 BUSCA
      if (search && search.trim().length > 0) {
        const searchTerm = search.trim();
        where[Op.or] = [
          { nome: { [Op.like]: `%${searchTerm}%` } },
          { descricao: { [Op.like]: `%${searchTerm}%` } },
          { patrimonio: { [Op.like]: `%${searchTerm}%` } },
          { numero_serie: { [Op.like]: `%${searchTerm}%` } },
          { codigo_barras: { [Op.like]: `%${searchTerm}%` } }
        ];
      }
      
      const { count, rows: itens } = await Item.findAndCountAll({
        where,
        include: [
          { 
            model: Categoria, 
            as: 'categoria',
            attributes: ['id', 'nome']
          },
          { 
            model: Usuario, 
            as: 'criador',
            attributes: ['id', 'nome']
          }
        ],
        order: [['nome', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        success: true,
        data: itens,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar itens'
      });
    }
});

// 🔍 GET /api/itens/disponiveis - Itens disponíveis para solicitação
router.get('/disponiveis', 
  auth,
  permissoesRotas.consultar,
  async (req, res) => {
    try {
      const itens = await Item.findAll({
        where: {
          status: 'disponivel',
          quantidade: { [Op.gt]: 0 }
        },
        include: [
          { 
            model: Categoria, 
            as: 'categoria',
            attributes: ['id', 'nome']
          }
        ],
        order: [['nome', 'ASC']]
      });
      
      res.json({
        success: true,
        data: itens,
        count: itens.length
      });
    } catch (error) {
      console.error('Erro ao buscar itens disponíveis:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar itens disponíveis'
      });
    }
});

// 📊 GET /api/itens/alerta/estoque-baixo-detailed - Itens com estoque baixo DETALHADO
router.get('/alerta/estoque-baixo-detailed', 
  auth, 
  permissoesRotas.consultar,
  async (req, res) => {
    try {
      const { nivel = 'todos', page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {
        quantidade: {
          [Op.lte]: sequelize.col('estoque_minimo')
        }
      };
      
      // 🔥 FILTRAR POR NÍVEL
      if (nivel === 'critico') {
        where.quantidade = { [Op.lte]: 2 };
      } else if (nivel === 'baixo') {
        where.quantidade = { 
          [Op.and]: [
            { [Op.gt]: 2 },
            { [Op.lte]: sequelize.col('estoque_minimo') }
          ]
        };
      } else if (nivel === 'zero') {
        where.quantidade = { [Op.eq]: 0 };
      }
      
      // 📊 CONTAR TOTAL
      const totalItens = await Item.count({ where });
      
      // 📦 BUSCAR ITENS COM PAGINAÇÃO
      const itens = await Item.findAll({
        where,
        include: [
          { 
            model: Categoria, 
            as: 'categoria',
            attributes: ['id', 'nome']
          },
          {
            model: Usuario,
            as: 'criador',
            attributes: ['id', 'nome']
          }
        ],
        order: [['quantidade', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // 📈 ESTATÍSTICAS DETALHADAS
      const totalValorEstoque = await Item.sum('valor_compra', {
        where: {
          ...where,
          valor_compra: { [Op.ne]: null }
        }
      });
      
      const estoqueCriticoCount = await Item.count({
        where: {
          quantidade: { [Op.lte]: 2 },
          quantidade: { [Op.gte]: 0 }
        }
      });
      
      const estoqueZeroCount = await Item.count({
        where: { quantidade: 0 }
      });
      
      const estoqueBaixoCount = await Item.count({
        where: {
          quantidade: { 
            [Op.and]: [
              { [Op.gt]: 2 },
              { [Op.lte]: sequelize.col('estoque_minimo') }
            ]
          }
        }
      });
      
      // 🎯 CORREÇÃO: Retornar estrutura que o frontend espera
      res.json({
        success: true,
        data: {
          itens,
          estatisticas: {
            total: totalItens,
            critico: estoqueCriticoCount,      // ✅ Nome que o frontend espera
            baixo: estoqueBaixoCount,          // ✅ Nome que o frontend espera  
            zero: estoqueZeroCount,            // ✅ Nome que o frontend espera
            valor_total_estoque: parseFloat(totalValorEstoque || 0).toFixed(2)
          },
          paginacao: {
            pagina_atual: parseInt(page),
            itens_por_pagina: parseInt(limit),
            total_paginas: Math.ceil(totalItens / limit),
            total_itens: totalItens
          },
          filtros: {
            nivel,
            limite: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      });
      
    } catch (error) {
      console.error('💥 Erro ao buscar estoque baixo detalhado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estoque baixo detalhado',
        error: error.message
      });
    }
});

// 🔍 GET /api/itens/:id - Buscar item por ID
router.get('/:id', 
  auth, 
  permissoesRotas.consultar,
  async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId) || itemId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const item = await Item.findByPk(itemId, {
        include: [
          { 
            model: Categoria, 
            as: 'categoria',
            attributes: ['id', 'nome', 'descricao']
          },
          { 
            model: Usuario, 
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          }
        ]
      });
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Erro ao buscar item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar item'
      });
    }
});

// 🔍 GET /api/itens/codigo-barras/:codigo - Consultar por código de barras
router.get('/codigo-barras/:codigo', 
  auth,
  permissoesRotas.consultar,
  async (req, res) => {
    try {
      const { codigo } = req.params;
      
      const itemExistente = await Item.findOne({
        where: { codigo_barras: codigo },
        include: [
          { 
            model: Categoria, 
            as: 'categoria',
            attributes: ['id', 'nome']
          }
        ]
      });
      
      if (itemExistente) {
        return res.json({
          success: true,
          encontrado: true,
          data: itemExistente
        });
      }
      
      const modeloIdentificado = identificarModeloPeloCodigo(codigo);
      
      res.json({
        success: true,
        encontrado: false,
        sugestao_cadastro: modeloIdentificado,
        mensagem: modeloIdentificado 
          ? `Sugestão: ${modeloIdentificado.nome}`
          : 'Código não encontrado'
      });
      
    } catch (error) {
      console.error('Erro ao consultar código de barras:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao consultar código'
      });
    }
});

// ➕ POST /api/itens - Criar novo item
router.post('/', 
  auth, 
  permissoesRotas.cadastrarEditar,
  upload.single('foto'),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }
      
      const itemData = {
        ...req.body,
        criado_por: req.user.id
      };
      
      // 🔥 CONVERSÕES DE TIPO
      if (itemData.quantidade) itemData.quantidade = parseInt(itemData.quantidade);
      if (itemData.estoque_minimo) itemData.estoque_minimo = parseInt(itemData.estoque_minimo);
      if (itemData.valor_compra) itemData.valor_compra = parseFloat(itemData.valor_compra);
      if (itemData.categoria_id) itemData.categoria_id = parseInt(itemData.categoria_id);
      
      if (itemData.data_aquisicao) {
        itemData.data_aquisicao = new Date(itemData.data_aquisicao);
      }
      
      if (itemData.especificacoes && typeof itemData.especificacoes === 'string') {
        try {
          itemData.especificacoes = JSON.parse(itemData.especificacoes);
        } catch (e) {
          // Mantém como string
        }
      }
      
      if (req.file) {
        itemData.foto = `/uploads/${req.file.filename}`;
      }
      
      // 🔥 VALIDAÇÕES
      if (!itemData.nome || itemData.nome.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório'
        });
      }
      
      if (!itemData.categoria_id) {
        return res.status(400).json({
          success: false,
          message: 'Categoria é obrigatória'
        });
      }
      
      const categoriaExists = await Categoria.findByPk(itemData.categoria_id);
      if (!categoriaExists) {
        return res.status(400).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
      
      const novoItem = await Item.create(itemData);
      
      // 📥 REGISTRAR MOVIMENTAÇÃO DE ENTRADA
      if (novoItem.quantidade > 0) {
        await Movimentacao.create({
          item_id: novoItem.id,
          usuario_id: req.user.id,
          tipo: 'entrada',
          quantidade: novoItem.quantidade,
          observacao: 'Cadastro inicial do item'
        });
      }
      
      const itemCompleto = await Item.findByPk(novoItem.id, {
        include: [
          { model: Categoria, as: 'categoria' },
          { model: Usuario, as: 'criador' }
        ]
      });
      
      res.status(201).json({
        success: true,
        message: 'Item criado com sucesso!',
        data: itemCompleto
      });
      
    } catch (error) {
      console.error('Erro ao criar item:', error);
      
      let mensagemErro = 'Erro ao criar item';
      if (error.name === 'SequelizeUniqueConstraintError') {
        mensagemErro = 'Código de barras, patrimônio ou número de série já existe';
      } else if (error.name === 'SequelizeValidationError') {
        mensagemErro = 'Dados de validação inválidos';
      }
      
      res.status(400).json({
        success: false,
        message: mensagemErro,
        error: error.message
      });
    }
});

// ➕ POST /api/itens/cadastro-rapido - Cadastro rápido por código
router.post('/cadastro-rapido', 
  auth, 
  permissoesRotas.cadastrarEditar,
  async (req, res) => {
    try {
      const {
        codigo_barras,
        nome,
        descricao,
        categoria_id,
        localizacao = 'Almoxarifado TI',
        quantidade = 1,
        estoque_minimo = 0
      } = req.body;
      
      // 🔥 VALIDAÇÃO
      if (!codigo_barras || codigo_barras.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Código de barras é obrigatório'
        });
      }
      
      // 🔥 VERIFICAR SE JÁ EXISTE
      const itemExistente = await Item.findOne({ 
        where: { codigo_barras: codigo_barras.trim() } 
      });
      
      if (itemExistente) {
        return res.status(400).json({
          success: false,
          message: 'Código de barras já existe'
        });
      }
      
      // 🔍 IDENTIFICAR MODELO
      let modeloIdentificado = null;
      if (codigo_barras && (!nome || !categoria_id)) {
        modeloIdentificado = identificarModeloPeloCodigo(codigo_barras);
      }
      
      const itemData = {
        codigo_barras: codigo_barras.trim(),
        nome: nome || (modeloIdentificado?.nome || `Equipamento ${codigo_barras}`),
        descricao: descricao || (modeloIdentificado?.descricao || `Equipamento cadastrado via código: ${codigo_barras}`),
        categoria_id: categoria_id || (modeloIdentificado?.categoria_id || 3),
        localizacao,
        status: 'disponivel',
        estado: 'novo',
        numero_serie: `COD-${codigo_barras}`,
        patrimonio: `PAT-${Date.now()}`,
        quantidade: parseInt(quantidade),
        estoque_minimo: parseInt(estoque_minimo),
        criado_por: req.user.id
      };
      
      const novoItem = await Item.create(itemData);
      
      // 📥 MOVIMENTAÇÃO
      if (novoItem.quantidade > 0) {
        await Movimentacao.create({
          item_id: novoItem.id,
          usuario_id: req.user.id,
          tipo: 'entrada',
          quantidade: novoItem.quantidade,
          observacao: 'Cadastro rápido via código de barras'
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Item cadastrado rapidamente!',
        data: novoItem,
        modelo_identificado: !!modeloIdentificado
      });
      
    } catch (error) {
      console.error('Erro no cadastro rápido:', error);
      res.status(400).json({
        success: false,
        message: 'Erro no cadastro rápido',
        error: error.message
      });
    }
});

// ✏️ PUT /api/itens/:id - Atualizar item
router.put('/:id', 
  auth, 
  permissoesRotas.cadastrarEditar,
  upload.single('foto'),
  async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId) || itemId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const item = await Item.findByPk(itemId);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
      }
      
      const updateData = { ...req.body };
      
      // 🔥 ATUALIZAR FOTO
      if (req.file) {
        updateData.foto = `/uploads/${req.file.filename}`;
      }
      
      // 🔥 CONVERSÕES
      if (updateData.quantidade) updateData.quantidade = parseInt(updateData.quantidade);
      if (updateData.estoque_minimo) updateData.estoque_minimo = parseInt(updateData.estoque_minimo);
      if (updateData.valor_compra) updateData.valor_compra = parseFloat(updateData.valor_compra);
      if (updateData.categoria_id) updateData.categoria_id = parseInt(updateData.categoria_id);
      
      await item.update(updateData);
      
      res.json({
        success: true,
        message: 'Item atualizado com sucesso!',
        data: item
      });
      
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar item',
        error: error.message
      });
    }
});

// 🗑️ DELETE /api/itens/:id - Deletar item
router.delete('/:id', 
  auth, 
  permissoesRotas.deletar,
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const itemId = parseInt(req.params.id);
      
      if (isNaN(itemId) || itemId <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const item = await Item.findByPk(itemId, { transaction });
      
      if (!item) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Item não encontrado'
        });
      }
      
      // 🧹 LIMPAR DEPENDÊNCIAS
      await Movimentacao.destroy({ 
        where: { item_id: itemId },
        transaction 
      });
      
      await Manutencao.destroy({ 
        where: { item_id: itemId },
        transaction 
      });
      
      await item.destroy({ transaction });
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Item deletado com sucesso!'
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao deletar item:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar item',
        error: error.message
      });
    }
});

// 📊 GET /api/itens/alerta/estoque-baixo - Itens com estoque baixo
router.get('/alerta/estoque-baixo', 
  auth, 
  permissoesRotas.consultar,
  async (req, res) => {
    try {
      const { nivel = 'todos' } = req.query;
      
      const where = {
        quantidade: {
          [Op.lte]: sequelize.col('estoque_minimo')
        }
      };
      
      if (nivel === 'critico') {
        where.quantidade = { [Op.lte]: 2 };
      } else if (nivel === 'baixo') {
        where.quantidade = { 
          [Op.and]: [
            { [Op.gt]: 2 },
            { [Op.lte]: sequelize.col('estoque_minimo') }
          ]
        };
      } else if (nivel === 'zero') {
        where.quantidade = { [Op.eq]: 0 };
      }
      
      const itens = await Item.findAll({
        where,
        include: [
          { 
            model: Categoria, 
            as: 'categoria',
            attributes: ['id', 'nome']
          }
        ],
        order: [['quantidade', 'ASC']]
      });
      
      res.json({
        success: true,
        data: itens,
        count: itens.length
      });
      
    } catch (error) {
      console.error('Erro ao buscar estoque baixo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estoque baixo'
      });
    }
});

module.exports = router;