// src/services/emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const {Item} = require('../models/Item');
const{Usuario} = require('../models/Usuario');
const{Solicitacao} = require('../models/Solicitacao');
const{Movimentacao} = require('../models/Movimentacao');
class EmailService {
  constructor() {
    this.transporter = null;
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.empresa.com.br',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'ti.sistema@empresa.com.br',
        pass: process.env.SMTP_PASS || ''
      },
      tls: {
        rejectUnauthorized: false // Para desenvolvimento
      }
    };
    
    this.from = process.env.EMAIL_FROM || '"Sistema de Estoque TI" <ti.sistema@empresa.com.br>';
    this.companyName = process.env.COMPANY_NAME || 'Empresa Corporativa';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'ti.suporte@empresa.com.br';
    
    this.initialize();
  }

  async initialize() {
    try {
      if (!this.config.auth.user || !this.config.auth.pass) {
        console.warn('⚠️ Credenciais SMTP não configuradas. Notificações por email estarão desabilitadas.');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport(this.config);
      
      // Verificar conexão SMTP
      await this.transporter.verify();
      console.log('✅ Serviço de email corporativo inicializado e conectado');
    } catch (error) {
      console.error('❌ Erro ao inicializar email service:', error.message);
      this.transporter = null;
    }
  }

  // 🎨 GERADOR DE TEMPLATES EM TEMPO REAL
  generateEmailTemplate(data) {
    const prioridadeCor = {
      'baixa': '#28a745',
      'media': '#ffc107', 
      'alta': '#fd7e14',
      'urgente': '#dc3545'
    };

    const nivelAlertaCor = {
      'baixo': '#ffc107',
      'critico': '#fd7e14',
      'zero': '#dc3545'
    };

    const tipoTemplate = data.template || 'default';
    
    switch(tipoTemplate) {
      case 'alerta_estoque':
        return this.generateStockAlertTemplate(data, nivelAlertaCor);
      case 'nova_solicitacao':
        return this.generateNewRequestTemplate(data, prioridadeCor);
      case 'solicitacao_status':
        return this.generateRequestStatusTemplate(data);
      case 'movimentacao_suspeita':
        return this.generateSuspiciousMovementTemplate(data);
      case 'alerta_garantia':
        return this.generateWarrantyAlertTemplate(data);
      case 'resumo_diario':
        return this.generateDailySummaryTemplate(data);
      case 'lembrete_devolucao':
        return this.generateReturnReminderTemplate(data);
      default:
        return this.generateDefaultTemplate(data);
    }
  }

  generateStockAlertTemplate(data, corMap) {
    const cor = corMap[data.nivelAlerta] || corMap['baixo'];
    const niveisTexto = {
      'baixo': 'BAIXO',
      'critico': 'CRÍTICO', 
      'zero': 'ZERADO'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: ${cor}; color: white; padding: 25px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .alert-box { background: #fff; border-left: 5px solid ${cor}; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: ${cor}; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .item-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .stat-item { text-align: center; padding: 15px; background: #fff; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .stat-value { font-size: 24px; font-weight: bold; color: ${cor}; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">⚠️ ALERTA DE ESTOQUE ${niveisTexto[data.nivelAlerta]}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Controle de Estoque TI</p>
            </div>
            
            <div class="content">
              <h2 style="color: #2c3e50; margin-top: 0;">${data.item?.nome || 'Item não identificado'}</h2>
              
              <div class="alert-box">
                <h3 style="margin-top: 0; color: ${cor};">🚨 Atenção Responsável!</h3>
                <p>O estoque deste item atingiu um nível ${data.nivelAlerta === 'zero' ? 'ZERO' : data.nivelAlerta}.</p>
                
                <div class="stats">
                  <div class="stat-item">
                    <div class="stat-value">${data.item?.quantidade || 0}</div>
                    <div>Quantidade Atual</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">${data.item?.estoque_minimo || 0}</div>
                    <div>Estoque Mínimo</div>
                  </div>
                </div>
                
                <div class="item-details">
                  <p><strong>🔧 Código:</strong> ${data.item?.patrimonio || 'N/A'}</p>
                  <p><strong>🏷️ Número de Série:</strong> ${data.item?.numero_serie || 'N/A'}</p>
                  <p><strong>📍 Localização:</strong> ${data.item?.localizacao || 'Não informada'}</p>
                  ${data.item?.categoria ? `<p><strong>📂 Categoria:</strong> ${data.item.categoria}</p>` : ''}
                </div>
                
                <p><strong>📋 Recomendações:</strong></p>
                <ul>
                  <li>Verificar necessidade de reposição urgente</li>
                  <li>Analisar fornecedores disponíveis</li>
                  <li>Revisar consumo histórico</li>
                  <li>Notificar compras/suprimentos</li>
                </ul>
                
                <a href="${process.env.APP_URL || '#'}/itens/${data.item?.id}" class="button">
                  🔍 Ver Detalhes do Item
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                <em>Este alerta foi gerado automaticamente pelo sistema. A ação imediata é recomendada.</em>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0; font-size: 11px;">
                🏢 ${this.companyName} | 📞 Suporte TI: ${this.supportEmail}<br>
                📅 ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                <span style="opacity: 0.7;">📍 Sistema de Gestão de Estoque - Departamento de TI</span>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  generateNewRequestTemplate(data, corMap) {
    const cor = corMap[data.prioridade] || corMap['media'];
    const prioridadeTexto = data.prioridade?.toUpperCase() || 'MÉDIA';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: #2C5AA0; color: white; padding: 25px; text-align: center; }
            .priority-badge { display: inline-block; padding: 5px 15px; background: ${cor}; color: white; border-radius: 20px; font-size: 12px; margin-left: 10px; }
            .content { padding: 30px; background: #f9f9f9; }
            .card { background: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #2C5AA0; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .items-list { margin: 20px 0; }
            .item-row { padding: 10px; border-bottom: 1px solid #eee; }
            .item-row:last-child { border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">📋 NOVA SOLICITAÇÃO REGISTRADA</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">
                Sistema de Controle de Estoque TI
                <span class="priority-badge">${prioridadeTexto}</span>
              </p>
            </div>
            
            <div class="content">
              <div class="card">
                <h2 style="color: #2c3e50; margin-top: 0;">${data.solicitacao?.titulo || 'Solicitação sem título'}</h2>
                
                <p><strong>📝 Código:</strong> ${data.solicitacao?.codigo_solicitacao || 'N/A'}</p>
                <p><strong>👤 Solicitante:</strong> ${data.solicitante?.nome || 'Não identificado'}</p>
                <p><strong>🏢 Departamento:</strong> ${data.solicitante?.departamento || 'Não informado'}</p>
                <p><strong>📅 Data:</strong> ${new Date(data.solicitacao?.data_solicitacao || new Date()).toLocaleString('pt-BR')}</p>
                <p><strong>🎯 Tipo:</strong> ${data.solicitacao?.tipo || 'Não especificado'}</p>
                
                ${data.solicitacao?.descricao ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <strong>📄 Descrição:</strong><br>
                  ${data.solicitacao.descricao}
                </div>
                ` : ''}
                
                ${data.itens && data.itens.length > 0 ? `
                <div class="items-list">
                  <h3 style="color: #2c3e50;">🛒 Itens Solicitados:</h3>
                  ${data.itens.map((item, index) => `
                    <div class="item-row">
                      <strong>${index + 1}. ${item.nome || item.nome_item}</strong><br>
                      Quantidade: ${item.quantidade_solicitada} | Status: ${item.status_item || 'Pendente'}
                      ${item.motivo_uso ? `<br><em>Motivo: ${item.motivo_uso}</em>` : ''}
                    </div>
                  `).join('')}
                </div>
                ` : ''}
                
                <a href="${process.env.APP_URL || '#'}/solicitacoes/${data.solicitacao?.id}" class="button">
                  👁️ Visualizar Solicitação Completa
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center;">
                <em>Por favor, analise e processe esta solicitação dentro do prazo estabelecido.</em>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0; font-size: 11px;">
                🏢 ${this.companyName} | 📞 Aprovações: ${this.supportEmail}<br>
                ⏰ Prazo para análise: 48 horas úteis<br>
                <span style="opacity: 0.7;">📍 Sistema de Gestão de Estoque - Departamento de TI</span>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  generateRequestStatusTemplate(data) {
    const statusConfig = {
      'aprovada': { emoji: '✅', cor: '#28a745', texto: 'APROVADA' },
      'rejeitada': { emoji: '❌', cor: '#dc3545', texto: 'REJEITADA' },
      'pendente': { emoji: '⏳', cor: '#ffc107', texto: 'PENDENTE' },
      'entregue': { emoji: '📦', cor: '#17a2b8', texto: 'ENTREGUE' },
      'cancelada': { emoji: '🚫', cor: '#6c757d', texto: 'CANCELADA' }
    };
    
    const status = data.status || 'pendente';
    const config = statusConfig[status] || statusConfig.pendente;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: ${config.cor}; color: white; padding: 25px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .card { background: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: ${config.cor}; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">${config.emoji} SOLICITAÇÃO ${config.texto}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Atualização de Status - Sistema de Estoque</p>
            </div>
            
            <div class="content">
              <div class="card">
                <h2 style="color: #2c3e50; margin-top: 0;">${data.solicitacao?.titulo || 'Solicitação'}</h2>
                
                <p><strong>📝 Código:</strong> ${data.solicitacao?.codigo_solicitacao || 'N/A'}</p>
                <p><strong>👤 Solicitante:</strong> ${data.solicitante?.nome || 'Não identificado'}</p>
                <p><strong>🔄 Status:</strong> <span style="color: ${config.cor}; font-weight: bold;">${config.texto}</span></p>
                <p><strong>👨‍💼 Responsável:</strong> ${data.aprovador?.nome || 'Sistema automático'}</p>
                <p><strong>📅 Data da Ação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                
                ${data.motivo ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <strong>📄 Observações:</strong><br>
                  ${data.motivo}
                </div>
                ` : ''}
                
                ${status === 'aprovada' ? `
                <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <strong>✅ Próximos Passos:</strong><br>
                  - A equipe de estoque será notificada<br>
                  - Preparação para retirada/entrega<br>
                  - Aguarde contato para procedimentos
                </div>
                ` : ''}
                
                ${status === 'rejeitada' ? `
                <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <strong>❌ Informações Adicionais:</strong><br>
                  - Entre em contato com o aprovador para esclarecimentos<br>
                  - Você pode criar uma nova solicitação ajustada<br>
                  - Consulte as políticas da empresa
                </div>
                ` : ''}
                
                <a href="${process.env.APP_URL || '#'}/solicitacoes/${data.solicitacao?.id}" class="button">
                  🔍 Ver Detalhes da Solicitação
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center;">
                <em>Esta é uma notificação automática do sistema.</em>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0; font-size: 11px;">
                🏢 ${this.companyName} | 📞 Dúvidas: ${this.supportEmail}<br>
                <span style="opacity: 0.7;">📍 Sistema de Gestão de Estoque - Departamento de TI</span>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  generateDefaultTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: #2C5AA0; color: white; padding: 25px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .card { background: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🔔 Notificação do Sistema</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${this.companyName} - Controle de Estoque TI</p>
            </div>
            
            <div class="content">
              <div class="card">
                <h2 style="color: #2c3e50; margin-top: 0;">${data.titulo || 'Mensagem Importante'}</h2>
                
                ${data.mensagem ? `<p>${data.mensagem}</p>` : ''}
                
                ${data.detalhes ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <strong>📋 Detalhes:</strong><br>
                  ${data.detalhes}
                </div>
                ` : ''}
                
                ${data.acao ? `
                <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <strong>🚀 Ação Necessária:</strong><br>
                  ${data.acao}
                </div>
                ` : ''}
                
                ${data.link ? `
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${data.link}" style="display: inline-block; padding: 12px 24px; background: #2C5AA0; color: white; text-decoration: none; border-radius: 5px;">
                    🔗 Acessar Sistema
                  </a>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0; font-size: 11px;">
                🏢 ${this.companyName} | 📞 Suporte: ${this.supportEmail}<br>
                📅 ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                <span style="opacity: 0.7;">📍 Sistema de Gestão de Estoque - Departamento de TI</span>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // 📤 MÉTODO PRINCIPAL DE ENVIO
  async sendEmail(to, subject, data = {}) {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Serviço de email não disponível. Email não enviado.');
        return {
          success: false,
          error: 'Email service not initialized',
          message: 'Configure as credenciais SMTP no arquivo .env'
        };
      }

      // Validar destinatários
      if (!to || (Array.isArray(to) && to.length === 0)) {
        return {
          success: false,
          error: 'No recipients specified'
        };
      }

      // Preparar destinatários
      const recipients = Array.isArray(to) ? to.join(', ') : to;
      
      // Gerar HTML do template
      const html = this.generateEmailTemplate({
        ...data,
        empresa: this.companyName,
        supportEmail: this.supportEmail
      });

      // Configurar email
      const mailOptions = {
        from: this.from,
        to: recipients,
        subject: subject,
        html: html,
        text: this.generatePlainText(data), // Versão texto puro para compatibilidade
        attachments: data.attachments || []
      };

      // Enviar email
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email enviado | Para: ${recipients} | Assunto: ${subject} | ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        recipients: recipients,
        subject: subject
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email:', error.message);
      
      return {
        success: false,
        error: error.message,
        recipients: to,
        subject: subject
      };
    }
  }

  // 📝 GERAR TEXTO SIMPLES (fallback)
  generatePlainText(data) {
    const tipo = data.template || 'default';
    
    switch(tipo) {
      case 'alerta_estoque':
        return `ALERTA DE ESTOQUE: ${data.item?.nome} - Quantidade: ${data.item?.quantidade}, Mínimo: ${data.item?.estoque_minimo}`;
      case 'nova_solicitacao':
        return `NOVA SOLICITAÇÃO: ${data.solicitacao?.titulo} - Código: ${data.solicitacao?.codigo_solicitacao}`;
      case 'solicitacao_status':
        return `ATUALIZAÇÃO DE SOLICITAÇÃO: Status alterado para ${data.status} - ${data.solicitacao?.titulo}`;
      default:
        return data.mensagem || subject || 'Notificação do Sistema de Estoque';
    }
  }

  // 🔔 MÉTODOS DE ALERTAS ESPECÍFICOS (COM INTEGRAÇÃO AO BD)
  async sendStockAlert(itemId, nivelAlerta = 'baixo') {
    try {
      // Buscar item do banco
      const item = await Item.findByPk(itemId, {
        attributes: ['id', 'nome', 'quantidade', 'estoque_minimo', 'patrimonio', 'numero_serie', 'localizacao']
      });

      if (!item) {
        console.error('❌ Item não encontrado para alerta de estoque');
        return { success: false, error: 'Item not found' };
      }

      // Buscar usuários que devem receber alertas
      const usuarios = await Usuario.findAll({
        where: {
          [Op.or]: [
            { perfil: 'admin' },
            { perfil: 'admin_estoque' },
            { responsavel_estoque: true },
            { receber_alertas_estoque: true }
          ],
          ativo: true
        },
        attributes: ['email', 'nome']
      });

      if (usuarios.length === 0) {
        console.warn('⚠️ Nenhum usuário configurado para receber alertas de estoque');
        return { success: false, error: 'No recipients configured' };
      }

      const emails = usuarios.map(u => u.email);
      const subject = `⚠️ Alerta de Estoque ${nivelAlerta.toUpperCase()}: ${item.nome}`;

      return await this.sendEmail(emails, subject, {
        template: 'alerta_estoque',
        item: item.toJSON(),
        nivelAlerta: nivelAlerta,
        titulo: `Alerta de Estoque ${nivelAlerta === 'zero' ? 'ZERADO' : nivelAlerta.toUpperCase()}`,
        mensagem: `O item ${item.nome} atingiu nível ${nivelAlerta} de estoque.`,
        detalhes: `Quantidade atual: ${item.quantidade} | Estoque mínimo: ${item.estoque_minimo}`,
        acao: 'Verifique a necessidade de reposição com urgência.'
      });

    } catch (error) {
      console.error('❌ Erro ao enviar alerta de estoque:', error);
      return { success: false, error: error.message };
    }
  }

  async sendNewSolicitationAlert(solicitacaoId) {
    try {
      const solicitacao = await Solicitacao.findByPk(solicitacaoId, {
        include: [
          {
            model: Usuario,
            as: 'solicitante',
            attributes: ['nome', 'email', 'departamento']
          },
          {
            model: SolicitacaoItens,
            as: 'itens',
            attributes: ['nome_item', 'quantidade_solicitada', 'status_item', 'motivo_uso']
          }
        ]
      });

      if (!solicitacao) {
        return { success: false, error: 'Solicitação não encontrada' };
      }

      // Buscar aprovadores/admin
      const aprovadores = await Usuario.findAll({
        where: {
          [Op.or]: [
            { perfil: 'admin' },
            { perfil: 'admin_estoque' },
            { permissao_aprovar_solicitacoes: true }
          ],
          ativo: true
        },
        attributes: ['email', 'nome']
      });

      const emails = aprovadores.map(a => a.email);
      
      // Adicionar solicitante para acompanhamento
      if (solicitacao.solicitante?.email) {
        emails.push(solicitacao.solicitante.email);
      }

      const subject = `📋 Nova Solicitação: ${solicitacao.codigo_solicitacao} - ${solicitacao.titulo}`;

      return await this.sendEmail([...new Set(emails)], subject, {
        template: 'nova_solicitacao',
        solicitacao: solicitacao.toJSON(),
        solicitante: solicitacao.solicitante?.toJSON(),
        itens: solicitacao.itens?.map(i => i.toJSON()) || [],
        prioridade: solicitacao.prioridade,
        titulo: 'Nova Solicitação Registrada',
        mensagem: `Uma nova solicitação foi criada e aguarda sua análise.`
      });

    } catch (error) {
      console.error('❌ Erro ao enviar alerta de nova solicitação:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSolicitationStatusUpdate(solicitacaoId, status, motivo = '', aprovadorId = null) {
    try {
      const solicitacao = await Solicitacao.findByPk(solicitacaoId, {
        include: [
          {
            model: Usuario,
            as: 'solicitante',
            attributes: ['nome', 'email']
          }
        ]
      });

      if (!solicitacao || !solicitacao.solicitante) {
        return { success: false, error: 'Solicitação ou solicitante não encontrado' };
      }

      let aprovador = null;
      if (aprovadorId) {
        aprovador = await Usuario.findByPk(aprovadorId, {
          attributes: ['nome', 'email']
        });
      }

      const statusConfig = {
        'aprovada': 'APROVADA ✅',
        'rejeitada': 'REJEITADA ❌',
        'entregue': 'ENTREGUE 📦',
        'cancelada': 'CANCELADA 🚫'
      };

      const statusText = statusConfig[status] || status.toUpperCase();

      const subject = `🔄 Solicitação ${statusText.split(' ')[0]}: ${solicitacao.codigo_solicitacao}`;

      return await this.sendEmail(solicitacao.solicitante.email, subject, {
        template: 'solicitacao_status',
        solicitacao: solicitacao.toJSON(),
        solicitante: solicitacao.solicitante.toJSON(),
        aprovador: aprovador?.toJSON(),
        status: status,
        motivo: motivo,
        titulo: `Atualização de Status da Solicitação`,
        mensagem: `Sua solicitação foi ${status === 'aprovada' ? 'aprovada' : status === 'rejeitada' ? 'rejeitada' : 'atualizada'}.`
      });

    } catch (error) {
      console.error('❌ Erro ao enviar atualização de status:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDailyStockSummary() {
    try {
      // Buscar resumo do dia
      const hoje = new Date();
      const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
      const fimDia = new Date(hoje.setHours(23, 59, 59, 999));

      const [solicitacoesHoje, itensBaixoEstoque, alertasPendentes] = await Promise.all([
        Solicitacao.count({
          where: {
            data_solicitacao: {
              [Op.between]: [inicioDia, fimDia]
            }
          }
        }),
        Item.count({
          where: {
            quantidade: {
              [Op.lte]: Sequelize.col('estoque_minimo')
            }
          }
        }),
        AlertasEstoque.count({
          where: {
            lido: false,
            data_alerta: {
              [Op.between]: [inicioDia, fimDia]
            }
          }
        })
      ]);

      // Buscar destinatários
      const destinatarios = await Usuario.findAll({
        where: {
          [Op.or]: [
            { perfil: 'admin' },
            { perfil: 'admin_estoque' },
            { responsavel_estoque: true },
            { permissao_acesso_dashboard: true }
          ],
          ativo: true,
          receber_alertas_estoque: true
        },
        attributes: ['email']
      });

      if (destinatarios.length === 0) {
        return { success: false, error: 'No recipients for daily summary' };
      }

      const emails = destinatarios.map(d => d.email);
      const dataFormatada = hoje.toLocaleDateString('pt-BR');
      
      const subject = `📊 Resumo Diário do Estoque - ${dataFormatada}`;

      return await this.sendEmail(emails, subject, {
        template: 'resumo_diario',
        titulo: `Resumo Diário - ${dataFormatada}`,
        mensagem: 'Acompanhe as principais métricas do estoque do dia:',
        detalhes: `
          📋 Solicitações hoje: ${solicitacoesHoje}<br>
          ⚠️ Itens com estoque baixo: ${itensBaixoEstoque}<br>
          🔔 Alertas pendentes: ${alertasPendentes}
        `,
        acao: 'Acesse o dashboard para análises detalhadas.',
        link: `${process.env.APP_URL}/dashboard`
      });

    } catch (error) {
      console.error('❌ Erro ao enviar resumo diário:', error);
      return { success: false, error: error.message };
    }
  }

  async sendReturnReminder(solicitacaoId) {
    try {
      const solicitacao = await Solicitacao.findByPk(solicitacaoId, {
        include: [
          {
            model: Usuario,
            as: 'solicitante',
            attributes: ['nome', 'email']
          }
        ],
        where: {
          status: 'entregue',
          data_devolucao_prevista: {
            [Op.not]: null
          }
        }
      });

      if (!solicitacao || !solicitacao.data_devolucao_prevista) {
        return { success: false, error: 'Solicitação sem data de devolução prevista' };
      }

      const diasRestantes = Math.ceil(
        (new Date(solicitacao.data_devolucao_prevista) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (diasRestantes <= 7 && diasRestantes >= 0) {
        const subject = `⏰ Lembrete de Devolução: ${solicitacao.codigo_solicitacao}`;

        return await this.sendEmail(solicitacao.solicitante.email, subject, {
          template: 'lembrete_devolucao',
          solicitacao: solicitacao.toJSON(),
          solicitante: solicitacao.solicitante.toJSON(),
          diasRestantes: diasRestantes,
          titulo: 'Lembrete de Devolução de Equipamento',
          mensagem: `A devolução do equipamento está próxima do prazo.`,
          detalhes: `
            Data prevista: ${new Date(solicitacao.data_devolucao_prevista).toLocaleDateString('pt-BR')}<br>
            Dias restantes: ${diasRestantes} dia(s)
          `,
          acao: 'Prepare o equipamento para devolução.',
          link: `${process.env.APP_URL}/solicitacoes/${solicitacao.id}`
        });
      }

      return { success: false, error: 'Not within reminder period' };

    } catch (error) {
      console.error('❌ Erro ao enviar lembrete de devolução:', error);
      return { success: false, error: error.message };
    }
  }

  // 🧪 MÉTODO DE TESTE
  async sendTestEmail(to) {
    const testTo = to || process.env.TEST_EMAIL || this.config.auth.user;
    
    if (!testTo) {
      return { success: false, error: 'No test email address provided' };
    }

    return await this.sendEmail(testTo, '✅ Teste de Email - Sistema de Estoque TI', {
      template: 'default',
      titulo: 'Teste de Configuração de Email',
      mensagem: 'Este é um email de teste enviado pelo sistema de controle de estoque.',
      detalhes: `
        ✅ Serviço de email funcionando corretamente<br>
        ⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}<br>
        🖥️ Sistema: Controle de Estoque TI<br>
        📧 Remetente: ${this.from}
      `,
      acao: 'Se você recebeu esta mensagem, o serviço de notificações está configurado corretamente.',
      link: process.env.APP_URL
    });
  }
}

// Exportar instância única
module.exports = new EmailService();