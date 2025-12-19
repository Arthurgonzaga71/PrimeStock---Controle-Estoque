// 📁 src/routes/authRoutes.js - CORRIGIDO (SEM LIMITE DE ITENS)
const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// POST - Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log('🔐 Tentativa de login:', { email });

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios.'
      });
    }

    // ✅ BUSCAR USUÁRIO COM TODOS OS CAMPOS NOVOS
    const usuario = await Usuario.findOne({ 
      where: { email }
    });
    
    if (!usuario) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    console.log('👤 Usuário encontrado:', usuario.nome, '- Perfil:', usuario.perfil);
    console.log('🔐 Verificando senha...');

    const senhaValida = await usuario.verificarSenha(senha);
    
    if (!senhaValida) {
      console.log('❌ Senha inválida para:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    if (!usuario.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário desativado.'
      });
    }

    console.log('✅ Login válido, gerando token...');

    // JWT DEFINITIVO
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        perfil: usuario.perfil 
      },
      "controle_estoque_ti_secret_key_2024_definitivo",
      { expiresIn: "30d" }
    );

    console.log('🎉 Login realizado com sucesso!');

    // ✅ RETORNAR CAMPOS CORRETOS (SEM max_itens_solicitacao)
    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          departamento: usuario.departamento,
          usuario_superior_id: usuario.usuario_superior_id,
          ativo: usuario.ativo,
          
          // 🔥 PERMISSÕES GRANULARES
          permissoes: usuario.obterPermissoes(),
          
          // ✅ CORRIGIDO: APENAS LIMITES DE VALOR E PRAZO
          limites: {
            valor_max: usuario.valor_max_solicitacao, // ✅ APENAS ESTE
            prazo_devolucao: usuario.prazo_max_devolucao
          },
          
          // CAMPOS DE COMPATIBILIDADE
          acesso_dashboard: usuario.permissao_acesso_dashboard,
          acesso_historico_completo: usuario.acesso_historico_completo,
          responsavel_estoque: usuario.responsavel_estoque,
          
          criado_em: usuario.criado_em,
          atualizado_em: usuario.atualizado_em
        },
        token,
        expiresIn: "30d"
      }
    });
  } catch (error) {
    console.error('💥 Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao realizar login',
      error: error.message
    });
  }
});

// POST - Criar novo usuário admin (CORRIGIDO)
router.post('/create-new-admin', async (req, res) => {
  try {
    console.log('👑 Criando novo usuário admin...');
    
    // Gerar email único
    const timestamp = Date.now();
    const emailUnico = `admin${timestamp}@ti.com`;
    
    // ✅ CORRIGIDO: SEM max_itens_solicitacao
    const novoAdmin = await Usuario.create({
      nome: 'Admin Definitivo',
      email: emailUnico,
      senha: '123456',
      perfil: 'admin',
      departamento: 'TI',
      permissao_criar_solicitacao: true,
      permissao_editar_propria: true,
      permissao_aprovar_solicitacoes: true,
      permissao_gerenciar_usuarios: true,
      permissao_acesso_dashboard: true,
      permissao_relatorios_completos: true,
      permissao_liberar_equipe: true,
      // ✅ REMOVIDO: max_itens_solicitacao: 50, // COLUNA NÃO EXISTE MAIS
      valor_max_solicitacao: 10000.00, // ✅ APENAS ESTE
      prazo_max_devolucao: 90
    });

    console.log('✅ NOVO ADMIN CRIADO:', novoAdmin.email);

    res.json({
      success: true,
      message: '✅ Novo usuário admin criado com sucesso!',
      data: {
        email: emailUnico,
        senha: '123456',
        usuario: {
          id: novoAdmin.id,
          nome: novoAdmin.nome,
          email: novoAdmin.email,
          perfil: novoAdmin.perfil,
          permissoes: novoAdmin.obterPermissoes()
        }
      }
    });

  } catch (error) {
    console.error('💥 Erro ao criar novo admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar novo admin',
      error: error.message
    });
  }
});

// GET - Perfil do usuário logado (CORRIGIDO)
router.get('/me', auth, async (req, res) => {
  try {
    // ✅ BUSCAR USUÁRIO COM CAMPOS CORRETOS
    const usuarioAtual = await Usuario.findByPk(req.user.id);

    if (!usuarioAtual) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        usuario: {
          id: usuarioAtual.id,
          nome: usuarioAtual.nome,
          email: usuarioAtual.email,
          perfil: usuarioAtual.perfil,
          departamento: usuarioAtual.departamento,
          usuario_superior_id: usuarioAtual.usuario_superior_id,
          ativo: usuarioAtual.ativo,
          permissoes: usuarioAtual.obterPermissoes(),
          // ✅ CORRIGIDO: APENAS LIMITES EXISTENTES
          limites: {
            valor_max: usuarioAtual.valor_max_solicitacao,
            prazo_devolucao: usuarioAtual.prazo_max_devolucao
          },
          criado_em: usuarioAtual.criado_em,
          atualizado_em: usuarioAtual.atualizado_em
        }
      }
    });
  } catch (error) {
    console.error('💥 Erro ao carregar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar perfil',
      error: error.message
    });
  }
});

// PUT - Alterar senha
router.put('/alterar-senha', auth, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias.'
      });
    }

    const usuario = await Usuario.findByPk(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    if (!(await usuario.verificarSenha(senhaAtual))) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta.'
      });
    }

    await usuario.update({ senha: novaSenha });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso!'
    });
  } catch (error) {
    console.error('💥 Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar senha',
      error: error.message
    });
  }
});

module.exports = router;