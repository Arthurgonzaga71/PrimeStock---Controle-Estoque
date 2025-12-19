// 📁 src/middleware/auth.js - VERSÃO COMPLETAMENTE CORRIGIDA
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// 🔐 MIDDLEWARE DE AUTENTICAÇÃO PRINCIPAL - SIMPLIFICADO
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '').trim();
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    // VERIFICAR E DECODIFICAR TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "controle_estoque_ti_secret_key_2024_definitivo");
    
    // BUSCAR USUÁRIO COM PERMISSÕES DO BANCO
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!usuario.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário desativado'
      });
    }

    // CORREÇÃO: Verificar e corrigir perfil vazio
    if (!usuario.perfil || usuario.perfil.trim() === '') {
      console.log('⚠️ PERFIL VAZIO DETECTADO! Corrigindo automaticamente...');
      
      // Determinar perfil baseado no email
      if (usuario.email === 'estoque@empresa.com') {
        usuario.perfil = 'admin_estoque';
        await usuario.update({ perfil: 'admin_estoque' });
        console.log('✅ Perfil corrigido para: admin_estoque');
      } else if (usuario.email.includes('admin')) {
        usuario.perfil = 'admin';
        await usuario.update({ perfil: 'admin' });
        console.log('✅ Perfil corrigido para: admin');
      } else {
        usuario.perfil = 'tecnico';
        await usuario.update({ perfil: 'tecnico' });
        console.log('✅ Perfil corrigido para padrão: tecnico');
      }
    }

    // ADICIONAR INFORMAÇÕES DO USUÁRIO AO REQUEST
    req.usuario = usuario;
    req.user = usuario.toJSON();
    
    console.log('✅ Usuário auth:', {
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
      email: usuario.email
    });
    
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
    
    let errorMessage = 'Token inválido';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expirado';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Token malformado';
    }
    
    res.status(401).json({
      success: false,
      message: errorMessage
    });
  }
};

// 🎯 MIDDLEWARE PRINCIPAL PARA PERFIS - VERSÃO DEFINITIVA CORRIGIDA
const authorizeProfiles = (...allowedProfiles) => {
  return (req, res, next) => {
    try {
      console.log('\n🔐 AUTHORIZE PROFILES - Verificando acesso');
      console.log('📍 Rota:', req.originalUrl || req.baseUrl + req.path);
      console.log('👤 Usuário:', req.user?.email);
      console.log('🎭 Perfil do usuário:', req.user?.perfil);
      console.log('📋 Perfis permitidos nesta rota:', allowedProfiles);

      if (!req.user) {
        console.log('❌ Usuário não autenticado');
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Se perfil estiver vazio, bloquear acesso
      if (!req.user.perfil || req.user.perfil.trim() === '') {
        console.log('❌ PERFIL VAZIO - ACESSO NEGADO');
        return res.status(403).json({
          success: false,
          message: 'Perfil não configurado. Contate o administrador.',
          perfil_atual: req.user.perfil,
          email: req.user.email
        });
      }

      // ✅ ADMIN SEMPRE TEM ACESSO (exceção especial)
      if (req.user.perfil === 'admin') {
        console.log('✅ ADMIN - Acesso total concedido');
        return next();
      }

      // ✅ VERIFICAÇÃO ESPECIAL PARA ROTAS DE DASHBOARD
      const isDashboardRoute = req.originalUrl?.includes('/dashboard') || 
                               req.path?.includes('/dashboard') ||
                               req.baseUrl?.includes('/dashboard');

      if (isDashboardRoute) {
        console.log('📊 É uma rota de dashboard - verificando permissão especial');
        
        // ✅ Perfis que têm acesso ao dashboard por padrão
        const perfisComDashboard = [
          'admin',
          'admin_estoque', 
          'tecnico_manutencao',
          'coordenador', 
          'gerente', 
          'tecnico', 
          'analista'
        ];
        
        // Verificar se tem permissão OU se o perfil está na lista
        const temPermissaoDashboard = req.user.permissao_acesso_dashboard === true || 
                                      perfisComDashboard.includes(req.user.perfil);
        
        console.log('🔍 Verificação dashboard:', {
          perfil: req.user.perfil,
          permissao_acesso_dashboard: req.user.permissao_acesso_dashboard,
          temPermissaoDashboard: temPermissaoDashboard
        });
        
        if (!temPermissaoDashboard) {
          console.log('❌ ACESSO AO DASHBOARD NEGADO');
          return res.status(403).json({
            success: false,
            message: `🔒 Acesso ao Dashboard Negado. Seu perfil "${req.user.perfil}" não tem permissão para acessar o dashboard.`,
            perfil_atual: req.user.perfil,
            perfis_com_dashboard: perfisComDashboard
          });
        }
        
        console.log('✅ PERMISSÃO DE DASHBOARD OK - Continuando...');
      }

      // ✅ VERIFICAÇÃO PRINCIPAL SIMPLIFICADA
      const perfilPermitido = allowedProfiles.length === 0 || allowedProfiles.includes(req.user.perfil);
      
      console.log('🔍 Resultado verificação:', {
        perfil: req.user.perfil,
        perfilPermitido
      });

      if (!perfilPermitido) {
        console.log('❌ ACESSO NEGADO - Perfil não está na lista permitida');
        
        return res.status(403).json({
          success: false,
          message: `🔒 Acesso Negado. Seu perfil "${req.user.perfil}" não tem acesso a esta página.`,
          perfil_atual: req.user.perfil,
          perfis_permitidos: allowedProfiles
        });
      }

      console.log('✅ ACESSO PERMITIDO para:', req.user.perfil);
      next();
    } catch (error) {
      console.error('💥 Erro no authorizeProfiles:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno no sistema de autorização'
      });
    }
  };
};

// 🔥 NOVO MIDDLEWARE ESPECIAL PARA ADMIN_ESTOQUE
const authorizeAdminEstoque = () => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      console.log('🔐 authorizeAdminEstoque - Verificando acesso para admin_estoque');
      console.log('📍 Rota atual:', req.originalUrl || req.baseUrl + req.path);
      console.log('👤 Usuário:', req.user.email, 'Perfil:', req.user.perfil);

      // Verificar se é admin_estoque
      if (req.user.perfil !== 'admin_estoque') {
        console.log('✅ Não é admin_estoque - passando para próximo middleware');
        return next();
      }

      // ✅ ROTAS PERMITIDAS PARA ADMIN_ESTOQUE
      const rotasPermitidasAdminEstoque = [
        '/dashboard',
        '/dashboard/',
        '/dashboard/aprovacao',
        '/solicitacoes',
        '/solicitacoes/',
        '/solicitacoes/para-estoque',
        '/estoque',
        '/estoque/',
        '/itens',
        '/itens/',
        '/categorias',
        '/movimentacoes'
      ];

      const rotaAtual = req.originalUrl || req.baseUrl + req.path;
      const rotaPermitida = rotasPermitidasAdminEstoque.some(rota => 
        rotaAtual.startsWith(rota)
      );

      if (!rotaPermitida) {
        console.log('❌ ADMIN_ESTOQUE - Rota não permitida:', rotaAtual);
        return res.status(403).json({
          success: false,
          message: `🔒 Acesso Negado para admin_estoque. Rotas permitidas: Dashboard, Solicitações, Estoque, Itens, Categorias e Movimentações.`,
          rota_atual: rotaAtual,
          rotas_permitidas: rotasPermitidasAdminEstoque
        });
      }

      console.log('✅ ADMIN_ESTOQUE - Acesso concedido para rota:', rotaAtual);
      next();
    } catch (error) {
      console.error('💥 Erro no authorizeAdminEstoque:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões de admin_estoque'
      });
    }
  };
};

// 🎯 MIDDLEWARE DE COMPATIBILIDADE
const authorizePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // ✅ Verificação especial para permissão 'dashboard'
      if (permission === 'dashboard') {
        const perfisComDashboard = [
          'admin',
          'admin_estoque', 
          'tecnico_manutencao',
          'coordenador', 
          'gerente', 
          'tecnico', 
          'analista'
        ];
        
        const temDashboard = req.user.permissao_acesso_dashboard === true || 
                            perfisComDashboard.includes(req.user.perfil);
        
        if (!temDashboard) {
          return res.status(403).json({
            success: false,
            message: `Permissão necessária: ${permission}`,
            perfil: req.user.perfil
          });
        }
        
        return next();
      }

      // Verificação padrão para outras permissões
      const hasPermission = req.user[`permissao_${permission}`];
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permissão necessária: ${permission}`,
          perfil: req.user.perfil
        });
      }

      next();
    } catch (error) {
      console.error('Erro no authorizePermission:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno'
      });
    }
  };
};

// 🔧 MIDDLEWARE PARA VERIFICAR SE PODE REALIZAR AÇÃO
const podeRealizar = (acao, recurso) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Verificar se usuário tem perfil válido
      if (!req.usuario.perfil || req.usuario.perfil.trim() === '') {
        return res.status(403).json({
          success: false,
          message: 'Perfil não configurado para realizar esta ação'
        });
      }

      const pode = req.usuario.podeAcao(acao, recurso, req.body);
      
      if (!pode) {
        return res.status(403).json({
          success: false,
          message: `Permissão negada: ${acao} ${recurso}`,
          perfil: req.usuario.perfil,
          acao,
          recurso
        });
      }

      next();
    } catch (error) {
      console.error('Erro no middleware podeRealizar:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões'
      });
    }
  };
};

// 📋 MIDDLEWARE PARA PERMISSÕES ESPECÍFICAS
const temPermissao = (permissao) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Verificar perfil válido
      if (!req.user.perfil || req.user.perfil.trim() === '') {
        return res.status(403).json({
          success: false,
          message: 'Perfil não configurado'
        });
      }

      const permissoesMap = {
        'consultar': req.user.pode_consultar,
        'solicitar': req.user.pode_solicitar,
        'cadastrar': req.user.pode_cadastrar,
        'editar': req.user.pode_editar,
        'aprovar': req.user.permissao_aprovar_solicitacoes,
        'gerenciar_usuarios': req.user.permissao_gerenciar_usuarios,
        'relatorios_completos': req.user.permissao_relatorios_completos,
        'dashboard': () => {
          // ✅ Lógica especial para dashboard
          const perfisComDashboard = [
            'admin',
            'admin_estoque', 
            'tecnico_manutencao',
            'coordenador', 
            'gerente', 
            'tecnico', 
            'analista'
          ];
          
          return req.user.permissao_acesso_dashboard === true || 
                 perfisComDashboard.includes(req.user.perfil);
        }
      };

      const temPermissao = typeof permissoesMap[permissao] === 'function' 
        ? permissoesMap[permissao]() 
        : permissoesMap[permissao];
      
      if (!temPermissao) {
        return res.status(403).json({
          success: false,
          message: `Permissão negada: ${permissao}`,
          perfil: req.user.perfil,
          possui_permissao: false
        });
      }

      next();
    } catch (error) {
      console.error('Erro no middleware temPermissao:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão'
      });
    }
  };
};

// 🏢 MIDDLEWARE PARA VERIFICAR EQUIPE/SUBORDINADOS
const podeVerEquipe = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Verificar perfil válido
      if (!req.user.perfil || req.user.perfil.trim() === '') {
        return res.status(403).json({
          success: false,
          message: 'Perfil não configurado para ver equipe'
        });
      }

      console.log('👥 podeVerEquipe - Verificando:', {
        perfil: req.user.perfil,
        nome: req.user.nome
      });
      
      // ✅ Admin, Coordenador e Gerente podem ver equipe
      if (['admin', 'coordenador', 'gerente'].includes(req.user.perfil)) {
        console.log('✅ É responsável - acesso permitido');
        return next();
      }
      
      // ✅ Técnico/Analista: Podem ver sua equipe se tiverem permissão
      if (['tecnico', 'analista'].includes(req.user.perfil) && req.user.permissao_gerenciar_usuarios) {
        console.log('✅ Técnico/Analista com permissão - acesso à equipe permitido');
        return next();
      }

      // ❌ NÃO PERMITIDO: Estagiário/Aprendiz ou sem permissão
      console.log('❌ Acesso à equipe negado para:', req.user.perfil);
      return res.status(403).json({
        success: false,
        message: 'Permissão para ver equipe negada',
        perfil: req.user.perfil
      });
      
    } catch (error) {
      console.error('Erro no middleware podeVerEquipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões de equipe'
      });
    }
  };
};

// 🔄 MIDDLEWARE PARA VERIFICAR LIMITES DO USUÁRIO
const verificarLimitesUsuario = () => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.usuario) {
        return next();
      }

      // Verificar perfil válido
      if (!req.user.perfil || req.user.perfil.trim() === '') {
        console.log('⚠️ Perfil vazio - ignorando verificação de limites');
        return next();
      }

      // 🔥 APENAS PARA TÉCNICO/ANALISTA/ESTAGIÁRIO/APRENDIZ
      if (['tecnico', 'analista', 'estagiario', 'aprendiz'].includes(req.user.perfil)) {
        
        // Se for criação de solicitação, verificar limites
        if (req.method === 'POST' && req.baseUrl.includes('solicitacoes')) {
          const resultado = await req.usuario.verificarLimiteSolicitacao(
            req.body.valor_total || 0,
            req.body.quantidade_itens || 0
          );
          
          if (!resultado.sucesso) {
            return res.status(400).json({
              success: false,
              message: resultado.motivo,
              limite_excedido: true
            });
          }
        }
        
        // Verificar se pode criar solicitação
        if (req.method === 'POST' && req.baseUrl.includes('solicitacoes')) {
          if (!req.user.pode_solicitar) {
            return res.status(403).json({
              success: false,
              message: 'Você não tem permissão para criar solicitações'
            });
          }
        }
        
        // Verificar se pode cadastrar itens
        if (req.method === 'POST' && req.baseUrl.includes('itens')) {
          if (!req.user.pode_cadastrar) {
            return res.status(403).json({
              success: false,
              message: 'Você não tem permissão para cadastrar itens'
            });
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      next();
    }
  };
};

// ✅ MIDDLEWARE: VERIFICAR SE PODE GERENCIAR USUÁRIOS - CORRIGIDO
const podeGerenciarUsuarios = () => {
  return async (req, res, next) => {
    try {
      console.log('🔐 middleware podeGerenciarUsuarios - Verificando...');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      console.log('👤 Usuário atual:', {
        id: req.user.id,
        nome: req.user.nome,
        perfil: req.user.perfil,
        permissao_gerenciar_usuarios: req.user.permissao_gerenciar_usuarios
      });
      
      // ✅ PERMITIR ADMIN, COORDENADOR, GERENTE E ADMIN_ESTOQUE
      const pode = req.user.permissao_gerenciar_usuarios === true || 
                  ['admin', 'coordenador', 'gerente', 'admin_estoque'].includes(req.user.perfil);
      
      console.log('✅ Resultado verificação podeGerenciarUsuarios:', { pode });
      
      if (!pode) {
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores, coordenadores, gerentes ou admin_estoque podem gerenciar usuários',
          perfil: req.user.perfil,
          possui_permissao_gerenciar: req.user.permissao_gerenciar_usuarios
        });
      }
      
      next();
    } catch (error) {
      console.error('💥 Erro no middleware podeGerenciarUsuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões de gerenciamento'
      });
    }
  };
};

// ✅ NOVO: MIDDLEWARE PARA VER USUÁRIOS DISPONÍVEIS
const podeVerUsuariosDisponiveis = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }
      
      // ✅ PERFIS QUE PODEM VER USUÁRIOS DISPONÍVEIS
      const perfisPermitidos = ['admin', 'coordenador', 'gerente', 'admin_estoque'];
      
      if (!perfisPermitidos.includes(req.user.perfil)) {
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores, coordenadores, gerentes ou admin_estoque podem ver usuários disponíveis',
          perfil: req.user.perfil
        });
      }
      
      next();
    } catch (error) {
      console.error('Erro em podeVerUsuariosDisponiveis:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  };
};

// 🔥 MIDDLEWARE ESPECIAL PARA DIAGNÓSTICO
const diagnosticoAuth = () => {
  return async (req, res, next) => {
    try {
      console.log('\n🔍 DIAGNÓSTICO AUTH');
      console.log('📍 Rota:', req.method, req.originalUrl || req.baseUrl + req.path);
      console.log('👤 Usuário:', req.user?.email, 'Perfil:', req.user?.perfil);
      console.log('📅 Data:', new Date().toISOString());
      console.log('🔍 Fim Diagnóstico\n');
      
      next();
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      next();
    }
  };
};

module.exports = { 
  auth, 
  authorizeProfiles,
  authorizeAdminEstoque, // ✅ NOVO: Middleware específico para admin_estoque
  authorizePermission,
  podeRealizar,
  temPermissao,
  podeVerEquipe,
  verificarLimitesUsuario,
  podeGerenciarUsuarios,
  podeVerUsuariosDisponiveis,
  diagnosticoAuth
};