// 📁 src/middleware/authorize.js - VERSÃO COMPLETAMENTE CORRIGIDA
const { Usuario } = require('../models/associations');

// 🔥 MIDDLEWARE PRINCIPAL CORRIGIDO
const authorize = (...allowedProfiles) => {
  return async (req, res, next) => {
    try {
      console.log('\n🔐 [authorize] Iniciando verificação');
      console.log('📋 Perfis permitidos para esta rota:', allowedProfiles);
      console.log('👤 Usuário atual:', req.user?.email, 'Perfil:', req.user?.perfil);
      console.log('📍 Rota completa:', req.method, req.baseUrl + req.path);
      console.log('📍 Rota path:', req.path);
      console.log('📍 Rota originalUrl:', req.originalUrl);

      // 1. VERIFICAR SE USUÁRIO ESTÁ AUTENTICADO
      if (!req.user) {
        console.log('❌ Usuário não autenticado');
        return res.status(401).json({
          success: false,
          message: 'Acesso não autorizado. Faça login primeiro.'
        });
      }

      // 2. BUSCAR USUÁRIO COMPLETO DO BANCO
      const usuario = await Usuario.findByPk(req.user.id);
      if (!usuario) {
        console.log('❌ Usuário não encontrado no banco');
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado.'
        });
      }

      // 3. ATUALIZAR DADOS DO REQUEST COM USUÁRIO ATUAL
      req.user = usuario.toJSON();
      req.usuario = usuario;

      console.log('✅ Dados do usuário carregados:', {
        id: usuario.id,
        nome: usuario.nome,
        perfil: usuario.perfil,
        email: usuario.email
      });

      // 4. ✅ CORREÇÃO 1: ADMIN SEMPRE TEM ACESSO
      if (usuario.perfil === 'admin') {
        console.log('👑 ADMIN - Acesso total concedido (bypass)');
        next();
        return;
      }

      // 5. ✅ CORREÇÃO 2: ADMIN_ESTOQUE TEM ACESSO ESPECIAL - MOVER PARA CIMA
      if (usuario.perfil === 'admin_estoque') {
        console.log('📦 ADMIN_ESTOQUE - Verificando acesso especial...');
        
        // Definir todas as rotas que admin_estoque pode acessar
        const rotasPermitidasAdminEstoque = [
          'dashboard',
          'solicitacoes',
          'estoque',
          'itens',
          'categorias',
          'movimentacoes',
          'minhas-solicitacoes',
          'para-estoque',
          'manutencao'
        ];
        
        // Verificar a rota atual
        const rotaAtual = req.baseUrl + req.path + req.originalUrl;
        console.log('📍 Rota atual para verificação:', rotaAtual);
        
        // Verificar se contém alguma das rotas permitidas
        const rotaPermitida = rotasPermitidasAdminEstoque.some(rota => 
          rotaAtual.toLowerCase().includes(rota.toLowerCase())
        );
        
        if (rotaPermitida) {
          console.log(`✅ ADMIN_ESTOQUE - Acesso permitido para rota de estoque`);
          next();
          return;
        }
        
        console.log(`❌ ADMIN_ESTOQUE - Rota não permitida: ${rotaAtual}`);
      }

      // 6. VERIFICAR SE O PERFIL ESTÁ NA LISTA PERMITIDA
      if (allowedProfiles.length === 0) {
        console.log('✅ Lista de perfis vazia - acesso liberado');
        next();
        return;
      }

      const perfilPermitido = allowedProfiles.includes(usuario.perfil);
      
      console.log('🔍 Verificação padrão de perfil:', {
        perfilUsuario: usuario.perfil,
        listaPermitidos: allowedProfiles,
        perfilPermitido: perfilPermitido
      });

      // 7. SE PERFIL ESTIVER NA LISTA, PERMITIR ACESSO
      if (perfilPermitido) {
        console.log(`✅ ${usuario.perfil} - Acesso permitido via lista de perfis`);
        next();
        return;
      }

      // 8. ✅ CORREÇÃO 3: EXCEÇÕES ESPECÍFICAS
      
      // Coordenador/Gerente podem gerenciar usuários
      if (['coordenador', 'gerente'].includes(usuario.perfil)) {
        // Verificar se é rota de gerenciamento de usuários
        if ((req.path.includes('/usuarios') || req.originalUrl.includes('/usuarios')) && 
            usuario.permissao_gerenciar_usuarios) {
          console.log(`✅ ${usuario.perfil} pode gerenciar usuários`);
          next();
          return;
        }
      }

      // 9. SE CHEGOU AQUI, ACESSO NEGADO
      console.log(`❌ ${usuario.perfil} - ACESSO NEGADO`);
      console.log('📊 DETALHES:', {
        rota_base: req.baseUrl,
        rota_path: req.path,
        rota_original: req.originalUrl,
        metodo: req.method,
        lista_perfis_permitidos: allowedProfiles
      });
      
      res.status(403).json({
        success: false,
        message: `🔒 Acesso Negado. Seu perfil "${usuario.perfil}" não tem acesso a esta página.`,
        perfil_atual: usuario.perfil,
        perfis_permitidos: allowedProfiles,
        rota: req.baseUrl + req.path,
        detalhes: 'Verifique se seu perfil está configurado corretamente no banco de dados.',
        sugestao: 'Contacte o administrador para ajustar suas permissões.'
      });
      
    } catch (error) {
      console.error('💥 ERRO CRÍTICO no middleware authorize:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno no sistema de autorização',
        error: error.message
      });
    }
  };
};

// 🎯 MIDDLEWARE PARA VERIFICAR PERMISSÕES ESPECÍFICAS
const podeAcessar = (recurso, acao) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        const usuario = await Usuario.findByPk(req.user.id);
        if (usuario) {
          req.usuario = usuario;
        }
      }

      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const pode = req.usuario.podeAcao(acao, recurso, req.body);
      
      if (!pode) {
        return res.status(403).json({
          success: false,
          message: `Permissão negada: ${acao} ${recurso}`,
          perfil: req.usuario.perfil
        });
      }

      next();
    } catch (error) {
      console.error('Erro no middleware podeAcessar:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões'
      });
    }
  };
};

// 🔐 MIDDLEWARE PARA APENAS APROVADORES - ATUALIZADO
const apenasAprovadores = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      const usuario = await Usuario.findByPk(req.user.id);
      
      // ✅ CORREÇÃO: Admin_estoque também pode aprovar
      const aprovadores = ['admin', 'coordenador', 'gerente', 'admin_estoque'];
      
      if (!aprovadores.includes(usuario.perfil)) {
        return res.status(403).json({
          success: false,
          message: 'Apenas coordenadores, gerentes, admin_estoque ou administradores podem aprovar',
          perfil: usuario.perfil
        });
      }

      next();
    } catch (error) {
      console.error('Erro em apenasAprovadores:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  };
};

// 👥 MIDDLEWARE PARA GERENCIAMENTO DE USUÁRIOS - ATUALIZADO
const podeGerenciarUsuarios = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      const usuario = await Usuario.findByPk(req.user.id);
      
      // ✅ CORREÇÃO: Admin_estoque NÃO deve gerenciar usuários (só estoque)
      const pode = usuario.permissao_gerenciar_usuarios || 
                   ['admin', 'coordenador', 'gerente'].includes(usuario.perfil);
      
      if (!pode) {
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores, coordenadores ou gerentes podem gerenciar usuários',
          perfil: usuario.perfil
        });
      }

      next();
    } catch (error) {
      console.error('Erro em podeGerenciarUsuarios:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  };
};

// 📊 MIDDLEWARE PARA DASHBOARD - ATUALIZADO
const podeAcessarDashboard = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      
      const usuario = await Usuario.findByPk(req.user.id);
      
      // ✅ PERFIS QUE PODEM ACESSAR O DASHBOARD
      const perfisComDashboard = [
        'admin', 
        'admin_estoque', 
        'coordenador', 
        'gerente', 
        'tecnico', 
        'analista'
      ];

      const pode = perfisComDashboard.includes(usuario.perfil) || 
                   usuario.permissao_acesso_dashboard === true;
      
      console.log('🔍 Verificação dashboard:', {
        perfil: usuario.perfil,
        permissao_acesso_dashboard: usuario.permissao_acesso_dashboard,
        pode: pode
      });
      
     if (!pode) {
        return res.status(403).json({
          success: false,
          message: 'Acesso ao dashboard não permitido para seu perfil',
          perfil: usuario.perfil,
          perfis_permitidos: perfisComDashboard
        });
      }

      next();
    } catch (error) {
      console.error('Erro em podeAcessarDashboard:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  };
};

// ⚠️ MIDDLEWARE PARA VERIFICAR LIMITES - ATUALIZADO
const verificarLimites = () => {
  return async (req, res, next) => {
      try {
      if (!req.user) return next();
      
      const usuario = await Usuario.findByPk(req.user.id);
      
      // ✅ CORREÇÃO: VERIFICA APENAS LIMITE DE VALOR (SEM LIMITE DE ITENS)
      if (['tecnico', 'analista', 'estagiario', 'aprendiz'].includes(usuario.perfil)) {
        
        if (req.method === 'POST' && req.path.includes('/solicitacoes')) {
          const { valor_total = 0 } = req.body;
          
          // 🔥 APENAS VERIFICA LIMITE DE VALOR (SEM LIMITE DE ITENS)
          if (valor_total > usuario.valor_max_solicitacao) {
            return res.status(400).json({
              success: false,
              message: `❌ Limite de valor por solicitação atingido. Máximo: R$ ${usuario.valor_max_solicitacao.toFixed(2)}`,
              limite_excedido: true
            });
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Erro em verificarLimites:', error);
      next();
    }
  };
};

// 📋 EXPORTAR TODOS OS MIDDLEWARES
module.exports = {
  authorize,          // ✅ PRINCIPAL - COMPLETAMENTE CORRIGIDO
  podeAcessar,        // ✅ Para verificar ações específicas
  apenasAprovadores,  // ✅ Atualizado com admin_estoque
  podeGerenciarUsuarios, // ✅ Mantido sem admin_estoque
  podeAcessarDashboard,  // ✅ Atualizado com admin_estoque
  verificarLimites    // ✅ Atualizado
};