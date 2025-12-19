// 📁 backend/src/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEstoqueBaixo(item, usuario) {
    const subject = `⚠️ Alerta: Estoque Baixo - ${item.nome}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">⚠️ Alerta de Estoque Baixo</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
          <h3 style="margin-top: 0;">${item.nome}</h3>
          <p><strong>Quantidade Atual:</strong> ${item.quantidade}</p>
          <p><strong>Quantidade Mínima:</strong> ${item.quantidade_minima}</p>
          <p><strong>Patrimônio:</strong> ${item.patrimonio || 'N/A'}</p>
          <p><strong>Localização:</strong> ${item.localizacao || 'N/A'}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 6px;">
          <p><strong>Ação Recomendada:</strong> Realizar nova aquisição do item.</p>
        </div>

        <div style="margin-top: 20px; font-size: 12px; color: #6c757d;">
          <p>Sistema de Controle de Estoque TI<br>
          Este é um alerta automático.</p>
        </div>
      </div>
    `;

    return this.sendEmail(usuario.email, subject, html);
  }

  async sendManutencaoAtrasada(manutencao, usuario) {
    const subject = `🔧 Alerta: Manutenção Atrasada`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e67e22;">🔧 Manutenção Atrasada</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #e67e22;">
          <h3 style="margin-top: 0;">${manutencao.item.nome}</h3>
          <p><strong>Tipo:</strong> ${manutencao.tipo}</p>
          <p><strong>Problema:</strong> ${manutencao.descricao_problema}</p>
          <p><strong>Data Solicitação:</strong> ${new Date(manutencao.data_solicitacao).toLocaleDateString('pt-BR')}</p>
          <p><strong>Técnico:</strong> ${manutencao.tecnico_responsavel || 'N/A'}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 6px;">
          <p><strong>Ação Recomendada:</strong> Verificar status da manutenção.</p>
        </div>
      </div>
    `;

    return this.sendEmail(usuario.email, subject, html);
  }

  async sendDevolucaoAtrasada(movimentacao, usuario) {
    const subject = `📅 Alerta: Devolução Atrasada`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">📅 Devolução Atrasada</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
          <h3 style="margin-top: 0;">${movimentacao.item.nome}</h3>
          <p><strong>Destinatário:</strong> ${movimentacao.destinatario}</p>
          <p><strong>Data Saída:</strong> ${new Date(movimentacao.data_movimentacao).toLocaleDateString('pt-BR')}</p>
          <p><strong>Data Devolução Prevista:</strong> ${new Date(movimentacao.data_devolucao_prevista).toLocaleDateString('pt-BR')}</p>
          <p><strong>Dias em Atraso:</strong> ${Math.floor((new Date() - new Date(movimentacao.data_devolucao_prevista)) / (1000 * 60 * 60 * 24))}</p>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 6px;">
          <p><strong>Ação Recomendada:</strong> Contactar o destinatário para devolução.</p>
        </div>
      </div>
    `;

    return this.sendEmail(usuario.email, subject, html);
  }

  async sendRelatorioDiario(dados, usuarios) {
    const subject = `📊 Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`;
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">📊 Relatório Diário do Estoque</h2>
        <p style="color: #6c757d;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #27ae60;">${dados.totalItens}</h3>
            <p style="margin: 5px 0 0 0; color: #2c3e50;">Total de Itens</p>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #f39c12;">${dados.movimentacoesHoje}</h3>
            <p style="margin: 5px 0 0 0; color: #2c3e50;">Mov. Hoje</p>
          </div>
        </div>
    `;

    if (dados.estoqueBaixo && dados.estoqueBaixo.length > 0) {
      html += `
        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ Itens com Estoque Baixo</h4>
          <ul style="margin: 0; padding-left: 20px;">
            ${dados.estoqueBaixo.map(item => 
              `<li>${item.nome} - ${item.quantidade} unidades (mín: ${item.quantidade_minima})</li>`
            ).join('')}
          </ul>
        </div>
      `;
    }

    if (dados.manutencoesAbertas && dados.manutencoesAbertas.length > 0) {
      html += `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin: 0 0 10px 0; color: #856404;">🔧 Manutenções em Aberto</h4>
          <ul style="margin: 0; padding-left: 20px;">
            ${dados.manutencoesAbertas.map(manut => 
              `<li>${manut.item.nome} - ${manut.tipo}</li>`
            ).join('')}
          </ul>
        </div>
      `;
    }

    html += `
        <div style="margin-top: 20px; font-size: 12px; color: #6c757d; text-align: center;">
          <p>Sistema de Controle de Estoque TI<br>
          Relatório gerado automaticamente</p>
        </div>
      </div>
    `;

    // Enviar para todos os usuários admin/coordenador
    const adminUsers = usuarios.filter(u => u.perfil === 'admin' || u.perfil === 'coordenador');
    
    for (const user of adminUsers) {
      await this.sendEmail(user.email, subject, html);
    }
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'sistema@estoque.com',
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();