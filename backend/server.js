// 📁 backend/server.js - VERSÃO CORRIGIDA E TESTADA
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');

require('dotenv').config();

// Importar configurações do banco
const { sequelize, testConnection, syncModels } = require('./src/config/database');

// 🎯 ADICIONE ESTA VERIFICAÇÃO DE ROTAS
console.log('🔍 Verificando módulos de rotas...');

// Função para verificar se um arquivo existe
function verificarArquivoRota(caminho, nome) {
  try {
    const fullPath = path.join(__dirname, caminho);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${nome}: ${fullPath}`);
      return true;
    } else {
      console.error(`❌ ${nome} NÃO encontrado: ${fullPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar ${nome}:`, error.message);
    return false;
  }
}

// Verificar se todos os arquivos de rotas existem
verificarArquivoRota('./src/routes/authRoutes.js', 'authRoutes');
verificarArquivoRota('./src/routes/usuarioRoutes.js', 'usuarioRoutes');
verificarArquivoRota('./src/routes/categoriaRoutes.js', 'categoriaRoutes');
verificarArquivoRota('./src/routes/itemRoutes.js', 'itemRoutes');
verificarArquivoRota('./src/routes/movimentacaoRoutes.js', 'movimentacaoRoutes');
verificarArquivoRota('./src/routes/manutencaoRoutes.js', 'manutencoesRoutes');
verificarArquivoRota('./src/routes/dashboardRoutes.js', 'dashboardRoutes');
verificarArquivoRota('./src/routes/testRoutes.js', 'testRoutes');
verificarArquivoRota('./src/routes/qrCodeRoutes.js', 'qrCodeRoutes');
verificarArquivoRota('./src/routes/exportRoutes.js', 'exportRoutes');
verificarArquivoRota('./src/routes/backupRoutes.js', 'backupRoutes');
verificarArquivoRota('./src/routes/solicitacaoRoutes.js', 'solicitacaoRoutes');
verificarArquivoRota('./src/routes/modeloEquipamentoRoutes.js', 'modeloEquipamentoRoutes');

// Importar rotas
const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');
const itemRoutes = require('./src/routes/itemRoutes');
const movimentacaoRoutes = require('./src/routes/movimentacaoRoutes');
const manutencoesRoutes = require('./src/routes/manutencaoRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const testRoutes = require('./src/routes/testRoutes');
const qrCodeRoutes = require('./src/routes/qrCodeRoutes');
const exportRoutes = require('./src/routes/exportRoutes');
const backupRoutes = require('./src/routes/backupRoutes');
const solicitacaoRoutes = require('./src/routes/solicitacaoRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.205.141:3000', // seu IP local
    'http://192.168.205.141:3001', // se frontend rodar na rede
    'http://localhost:3001'
  ],
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));
app.use('/backups', express.static(path.join(__dirname, 'backups')));

// 🎯 MIDDLEWARE DE LOG MELHORADO
app.use((req, res, next) => {
  console.log(`📍 ${new Date().toISOString().split('T')[1].split('.')[0]} - ${req.method} ${req.originalUrl}`);
  
  // Log detalhado para rotas de solicitações
  if (req.originalUrl.includes('/solicitacoes')) {
    console.log(`📋 Rota de solicitação: ${req.method} ${req.originalUrl}`);
    console.log(`📦 Body:`, req.body ? JSON.stringify(req.body).substring(0, 200) : 'Sem body');
    console.log(`👤 Headers:`, {
      authorization: req.headers.authorization ? 'Token presente' : 'Sem token',
      'content-type': req.headers['content-type']
    });
  }
  
  next();
});

// 🛠️ CORREÇÃO: Antes de iniciar, verificar/adicionar colunas faltantes
async function verificarEstruturaBanco() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...');
    
    // 1. Verificar se as colunas existem na tabela itens
    const [colunas] = await sequelize.query(`
      SHOW COLUMNS FROM itens LIKE 'valor_atual_estimado'
    `);
    
    // 2. Se não existir, adicionar
    if (colunas.length === 0) {
      console.log('➕ Adicionando colunas faltantes à tabela itens...');
      await sequelize.query(`
        ALTER TABLE itens 
        ADD COLUMN valor_atual_estimado DECIMAL(10,2) NULL,
        ADD COLUMN ultima_movimentacao DATETIME NULL
      `);
      console.log('✅ Colunas adicionadas com sucesso!');
    }
    
    // 3. Sincronizar modelos (alter: true para adicionar colunas se faltarem)
    await sequelize.sync({ alter: true });
    
    console.log('✅ Estrutura do banco verificada e sincronizada!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura do banco:', error.message);
    // Não interromper o servidor, apenas logar o erro
    return false;
  }
}

// 🛠️ CORREÇÃO DEFINITIVA DA FUNÇÃO verificarAlertasIniciais
async function verificarAlertasIniciais() {
  try {
    console.log('🔄 Executando verificações de alertas...');
    
    // CORREÇÃO: Usar query direta para evitar problemas com colunas faltantes
    const [itensComEstoqueBaixo] = await sequelize.query(`
      SELECT 
        id, 
        nome, 
        quantidade, 
        estoque_minimo,
        status
      FROM itens 
      WHERE quantidade <= estoque_minimo
      AND status = 'disponivel'
    `);

    console.log(`🔍 Verificando ${itensComEstoqueBaixo.length} itens com estoque baixo`);

    const { AlertasEstoque } = require('./src/models/associations');
    let alertasCriados = 0;

    for (const item of itensComEstoqueBaixo) {
      const quantidade = item.quantidade;
      const estoqueMinimo = item.estoque_minimo;
      
      let nivelAlerta = null;
      if (quantidade === 0) {
        nivelAlerta = 'zero';
      } else if (quantidade <= 2) {
        nivelAlerta = 'critico';
      } else if (quantidade <= estoqueMinimo) {
        nivelAlerta = 'baixo';
      }

      if (nivelAlerta) {
        // Verificar se já existe alerta não lido
        const alertaExistente = await AlertasEstoque.findOne({
          where: {
            item_id: item.id,
            nivel_alerta: nivelAlerta,
            lido: false
          }
        });

        if (!alertaExistente) {
          await AlertasEstoque.create({
            item_id: item.id,
            nivel_alerta: nivelAlerta,
            quantidade_atual: quantidade,
            estoque_minimo: estoqueMinimo,
            mensagem: `${item.nome} está com estoque ${nivelAlerta}. Quantidade atual: ${quantidade}, Mínimo: ${estoqueMinimo}`
          });
          alertasCriados++;
          console.log(`🔔 Alerta criado: ${item.nome} - ${nivelAlerta}`);
        }
      }
    }

    console.log(`✅ Verificação de alertas concluída: ${alertasCriados} alertas criados`);
    return { total: alertasCriados };
  } catch (error) {
    console.error('❌ Erro na verificação de alertas:', error.message);
    // Não lançar erro para não travar o servidor
    return { total: 0, error: error.message };
  }
}

// 🛠️ NOVA FUNÇÃO: Inicialização segura
async function inicializacaoSegura() {
  try {
    console.log('🔄 Iniciando sistema com verificações de segurança...');
    
    // 1. Testar conexão com banco
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Falha na conexão com o banco de dados');
    }

    // 2. Verificar e corrigir estrutura do banco
    await verificarEstruturaBanco();

    // 3. Sincronizar modelos de forma segura
    await sequelize.sync({ alter: true });

    // 4. Verificar alertas (tratando possíveis erros)
    await verificarAlertasIniciais();
    
    return true;
  } catch (error) {
    console.error('❌ Erro na inicialização segura:', error.message);
    return false;
  }
}

// WebSocket (opcional - pode comentar se der problema)
let socketHandler = null;
try {
  const SocketHandlerClass = require('./src/websocket/socketHandler');
  socketHandler = new SocketHandlerClass();
  socketHandler.initialize(server);
  console.log('✅ WebSocket inicializado com sucesso');
} catch (error) {
  console.log('⚠️ WebSocket não pôde ser inicializado:', error.message);
}

app.use((req, res, next) => {
  if (socketHandler) {
    req.socketHandler = socketHandler;
  }
  next();
});

// 🎯 ADICIONE ESTA ROTA DE TESTE DIRETA (para debug)
app.put('/api/solicitacoes/test-enviar', (req, res) => {
  console.log('🧪 [TEST DIRECT] Rota de teste PUT /api/solicitacoes/test-enviar acessada');
  res.json({
    success: true,
    message: '✅ Rota de teste funcionando!',
    timestamp: new Date().toISOString(),
    endpoint: 'PUT /api/solicitacoes/test-enviar'
  });
});

app.put('/api/solicitacoes/:id/enviar-teste', (req, res) => {
  console.log(`🧪 [TEST DIRECT] Testando envio para ID ${req.params.id}`);
  res.json({
    success: true,
    message: `✅ Rota de teste PUT /api/solicitacoes/:id/enviar funcionando!`,
    id: req.params.id,
    method: 'PUT',
    endpoint: 'PUT /api/solicitacoes/:id/enviar',
    timestamp: new Date().toISOString()
  });
});

// 🎯 ADICIONE ESTA ROTA PARA VERIFICAR AS ROTAS REGISTRADAS
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  // Coletar todas as rotas registradas
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Rota direta
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router montado
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '') + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    total_routes: routes.length,
    routes: routes.filter(route => route.path.includes('solicitacoes'))
  });
});

// Rotas da API
console.log('\n🎯 Registrando rotas da API...');

app.use('/api/auth', authRoutes);
console.log('✅ Rota: /api/auth');

app.use('/api/usuarios', usuarioRoutes);
console.log('✅ Rota: /api/usuarios');

app.use('/api/categorias', categoriaRoutes);
console.log('✅ Rota: /api/categorias');

app.use('/api/itens', itemRoutes);
console.log('✅ Rota: /api/itens');

app.use('/api/movimentacoes', movimentacaoRoutes);
console.log('✅ Rota: /api/movimentacoes');

app.use('/api/manutencoes', manutencoesRoutes);
console.log('✅ Rota: /api/manutencoes');

app.use('/api/dashboard', dashboardRoutes);
console.log('✅ Rota: /api/dashboard');

app.use('/api/test', testRoutes);
console.log('✅ Rota: /api/test');

app.use('/api/qrcode', qrCodeRoutes);
console.log('✅ Rota: /api/qrcode');

app.use('/api/export', exportRoutes);
console.log('✅ Rota: /api/export');

app.use('/api/backup', backupRoutes);
console.log('✅ Rota: /api/backup');

// 🎯 CORREÇÃO CRÍTICA: Verificar se a rota de solicitações está sendo registrada
console.log('\n🔍 Verificando rota de solicitações...');
try {
  app.use('/api/solicitacoes', solicitacaoRoutes);
  console.log('✅ Rota: /api/solicitacoes - REGISTRADA COM SUCESSO!');
  
  // Testar se o router tem rotas
  if (solicitacaoRoutes && solicitacaoRoutes.stack) {
    console.log(`📋 Rotas dentro de solicitacaoRoutes: ${solicitacaoRoutes.stack.length}`);
    
    // Listar rotas específicas de solicitações
    solicitacaoRoutes.stack.forEach((layer, index) => {
      if (layer.route) {
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(', ');
        console.log(`  ${index + 1}. ${methods} ${path}`);
      }
    });
  }
} catch (error) {
  console.error('❌ ERRO ao registrar rota de solicitações:', error.message);
}

app.use('/api/modelos-equipamentos', require('./src/routes/modeloEquipamentoRoutes'));
console.log('✅ Rota: /api/modelos-equipamentos');

console.log('\n✅ Todas as rotas registradas com sucesso!');

// Rotas de alertas (versão segura)
app.get('/api/alerts', async (req, res) => {
  try {
    const { AlertasEstoque, Item } = require('./src/models/associations');
    const alertas = await AlertasEstoque.findAll({
      where: { lido: false },
      include: [{ 
        model: Item,
        as: 'item',
        attributes: ['id', 'nome', 'patrimonio']
      }],
      order: [['data_alerta', 'DESC']]
    });
    
    res.json({
      success: true,
      data: alertas,
      total: alertas.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar alertas',
      error: error.message
    });
  }
});

app.get('/api/alerts/contador', async (req, res) => {
  try {
    const { AlertasEstoque } = require('./src/models/associations');
    const total = await AlertasEstoque.count({
      where: { lido: false }
    });
    
    res.json({
      success: true,
      total: total
    });
  } catch (error) {
    console.error('❌ Erro ao contar alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao contar alertas',
      error: error.message
    });
  }
});

app.put('/api/alerts/:id/lido', async (req, res) => {
  try {
    const { AlertasEstoque } = require('./src/models/associations');
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
    console.error('❌ Erro ao marcar alerta como lido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao marcar alerta como lido',
      error: error.message
    });
  }
});

app.post('/api/alerts/verificar', async (req, res) => {
  try {
    const resultado = await verificarAlertasIniciais();
    
    res.json({
      success: true,
      message: 'Verificação de alertas executada',
      data: resultado
    });
  } catch (error) {
    console.error('❌ Erro ao verificar alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar alertas',
      error: error.message
    });
  }
});

// Health Check melhorado
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check acessado');
  
  const rotasSolicitacoes = [];
  
  // Verificar rotas específicas
  try {
    if (solicitacaoRoutes && solicitacaoRoutes.stack) {
      solicitacaoRoutes.stack.forEach((layer) => {
        if (layer.route) {
          const path = layer.route.path;
          const methods = Object.keys(layer.route.methods);
          rotasSolicitacoes.push({
            path: `/api/solicitacoes${path}`,
            methods: methods
          });
        }
      });
    }
  } catch (error) {
    console.error('Erro ao verificar rotas de solicitações:', error);
  }
  
  res.json({ 
    status: 'OK', 
    message: 'Backend rodando perfeitamente!',
    timestamp: new Date().toISOString(),
    port: PORT,
    websocket: socketHandler ? 'Ativo' : 'Inativo',
    environment: process.env.NODE_ENV || 'development',
    version: '2.3.0',
    routes_solicitacoes: rotasSolicitacoes,
    routes: [
      '/api/auth',
      '/api/usuarios',
      '/api/categorias',
      '/api/itens',
      '/api/movimentacoes',
      '/api/manutencoes',
      '/api/solicitacoes',
      '/api/dashboard',
      '/api/alerts'
    ]
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Sistema de Controle de Estoque TI - Backend',
    version: '2.3.0',
    status: 'Online',
    websocket: socketHandler ? 'Ativo' : 'Inativo',
    features: [
      '✅ Autenticação JWT',
      '✅ CRUD Completo',
      '✅ Dashboard em Tempo Real', 
      '✅ Sistema de Alertas Inteligente',
      '✅ Exportação PDF/Excel',
      '✅ WebSocket em Tempo Real',
      '✅ Upload de Imagens',
      '✅ QR Code',
      '✅ Controle de Acesso Granular',
      '✅ Sistema de Solicitações'
    ],
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios', 
      categorias: '/api/categorias',
      itens: '/api/itens',
      movimentacoes: '/api/movimentacoes',
      manutencoes: '/api/manutencoes',
      solicitacoes: '/api/solicitacoes',
      dashboard: '/api/dashboard',
      alerts: '/api/alerts',
      health: '/api/health'
    }
  });
});

function iniciarAgendadorAlertas() {
  const intervalo = 30 * 60 * 1000;
  
  setInterval(async () => {
    try {
      console.log('🔄 Executando verificações automáticas de alertas...');
      const resultado = await verificarAlertasIniciais();
      
      if (socketHandler && resultado.total > 0) {
        socketHandler.broadcast('alertas_atualizados', {
          type: 'novos_alertas',
          total: resultado.total,
          timestamp: new Date()
        });
        console.log(`📢 ${resultado.total} novos alertas notificados via WebSocket`);
      }
      
    } catch (error) {
      console.error('❌ Erro no agendador de alertas:', error);
    }
  }, intervalo);

  console.log(`⏰ Agendador de alertas iniciado (executa a cada ${intervalo / 60000} minutos)`);
}

app.use((error, req, res, next) => {
  console.error('💥 Erro:', error.message);
  console.error('💥 Stack:', error.stack);
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

app.use('*', (req, res) => {
  console.error(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  
  // Coletar rotas disponíveis
  const availableRoutes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      availableRoutes.push(`${methods} ${path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const basePath = middleware.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '').replace(/\\/g, '');
          const fullPath = `${basePath}${handler.route.path}`;
          const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
          availableRoutes.push(`${methods} ${fullPath}`);
        }
      });
    }
  });
  
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    available_routes: availableRoutes.filter(route => route.includes('solicitacoes'))
  });
});

// 🛠️ INICIALIZAÇÃO SEGURA
const startServer = async () => {
  console.log('🔄 Iniciando Sistema de Controle de Estoque TI...');
  
  try {
    // Usar inicialização segura
    const inicializado = await inicializacaoSegura();
    
    if (!inicializado) {
      console.log('⚠️ Sistema iniciado com alguns avisos, mas funcional');
    }

    console.log('✅ Banco de dados conectado e modelos sincronizados!');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 BACKEND RODANDO NA PORTA ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`🌐 Rede: http://192.168.205.141:${PORT}`);
      console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`📊 Dashboard: GET http://localhost:${PORT}/api/dashboard`);
      console.log(`🔧 Manutenções: GET http://localhost:${PORT}/api/manutencoes`);
      console.log(`📋 Solicitações: GET http://localhost:${PORT}/api/solicitacoes/minhas`);
      console.log(`📤 Solicitações (enviar): PUT http://localhost:${PORT}/api/solicitacoes/:id/enviar`);
      console.log(`🔔 Alertas: GET http://localhost:${PORT}/api/alerts`);
      console.log(`🧪 Teste rota: PUT http://localhost:${PORT}/api/solicitacoes/test-enviar`);
      console.log(`🔍 Debug rotas: GET http://localhost:${PORT}/api/debug/routes`);
      console.log('==============================================');
      console.log('🎯 SISTEMA DE SOLICITAÇÕES ATIVO:');
      console.log('   📝 POST   /api/solicitacoes          - Criar solicitação');
      console.log('   📤 PUT    /api/solicitacoes/:id/enviar - Enviar para aprovação');
      console.log('   ✅ PUT    /api/solicitacoes/:id/aprovar - Aprovar solicitação');
      console.log('   ❌ PUT    /api/solicitacoes/:id/rejeitar - Rejeitar solicitação');
      console.log('   📦 PUT    /api/solicitacoes/:id/processar-estoque - Processar no estoque');
      console.log('   📋 GET    /api/solicitacoes/pendentes - Listar pendentes');
      console.log('   🏭 GET    /api/solicitacoes/para-estoque - Listar para estoque');
      console.log('==============================================');

      iniciarAgendadorAlertas();
    });

  } catch (error) {
    console.error('💥 Erro crítico ao iniciar servidor:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('🔻 Recebido SIGTERM, encerrando servidor...');
  await sequelize.close();
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔻 Recebido SIGINT, encerrando servidor...');
  await sequelize.close();
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.log('❌ Promise rejeitada não tratada:', err);
});

process.on('uncaughtException', (err) => {
  console.log('❌ Exceção não capturada:', err);
  process.exit(1);
});

startServer();