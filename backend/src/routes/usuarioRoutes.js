// 📁 src/routes/usuarioRoutes.js - VERSÃO CORRIGIDA (SEM LIMITE DE ITENS)
const express = require('express');
const Usuario = require('../models/Usuario');
const Movimentacao = require('../models/Movimentacao');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const router = express.Router();

// 🔐 TODAS AS ROTAS REQUEREM AUTENTICAÇÃO
router.use(auth);

// =============================================
// 🔍 ROTAS DE CONSULTA
// =============================================

// GET /api/usuarios - Listar todos os usuários 
router.get('/', 
  authorize('admin', 'coordenador', 'gerente', 'admin_estoque'),
  async (req, res) => {
    try {
      console.log('🔍 GET /api/usuarios - Usuário solicitante:', {
        id: req.user.id,
        nome: req.user.nome,
        perfil: req.user.perfil
      });

      const usuarioSolicitante = await Usuario.findByPk(req.user.id);
      if (!usuarioSolicitante) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      let where = { ativo: true };
      
      if (usuarioSolicitante.permissao_gerenciar_usuarios) {
        console.log('👑 Usuário tem permissão para gerenciar - vendo todos');
      }
      else if (usuarioSolicitante.perfil === 'admin_estoque') {
        where.perfil = {
          [Op.in]: ['tecnico', 'analista', 'estagiario', 'aprendiz']
        };
        console.log('📊 Admin estoque - vendo apenas técnicos/analistas/estagiários/aprendizes');
      } 
      else if (['coordenador', 'gerente'].includes(usuarioSolicitante.perfil)) {
        where = {
          ...where,
          [Op.or]: [
            { id: req.user.id },
            { usuario_superior_id: req.user.id }
          ]
        };
        console.log('👥 Coordenador/Gerente - vendo apenas sua equipe');
      }

      const usuarios = await Usuario.findAll({
        where,
        attributes: { 
          exclude: ['senha'],
          // ✅ CORRIGIDO: REMOVIDO max_itens_solicitacao (não existe mais)
          include: [
            'pode_consultar',
            'pode_solicitar',
            'pode_cadastrar',
            'pode_editar',
            'permissao_aprovar_solicitacoes',
            'permissao_gerenciar_usuarios',
            // REMOVIDO: 'max_itens_solicitacao', ❌ COLUNA NÃO EXISTE
            'valor_max_solicitacao', // ✅ APENAS ESTE
            'prazo_max_devolucao'
          ]
        },
        order: [
          ['perfil', 'ASC'],
          ['nome', 'ASC']
        ]
      });

      console.log(`📊 Total de usuários encontrados: ${usuarios.length}`);
      
      res.json({
        success: true,
        count: usuarios.length,
        data: usuarios
      });
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuários',
        error: error.message
      });
    }
});

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', 
  authorize('admin', 'coordenador', 'gerente', 'admin_estoque', 'tecnico', 'analista', 'estagiario', 'aprendiz'),
  async (req, res) => {
    try {
      const usuarioId = parseInt(req.params.id);
      
      if (isNaN(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const usuario = await Usuario.findByPk(usuarioId, {
        attributes: { 
          exclude: ['senha'],
          include: [
            'pode_consultar',
            'pode_solicitar',
            'pode_cadastrar',
            'pode_editar',
            'permissao_aprovar_solicitacoes',
            'permissao_gerenciar_usuarios',
            // REMOVIDO: 'max_itens_solicitacao', ❌ COLUNA NÃO EXISTE
            'valor_max_solicitacao', // ✅ APENAS ESTE
            'prazo_max_devolucao'
          ]
        }
      });
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      // ✅ VERIFICAÇÕES DE PERMISSÃO
      if (req.user.perfil === 'admin_estoque') {
        if (!['tecnico', 'analista', 'estagiario', 'aprendiz'].includes(usuario.perfil)) {
          return res.status(403).json({
            success: false,
            message: 'Admin estoque só pode visualizar técnicos, analistas, estagiários ou aprendizes'
          });
        }
      }
      else if (['coordenador', 'gerente'].includes(req.user.perfil)) {
        if (usuario.id !== req.user.id && usuario.usuario_superior_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Você só pode visualizar sua própria conta ou membros da sua equipe'
          });
        }
      }
      else if (['tecnico', 'analista', 'estagiario', 'aprendiz'].includes(req.user.perfil)) {
        if (usuario.id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Você só pode visualizar sua própria conta'
          });
        }
      }
      
      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuário'
      });
    }
});

// =============================================
// 🏢 ROTAS DE EQUIPE
// =============================================

// GET /api/usuarios/minha-equipe - Minha equipe (subordinados)
router.get('/minha-equipe', 
  authorize('admin', 'coordenador', 'gerente'),
  async (req, res) => {
    try {
      console.log('👥 GET /minha-equipe - Usuário:', req.user.nome);
      
      const usuario = await Usuario.findByPk(req.user.id);
      
      const equipe = await usuario.obterEquipe();
      console.log(`✅ Equipe encontrada: ${equipe.length} membros`);
      
      res.json({
        success: true,
        data: equipe,
        count: equipe.length
      });
    } catch (error) {
      console.error('Erro ao obter equipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter equipe'
      });
    }
});

// GET /api/usuarios/equipe/disponiveis - Usuários disponíveis para gestão
router.get('/equipe/disponiveis', 
  authorize('admin', 'coordenador', 'gerente', 'admin_estoque'),
  async (req, res) => {
    try {
      console.log('👥 GET /equipe/disponiveis - Usuário solicitante:', {
        id: req.user.id,
        nome: req.user.nome,
        perfil: req.user.perfil
      });
      
      const usuarioSolicitante = await Usuario.findByPk(req.user.id);
      
      let where = {
        ativo: true,
        id: { [Op.ne]: req.user.id }
      };
      
      if (usuarioSolicitante.perfil === 'admin_estoque') {
        where.perfil = {
          [Op.in]: ['tecnico', 'analista', 'estagiario', 'aprendiz']
        };
        console.log('📊 Admin estoque - vendo apenas técnicos/analistas/estagiários/aprendizes disponíveis');
      }
      else if (usuarioSolicitante.perfil === 'admin') {
        where.perfil = { 
          [Op.notIn]: ['admin']
        };
      }
      else if (['coordenador', 'gerente'].includes(usuarioSolicitante.perfil)) {
        where.perfil = { 
          [Op.notIn]: ['admin', 'coordenador', 'gerente', 'admin_estoque']
        };
      }
      
      const usuariosDisponiveis = await Usuario.findAll({
        where,
        attributes: [
          'id', 'nome', 'email', 'perfil', 'departamento', 
          'usuario_superior_id', 'ativo',
          'pode_cadastrar', 'pode_editar'
        ],
        order: [['nome', 'ASC']]
      });
      
      console.log(`✅ Usuários disponíveis: ${usuariosDisponiveis.length}`);
      
      res.json({
        success: true,
        data: usuariosDisponiveis,
        count: usuariosDisponiveis.length
      });
    } catch (error) {
      console.error('Erro ao buscar usuários disponíveis:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar usuários disponíveis'
      });
    }
});

// =============================================
// ✏️ ROTAS DE GESTÃO DE PERMISSÕES (CORRIGIDAS)
// =============================================

// PUT /api/usuarios/liberar/:id - Liberar/atualizar permissões de usuário
router.put('/liberar/:id', 
  authorize('admin', 'coordenador', 'gerente'),
  async (req, res) => {
    try {
      const usuarioId = parseInt(req.params.id);
      
      if (isNaN(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const { 
        pode_consultar,
        pode_solicitar,
        pode_cadastrar,
        pode_editar,
        // REMOVIDO: max_itens_solicitacao, ❌ COLUNA NÃO EXISTE
        valor_max_solicitacao,
        prazo_max_devolucao
      } = req.body;
      
      const usuarioSolicitante = await Usuario.findByPk(req.user.id);
      const usuarioParaLiberar = await Usuario.findByPk(usuarioId);
      
      if (!usuarioParaLiberar) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      console.log('🔐 Verificando permissões para liberar:', {
        solicitante: usuarioSolicitante.perfil,
        alvo: usuarioParaLiberar.perfil
      });
      
      if (usuarioSolicitante.perfil === 'admin') {
        if (usuarioParaLiberar.perfil === 'admin') {
          return res.status(400).json({
            success: false,
            message: 'Não pode gerenciar outros administradores'
          });
        }
      }
      else if (['coordenador', 'gerente'].includes(usuarioSolicitante.perfil)) {
        if (usuarioParaLiberar.usuario_superior_id !== usuarioSolicitante.id) {
          return res.status(403).json({
            success: false,
            message: 'Você só pode gerenciar seus subordinados diretos'
          });
        }
      }
      
      const dadosAtualizacao = {};
      
      if (pode_consultar !== undefined) dadosAtualizacao.pode_consultar = !!pode_consultar;
      if (pode_solicitar !== undefined) dadosAtualizacao.pode_solicitar = !!pode_solicitar;
      if (pode_cadastrar !== undefined) dadosAtualizacao.pode_cadastrar = !!pode_cadastrar;
      if (pode_editar !== undefined) dadosAtualizacao.pode_editar = !!pode_editar;
      
      // ✅ REMOVIDO: Não atualizar max_itens_solicitacao pois não existe
      // if (max_itens_solicitacao !== undefined) {
      //   dadosAtualizacao.max_itens_solicitacao = parseInt(max_itens_solicitacao) || 15;
      // }
      
      if (valor_max_solicitacao !== undefined) {
        dadosAtualizacao.valor_max_solicitacao = parseFloat(valor_max_solicitacao) || 2000.00;
      }
      
      if (prazo_max_devolucao !== undefined) {
        dadosAtualizacao.prazo_max_devolucao = parseInt(prazo_max_devolucao) || 45;
      }
      
      await usuarioParaLiberar.update(dadosAtualizacao);
      
      const usuarioAtualizado = await Usuario.findByPk(usuarioId, {
        attributes: { exclude: ['senha'] }
      });
      
      res.json({
        success: true,
        message: 'Permissões atualizadas com sucesso!',
        data: usuarioAtualizado
      });
      
    } catch (error) {
      console.error('Erro ao liberar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao liberar usuário'
      });
    }
});

// PUT /api/usuarios/equipe/adicionar/:id - Adicionar usuário à equipe (CORRIGIDO)
router.put('/equipe/adicionar/:id', 
  authorize('admin', 'coordenador', 'gerente'),
  async (req, res) => {
    try {
      const usuarioId = parseInt(req.params.id);
      
      if (isNaN(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const usuarioSolicitante = await Usuario.findByPk(req.user.id);
      const usuarioParaGerenciar = await Usuario.findByPk(usuarioId);
      
      if (!usuarioParaGerenciar) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      if (usuarioParaGerenciar.id === usuarioSolicitante.id) {
        return res.status(400).json({
          success: false,
          message: 'Não pode adicionar você mesmo à equipe'
        });
      }
      
      if (usuarioSolicitante.perfil === 'admin') {
        if (usuarioParaGerenciar.perfil === 'admin') {
          return res.status(400).json({
            success: false,
            message: 'Não pode gerenciar outros administradores'
          });
        }
      }
      else if (['coordenador', 'gerente'].includes(usuarioSolicitante.perfil)) {
        if (usuarioParaGerenciar.perfil === 'admin' || usuarioParaGerenciar.perfil === 'admin_estoque') {
          return res.status(400).json({
            success: false,
            message: 'Não pode adicionar administradores ou admin_estoque à equipe'
          });
        }
      }
      
      const permissoesPadrao = {
        tecnico: {
          pode_consultar: true,
          pode_solicitar: true,
          pode_cadastrar: true,
          pode_editar: true,
          // REMOVIDO: max_itens_solicitacao: 15, ❌ COLUNA NÃO EXISTE
          valor_max_solicitacao: 2000.00,
          prazo_max_devolucao: 45
        },
        analista: {
          pode_consultar: true,
          pode_solicitar: true,
          pode_cadastrar: true,
          pode_editar: true,
          // REMOVIDO: max_itens_solicitacao: 15,
          valor_max_solicitacao: 2000.00,
          prazo_max_devolucao: 45
        },
        estagiario: {
          pode_consultar: true,
          pode_solicitar: true,
          pode_cadastrar: false,
          pode_editar: false,
          // REMOVIDO: max_itens_solicitacao: 3,
          valor_max_solicitacao: 300.00,
          prazo_max_devolucao: 15
        },
        aprendiz: {
          pode_consultar: true,
          pode_solicitar: true,
          pode_cadastrar: false,
          pode_editar: false,
          // REMOVIDO: max_itens_solicitacao: 3,
          valor_max_solicitacao: 200.00,
          prazo_max_devolucao: 15
        }
      };
      
      const permissoes = permissoesPadrao[usuarioParaGerenciar.perfil] || {
        pode_consultar: true,
        pode_solicitar: false,
        pode_cadastrar: false,
        pode_editar: false
      };
      
      await usuarioParaGerenciar.update({
        usuario_superior_id: usuarioSolicitante.id,
        ...permissoes
      });
      
      res.json({
        success: true,
        message: `Usuário adicionado à sua equipe com permissões padrão para ${usuarioParaGerenciar.perfil}`,
        data: {
          id: usuarioParaGerenciar.id,
          nome: usuarioParaGerenciar.nome,
          perfil: usuarioParaGerenciar.perfil,
          permissoes: permissoes
        }
      });
      
    } catch (error) {
      console.error('Erro ao adicionar usuário à equipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar usuário à equipe'
      });
    }
});

// PUT /api/usuarios/equipe/remover/:id - Remover da equipe (CORRIGIDO)
router.put('/equipe/remover/:id', 
  authorize('admin', 'coordenador', 'gerente'),
  async (req, res) => {
    try {
      const usuarioId = parseInt(req.params.id);
      
      if (isNaN(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const usuarioSolicitante = await Usuario.findByPk(req.user.id);
      const usuarioParaRemover = await Usuario.findByPk(usuarioId);
      
      if (!usuarioParaRemover) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      if (usuarioParaRemover.usuario_superior_id !== usuarioSolicitante.id) {
        return res.status(403).json({
          success: false,
          message: 'Você só pode remover seus subordinados diretos'
        });
      }
      
      await usuarioParaRemover.update({
        usuario_superior_id: null,
        pode_consultar: true,
        pode_solicitar: false,
        pode_cadastrar: false,
        pode_editar: false,
        // REMOVIDO: max_itens_solicitacao: 5, ❌ COLUNA NÃO EXISTE
        valor_max_solicitacao: 1000.00,
        prazo_max_devolucao: 30
      });
      
      res.json({
        success: true,
        message: 'Usuário removido da equipe',
        data: {
          id: usuarioParaRemover.id,
          nome: usuarioParaRemover.nome
        }
      });
      
    } catch (error) {
      console.error('Erro ao remover usuário da equipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover usuário da equipe'
      });
    }
});

// =============================================
// ➕ ROTAS DE CRIAÇÃO/EDIÇÃO (CORRIGIDAS)
// =============================================

// POST /api/usuarios - Criar novo usuário (CORRIGIDO)
router.post('/', 
  authorize('admin', 'coordenador', 'gerente'),
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { nome, email, senha, perfil, departamento } = req.body;
      
      console.log('📝 Criando novo usuário:', { nome, email, perfil });
      
      if (!nome || !email || !senha) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
      }
      
      const usuarioExistente = await Usuario.findOne({ 
        where: { email: email.toLowerCase().trim() },
        transaction 
      });
      
      if (usuarioExistente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }
      
      const usuarioSolicitante = await Usuario.findByPk(req.user.id, { transaction });
      
      const perfilCriado = perfil || 'tecnico';
      
      if (usuarioSolicitante.perfil === 'admin') {
        if (perfilCriado === 'admin') {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Só pode criar um administrador se você for administrador'
          });
        }
      }
      else if (['coordenador', 'gerente'].includes(usuarioSolicitante.perfil)) {
        if (!['tecnico', 'analista', 'estagiario', 'aprendiz'].includes(perfilCriado)) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Coordenadores/gerentes só podem criar técnicos, analistas, estagiários ou aprendizes'
          });
        }
      }
      
      const permissoesIniciais = {
        pode_consultar: true,
        pode_solicitar: ['tecnico', 'analista'].includes(perfilCriado),
        pode_cadastrar: ['tecnico', 'analista'].includes(perfilCriado),
        pode_editar: ['tecnico', 'analista'].includes(perfilCriado),
        permissao_gerenciar_usuarios: false,
        permissao_aprovar_solicitacoes: false,
        // REMOVIDO: max_itens_solicitacao: 15, ❌ COLUNA NÃO EXISTE
        valor_max_solicitacao: 2000.00,
        prazo_max_devolucao: 45
      };
      
      const usuario = await Usuario.create({
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha,
        perfil: perfilCriado,
        departamento: departamento || 'TI',
        usuario_superior_id: usuarioSolicitante.id,
        ...permissoesIniciais
      }, { transaction });
      
      await transaction.commit();
      
      const usuarioSemSenha = usuario.toJSON();
      delete usuarioSemSenha.senha;
      
      console.log('✅ Usuário criado com sucesso:', usuarioSemSenha.nome);
      
      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso!',
        data: usuarioSemSenha
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao criar usuário:', error);
      res.status(400).json({
        success: false,
        message: 'Erro ao criar usuário',
        error: error.message
      });
    }
});

// PUT /api/usuarios/:id - Atualizar usuário (CORRIGIDO)
router.put('/:id', 
  authorize('admin', 'coordenador', 'gerente', 'admin_estoque'),
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const usuarioId = parseInt(req.params.id);
      
      if (isNaN(usuarioId) || usuarioId <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const usuarioSolicitante = await Usuario.findByPk(req.user.id, { transaction });
      const usuario = await Usuario.findByPk(usuarioId, { transaction });
      
      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      if (req.body.ativo === false && usuarioId === usuarioSolicitante.id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Não pode desativar sua própria conta'
        });
      }
      
      let podeEditar = false;
      
      if (usuarioSolicitante.perfil === 'admin') {
        podeEditar = true;
        if (usuario.perfil === 'admin' && usuario.id !== usuarioSolicitante.id) {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            message: 'Não pode editar outros administradores'
          });
        }
      }
      else if (['coordenador', 'gerente'].includes(usuarioSolicitante.perfil)) {
        if (usuario.usuario_superior_id === usuarioSolicitante.id) {
          podeEditar = true;
        }
      }
      else if (usuarioSolicitante.perfil === 'admin_estoque') {
        if (['tecnico', 'analista', 'estagiario', 'aprendiz'].includes(usuario.perfil)) {
          podeEditar = true;
        } else {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            message: 'Admin estoque só pode editar técnicos, analistas, estagiários ou aprendizes'
          });
        }
      }
      
      if (!podeEditar) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para editar este usuário',
          seu_perfil: usuarioSolicitante.perfil,
          usuario_perfil: usuario.perfil
        });
      }
      
      if (req.body.email && req.body.email !== usuario.email) {
        const emailExistente = await Usuario.findOne({
          where: { email: req.body.email.toLowerCase().trim() },
          transaction
        });
        
        if (emailExistente) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Email já cadastrado'
          });
        }
        req.body.email = req.body.email.toLowerCase().trim();
      }
      
      if (req.body.perfil && req.body.perfil === 'admin' && usuarioSolicitante.perfil !== 'admin') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores podem definir perfil como administrador'
        });
      }
      
      if (usuarioSolicitante.perfil === 'admin_estoque' && req.body.perfil) {
        if (['admin', 'coordenador', 'gerente', 'admin_estoque'].includes(req.body.perfil)) {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            message: 'Admin estoque só pode alterar para perfis de técnico, analista, estagiário ou aprendiz'
          });
        }
      }
      
      await usuario.update(req.body, { transaction });
      await transaction.commit();
      
      const usuarioAtualizado = await Usuario.findByPk(usuarioId, {
        attributes: { exclude: ['senha'] }
      });
      
      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso!',
        data: usuarioAtualizado
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao atualizar usuário:', error);
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar usuário'
      });
    }
});

// =============================================
// 🗑️ ROTA DE EXCLUSÃO
// =============================================

// DELETE /api/usuarios/:id - Deletar usuário (MANTIDO)
router.delete('/:id', 
  authorize('admin', 'coordenador', 'gerente'),
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const usuarioId = parseInt(req.params.id);
      
      if (isNaN(usuarioId) || usuarioId <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const usuarioSolicitante = await Usuario.findByPk(req.user.id, { transaction });
      const usuario = await Usuario.findByPk(usuarioId, { transaction });
      
      if (usuarioId === usuarioSolicitante.id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Não pode excluir sua própria conta'
        });
      }
      
      if (!usuario) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      let podeExcluir = false;
      
      if (usuarioSolicitante.perfil === 'admin') {
        podeExcluir = true;
      }
      else if (['coordenador', 'gerente'].includes(usuarioSolicitante.perfil)) {
        if (usuario.usuario_superior_id === usuarioSolicitante.id) {
          podeExcluir = true;
        }
      }
      
      if (!podeExcluir) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para excluir este usuário',
          seu_perfil: usuarioSolicitante.perfil,
          usuario_superior_id: usuario.usuario_superior_id
        });
      }
      
      const movimentacoesCount = await Movimentacao.count({
        where: { usuario_id: usuarioId },
        transaction
      });
      
      if (movimentacoesCount > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Usuário possui movimentações registradas'
        });
      }
      
      if (usuario.perfil === 'admin') {
        const adminsCount = await Usuario.count({
          where: { 
            perfil: 'admin',
            ativo: true,
            id: { [Op.ne]: usuarioId }
          },
          transaction
        });
        
        if (adminsCount === 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Não pode excluir o único administrador'
          });
        }
      }
      
      await usuario.destroy({ transaction });
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Usuário excluído com sucesso!'
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao excluir usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir usuário'
      });
    }
});

module.exports = router;