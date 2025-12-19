const EmailService = require('./emailService');
const { Usuario, Item, Movimentacao, Notification, AlertConfig } = require('../models/associations');

class NotificationService {
  constructor() {
    this.emailService = EmailService;
    console.log('✅ Serviço de notificações inicializado');
  }

  // 🔍 BUSCAR CONFIGURAÇÕES DE ALERTA
  async getAlertConfigs(tipoAlerta, departamento = null) {
    try {
      const whereClause = {
        tipo_alerta: tipoAlerta,
        ativo: true
      };

      // Buscar configurações globais (usuário_id IS NULL)
      const globalConfigs = await AlertConfig.findAll({
        where: { ...whereClause, usuario_id: null },
        include: [{ model: Usuario, as: 'usuario' }]
      });

      // Buscar configurações por departamento se especificado
      let departmentConfigs = [];
      if (departamento) {
        departmentConfigs = await AlertConfig.findAll({
          where: { ...whereClause, departamento },
          include: [{ model: Usuario, as: 'usuario' }]
        });
      }

      return [...globalConfigs, ...departmentConfigs];
    } catch (error) {
      console.error('❌ Erro ao buscar configurações de alerta:', error);
      return [];
    }
  }

  // 👥 BUSCAR USUÁRIOS PARA NOTIFICAR
  async getUsersToNotify(tipoAlerta, item = null) {
    try {
      let departamento = null;
      
      // Se for alerta específico de item, pegar departamento relacionado
      if (item && item.localizacao) {
        departamento = item.localizacao;
      }

      const configs = await this.getAlertConfigs(tipoAlerta, departamento);
      
      // Extrair usuários únicos das configurações
      const userIds = [...new Set(configs
        .filter(config => config.usuario_id)
        .map(config => config.usuario_id)
      )];

      if (userIds.length === 0) {
        console.log(`⚠️ Nenhum usuário configurado para alertas do tipo: ${tipoAlerta}`);
        return [];
      }

      // Buscar usuários com emails
      const usuarios = await Usuario.findAll({
        where: { 
          id: userIds,
          ativo: true,
          receber_alertas_estoque: true
        },
        attributes: ['id', 'nome', 'email', 'departamento']
      });

      return usuarios;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários para notificação:', error);
      return [];
    }
  }

  // 💾 SALVAR NOTIFICAÇÃO NO BANCO
  async saveNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      console.log(`✅ Notificação salva: ${notification.titulo}`);
      return notification;
    } catch (error) {
      console.error('❌ Erro ao salvar notificação:', error);
      return null;
    }
  }

  // 🚨 NOTIFICAÇÃO DE ESTOQUE BAIXO
  async notifyStockAlert(item, nivelAlerta) {
    try {
      const usuarios = await this.getUsersToNotify(nivelAlerta, item);
      
      if (usuarios.length === 0) {
        console.log(`⚠️ Nenhum usuário para notificar sobre estoque: ${item.nome}`);
        return;
      }

      const emails = usuarios.map(u => u.email);
      const resultados = [];

      // 📧 Enviar emails
      const emailResult = await this.emailService.sendStockAlert(emails, item, nivelAlerta);
      resultados.push(emailResult);

      // 💾 Salvar notificações no banco para cada usuário
      for (const usuario of usuarios) {
        await this.saveNotification({
          tipo: nivelAlerta,
          titulo: `Estoque ${nivelAlerta.replace('_', ' ')} - ${item.nome}`,
          mensagem: `O item ${item.nome} está com ${item.quantidade} unidades (mínimo: ${item.estoque_minimo})`,
          prioridade: nivelAlerta === 'estoque_zero' ? 'urgente' : 'alta',
          usuario_id: usuario.id,
          item_id: item.id,
          enviada_por_email: emailResult.success,
          metadata: {
            item_id: item.id,
            quantidade_atual: item.quantidade,
            estoque_minimo: item.estoque_minimo,
            nivel_alerta: nivelAlerta
          }
        });
      }

      console.log(`✅ Notificação de estoque enviada para ${usuarios.length} usuários`);
      return resultados;

    } catch (error) {
      console.error('❌ Erro na notificação de estoque:', error);
      return [];
    }
  }

  // 🚨 NOTIFICAÇÃO DE MOVIMENTAÇÃO SUSPEITA
  async notifySuspiciousMovement(movimentacao) {
    try {
      const usuarios = await this.getUsersToNotify('movimentacao_suspeita');
      
      if (usuarios.length === 0) return;

      const emails = usuarios.map(u => u.email);
      const emailResult = await this.emailService.sendSuspiciousMovementAlert(emails, movimentacao);

      // Salvar notificações
      for (const usuario of usuarios) {
        await this.saveNotification({
          tipo: 'movimentacao_suspeita',
          titulo: 'Movimentação Suspeita Detectada',
          mensagem: `Movimentação incomum: ${movimentacao.item?.nome} - ${movimentacao.quantidade} unidades`,
          prioridade: 'alta',
          usuario_id: usuario.id,
          movimentacao_id: movimentacao.id,
          enviada_por_email: emailResult.success,
          metadata: {
            movimentacao_id: movimentacao.id,
            usuario_movimentacao: movimentacao.usuario?.nome,
            quantidade: movimentacao.quantidade,
            horario: movimentacao.data_movimentacao
          }
        });
      }

      console.log(`✅ Notificação de movimentação suspeita enviada`);
      return emailResult;

    } catch (error) {
      console.error('❌ Erro na notificação de movimentação suspeita:', error);
      return null;
    }
  }

  // 🚨 NOTIFICAÇÃO DE VENCIMENTO DE GARANTIA
  async notifyWarrantyExpiry(item, diasRestantes) {
    try {
      const usuarios = await this.getUsersToNotify('vencimento_garantia');
      
      if (usuarios.length === 0) return;

      const emails = usuarios.map(u => u.email);
      const emailResult = await this.emailService.sendWarrantyAlert(emails, item, diasRestantes);

      // Salvar notificações
      for (const usuario of usuarios) {
        await this.saveNotification({
          tipo: 'vencimento_garantia',
          titulo: `Garantia Expirando - ${item.nome}`,
          mensagem: `A garantia do item ${item.nome} expira em ${diasRestantes} dias`,
          prioridade: diasRestantes <= 7 ? 'urgente' : 'alta',
          usuario_id: usuario.id,
          item_id: item.id,
          enviada_por_email: emailResult.success,
          metadata: {
            item_id: item.id,
            dias_restantes: diasRestantes,
            data_aquisicao: item.data_aquisicao,
            fornecedor: item.fornecedor
          }
        });
      }

      console.log(`✅ Notificação de garantia enviada para ${item.nome}`);
      return emailResult;

    } catch (error) {
      console.error('❌ Erro na notificação de garantia:', error);
      return null;
    }
  }

  // 📊 OBTER NOTIFICAÇÕES DO USUÁRIO
  async getUserNotifications(usuarioId, limit = 50) {
    try {
      const notifications = await Notification.findAll({
        where: { 
          usuario_id: usuarioId 
        },
        include: [
          { model: Item, as: 'item', attributes: ['id', 'nome', 'patrimonio'] },
          { model: Movimentacao, as: 'movimentacao', attributes: ['id', 'quantidade', 'data_movimentacao'] }
        ],
        order: [['created_at', 'DESC']],
        limit: limit
      });

      return notifications;
    } catch (error) {
      console.error('❌ Erro ao buscar notificações do usuário:', error);
      return [];
    }
  }

  // ✅ MARCAR NOTIFICAÇÃO COMO LIDA
  async markAsRead(notificationId) {
    try {
      await Notification.update(
        { lida: true },
        { where: { id: notificationId } }
      );
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instância única
module.exports = new NotificationService();