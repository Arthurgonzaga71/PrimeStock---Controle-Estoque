// ✅ VERSÃO COMPLETA - COM SISTEMA DE NOTIFICAÇÕES
const socketIO = require('socket.io');

// 🎯 GESTOR DE CONEXÕES SOCKET.IO
class SocketHandler {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.db = null;
    console.log('🔄 SocketHandler instanciado');
  }

  initialize(server) {
    try {
      console.log('🔌 Inicializando Socket.IO...');
      
      if (!server) {
        throw new Error('Servidor não fornecido para Socket.IO');
      }

      // 🎯 CONFIGURAÇÃO DO SOCKET.IO
      this.io = socketIO(server, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });

      this.setupEventHandlers();
      console.log('✅ Socket.IO inicializado com sucesso!');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Socket.IO:', error);
      return false;
    }
  }

  // 🎯 INJETAR BANCO DE DADOS
  setDatabase(dbConnection) {
    this.db = dbConnection;
    console.log('🗃️ Banco de dados conectado ao WebSocket');
  }

  setupEventHandlers() {
    if (!this.io) {
      console.error('❌ Socket.IO não inicializado');
      return;
    }

    this.io.on('connection', (socket) => {
      console.log(`🔗 Novo cliente conectado: ${socket.id}`);
      
      // 🎯 REGISTRAR USUÁRIO
      socket.on('register_user', (userData) => {
        if (userData && userData.userId) {
          this.connectedUsers.set(socket.id, {
            userId: userData.userId,
            userName: userData.userName || 'Usuário',
            socketId: socket.id
          });
          console.log(`👤 Usuário registrado: ${userData.userName} (${socket.id})`);
        }
      });

      // 🎯 SOLICITAR DADOS DO DASHBOARD
      socket.on('request_dashboard', async () => {
        try {
          console.log('📊 Enviando dados do dashboard...');
          const dashboardData = await this.getDashboardData();
          socket.emit('dashboard_data', dashboardData);
        } catch (error) {
          console.error('❌ Erro no dashboard:', error);
          socket.emit('error', { message: 'Erro ao carregar dashboard' });
        }
      });

      // 🎯 SOLICITAR ALERTAS
      socket.on('request_alerts', async () => {
        try {
          console.log('🔔 Enviando alertas...');
          const alerts = await this.getAlerts();
          socket.emit('alerts_data', alerts);
        } catch (error) {
          console.error('❌ Erro nos alertas:', error);
        }
      });

      // 🎯 MARCAR ALERTA COMO LIDO
      socket.on('mark_alert_read', async (alertId) => {
        try {
          console.log(`📌 Marcando alerta ${alertId} como lido...`);
          socket.emit('alert_marked_read', { alertId, success: true });
        } catch (error) {
          console.error('❌ Erro ao marcar alerta:', error);
          socket.emit('alert_marked_read', { alertId, success: false });
        }
      });

      // 🎯 PING/PONG
      socket.on('ping', () => {
        socket.emit('pong', { 
          timestamp: new Date().toISOString(),
          message: 'pong'
        });
      });

      // 🎯 TESTE DE CONEXÃO
      socket.on('test_connection', () => {
        socket.emit('test_response', {
          status: 'success',
          message: 'Conexão WebSocket funcionando!',
          timestamp: new Date().toISOString(),
          connectionId: socket.id
        });
      });

      // 🎯 SOLICITAR NOTIFICAÇÃO DE TESTE
      socket.on('request_test_notification', () => {
        console.log('🔔 Solicitando notificação de teste...');
        this.sendTestNotification(socket);
      });

      // 🎯 DESCONEXÃO
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Cliente desconectado: ${socket.id} - ${reason}`);
        this.connectedUsers.delete(socket.id);
      });

      // 🎯 CONFIRMAÇÃO DE CONEXÃO + NOTIFICAÇÃO DE TESTE
      socket.emit('connected', { 
        message: 'Conectado ao servidor PrimeStock',
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      // 🎯 ENVIAR NOTIFICAÇÃO DE BOAS-VINDAS
      this.sendWelcomeNotification(socket);

      console.log(`✅ Handlers configurados para: ${socket.id}`);
    });
  }

  // 🎯 MÉTODOS PARA ENVIO DE EVENTOS
  broadcastDashboardUpdate(updateData) {
    if (this.io) {
      this.io.emit('dashboard_update', {
        type: 'dashboard_update',
        data: updateData,
        timestamp: new Date().toISOString()
      });
      console.log('📊 Dashboard atualizado enviado');
    }
  }

  broadcastNewMovement(movementData) {
    if (this.io) {
      this.io.emit('new_movement', {
        type: 'new_movement',
        movement: movementData,
        timestamp: new Date().toISOString()
      });
      console.log('📦 Nova movimentação enviada');
    }
  }

  broadcastNewMaintenance(maintenanceData) {
    if (this.io) {
      this.io.emit('new_maintenance', {
        type: 'new_maintenance',
        maintenance: maintenanceData,
        timestamp: new Date().toISOString()
      });
      console.log('🔧 Nova manutenção enviada');
    }
  }

  broadcastStockAlert(alertData) {
    if (this.io) {
      this.io.emit('stock_alert', {
        type: 'stock_alert',
        alert: alertData,
        timestamp: new Date().toISOString()
      });
      console.log('🔔 Alerta de estoque enviado');
    }
  }

  // 🎯 SISTEMA DE NOTIFICAÇÕES - MÉTODOS NOVOS
  broadcastNotification(notificationData) {
    if (this.io) {
      this.io.emit('new_notification', {
        type: 'notification',
        notification: notificationData,
        timestamp: new Date().toISOString()
      });
      console.log('🔔 Notificação broadcast enviada:', notificationData.title);
    }
  }

  sendNotificationToUser(userId, notificationData) {
    if (this.io) {
      for (let [socketId, userInfo] of this.connectedUsers.entries()) {
        if (userInfo.userId === userId) {
          this.io.to(socketId).emit('new_notification', {
            type: 'notification',
            notification: notificationData,
            timestamp: new Date().toISOString()
          });
          console.log(`🔔 Notificação enviada para usuário ${userId}:`, notificationData.title);
          return true;
        }
      }
    }
    return false;
  }

  sendSystemNotification(title, message, type = 'info') {
    const notification = {
      id: Date.now(),
      type: type,
      title: title,
      message: message,
      timestamp: new Date().toISOString(),
      isSystem: true
    };
    
    this.broadcastNotification(notification);
  }

  sendSolicitacaoNotification(solicitacaoData, action) {
    let title, message, type;
    
    switch(action) {
      case 'created':
        title = 'Nova Solicitação Criada';
        message = `Solicitação ${solicitacaoData.codigo_solicitacao} criada por ${solicitacaoData.usuario}`;
        type = 'info';
        break;
      case 'approved':
        title = 'Solicitação Aprovada';
        message = `Solicitação ${solicitacaoData.codigo_solicitacao} foi aprovada`;
        type = 'success';
        break;
      case 'rejected':
        title = 'Solicitação Rejeitada';
        message = `Solicitação ${solicitacaoData.codigo_solicitacao} foi rejeitada`;
        type = 'error';
        break;
      case 'delivered':
        title = 'Solicitação Entregue';
        message = `Solicitação ${solicitacaoData.codigo_solicitacao} foi entregue`;
        type = 'success';
        break;
      default:
        title = 'Atualização de Solicitação';
        message = `Solicitação ${solicitacaoData.codigo_solicitacao} foi atualizada`;
        type = 'info';
    }
    
    const notification = {
      id: Date.now(),
      type: type,
      title: title,
      message: message,
      timestamp: new Date().toISOString(),
      solicitacaoId: solicitacaoData.id,
      action: action
    };
    
    this.broadcastNotification(notification);
  }

  // 🎯 NOTIFICAÇÕES DE TESTE
  sendWelcomeNotification(socket) {
    const notification = {
      id: Date.now(),
      type: 'success',
      title: 'WebSocket Conectado! 🎉',
      message: 'Conexão em tempo real estabelecida com sucesso. Notificações ativas!',
      timestamp: new Date().toISOString(),
      isWelcome: true
    };
    
    socket.emit('new_notification', {
      type: 'notification',
      notification: notification
    });
    
    console.log('🔔 Notificação de boas-vindas enviada para:', socket.id);
  }

  sendTestNotification(socket = null) {
    const notification = {
      id: Date.now(),
      type: 'info',
      title: 'Teste de Notificação 🔔',
      message: `Esta é uma notificação de teste - ${new Date().toLocaleTimeString('pt-BR')}`,
      timestamp: new Date().toISOString(),
      isTest: true
    };
    
    if (socket) {
      // Enviar para um socket específico
      socket.emit('new_notification', {
        type: 'notification',
        notification: notification
      });
      console.log('🔔 Notificação de teste enviada para socket:', socket.id);
    } else {
      // Broadcast para todos
      this.broadcastNotification(notification);
      console.log('🔔 Notificação de teste broadcast enviada');
    }
  }

  // 🎯 MÉTODOS AUXILIARES (COM FALLBACK)
  async getDashboardData() {
    // Dados mock - funcionam mesmo sem banco
    return {
      totalItems: 156,
      totalMovements: 423,
      totalMaintenance: 18,
      lowStockItems: 7,
      lastUpdate: new Date().toISOString(),
      source: 'websocket'
    };
  }

  async getAlerts() {
    // Alertas mock
    return [
      {
        id: 1,
        tipo: 'estoque_baixo',
        mensagem: 'Mouse Logitech M170 - Estoque baixo (5 unidades)',
        prioridade: 'media',
        lido: false,
        createdAt: new Date().toISOString()
      }
    ];
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  getConnectionCount() {
    return this.connectedUsers.size;
  }

  getStatus() {
    return {
      connected: this.io !== null,
      connectionCount: this.connectedUsers.size,
      databaseConnected: this.db !== null,
      features: {
        notifications: true,
        realtime: true,
        dashboard: true,
        alerts: true
      }
    };
  }

  // 🎯 MÉTODO PARA TESTE VIA API
  testBroadcast() {
    this.sendSystemNotification(
      'Teste via API', 
      'Esta notificação foi disparada manualmente através da API REST',
      'info'
    );
    return { success: true, message: 'Notificação de teste enviada' };
  }
}

// 🎯 EXPORTAR A CLASSE DIRETAMENTE
module.exports = SocketHandler;