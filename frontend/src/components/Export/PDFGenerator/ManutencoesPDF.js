import BaseTemplate from '../ReportTemplates/BaseTemplate';

class ManutencoesPDF {
  
  static generate(manutencoes, options = {}) {
    const { 
      title = 'Relatório de Manutenções',
      includeHeader = true,
      includeSummary = true
    } = options;

    const header = includeHeader ? 
      BaseTemplate.generateHeader(title, 'Histórico de manutenções e reparos') : '';

    const summary = includeSummary ? this.generateSummary(manutencoes) : '';

    const tableContent = this.generateTable(manutencoes);

    const footer = BaseTemplate.generateFooter();

    return `
      ${header}
      ${summary}
      ${tableContent}
      ${footer}
    `;
  }

  static generateSection(manutencoes, options = {}) {
    return `
      <div style="margin: 30px 0;">
        <h3 style="color: #2c5aa0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">🔧 Manutenções</h3>
        ${this.generateTable(manutencoes)}
      </div>
    `;
  }

  static generateSummary(manutencoes) {
    const totalManutencoes = manutencoes.length;
    const abertas = manutencoes.filter(m => m.status === 'aberta').length;
    const concluidas = manutencoes.filter(m => m.status === 'concluida').length;
    const canceladas = manutencoes.filter(m => m.status === 'cancelada').length;
    
    const preventivas = manutencoes.filter(m => m.tipo === 'preventiva').length;
    const corretivas = manutencoes.filter(m => m.tipo === 'corretiva').length;

    const custoTotal = manutencoes.reduce((sum, manut) => sum + (manut.custo || 0), 0);
    const custoMedio = totalManutencoes > 0 ? custoTotal / totalManutencoes : 0;

    return `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
        <h4 style="margin: 0 0 15px 0; color: #2c5aa0;">📊 Resumo de Manutenções</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
          <div><strong>Total de Manutenções:</strong> ${totalManutencoes}</div>
          <div><strong>Abertas:</strong> <span style="color: #dc3545;">${abertas}</span></div>
          <div><strong>Concluídas:</strong> <span style="color: #28a745;">${concluidas}</span></div>
          <div><strong>Canceladas:</strong> <span style="color: #6c757d;">${canceladas}</span></div>
          <div><strong>Preventivas:</strong> ${preventivas}</div>
          <div><strong>Corretivas:</strong> ${corretivas}</div>
          <div><strong>Custo Total:</strong> R$ ${custoTotal.toFixed(2)}</div>
          <div><strong>Custo Médio:</strong> R$ ${custoMedio.toFixed(2)}</div>
        </div>
      </div>
    `;
  }

  static generateTable(manutencoes) {
    if (!manutencoes || manutencoes.length === 0) {
      return '<p style="text-align: center; color: #666; font-style: italic;">Nenhuma manutenção encontrada</p>';
    }

    const headers = ['Item', 'Patrimônio', 'Tipo', 'Status', 'Custo (R$)', 'Data Solicitação', 'Data Conclusão', 'Técnico'];
    
    const rows = manutencoes.map(manut => [
      manut.item?.nome || '-',
      manut.item?.patrimonio || '-',
      this.formatTipo(manut.tipo),
      this.formatStatus(manut.status),
      manut.custo ? manut.custo.toFixed(2) : '0,00',
      new Date(manut.data_solicitacao).toLocaleDateString('pt-BR'),
      manut.data_conclusao ? new Date(manut.data_conclusao).toLocaleDateString('pt-BR') : '-',
      manut.tecnico_responsavel || '-'
    ]);

    // Adicionar linha de total
    const totalCusto = manutencoes.reduce((sum, manut) => sum + (manut.custo || 0), 0);
    const totalRow = [
      'TOTAL',
      '',
      '',
      '',
      totalCusto.toFixed(2),
      '',
      '',
      `${manutencoes.length} manutenções`
    ];

    rows.push(totalRow);

    return BaseTemplate.generateTable(headers, rows);
  }

  static formatTipo(tipo) {
    const tipos = {
      'preventiva': { text: '🛡️ Preventiva', color: '#28a745' },
      'corretiva': { text: '🔧 Corretiva', color: '#dc3545' },
      'preditiva': { text: '📊 Preditiva', color: '#17a2b8' }
    };

    const tipoInfo = tipos[tipo] || { text: tipo, color: '#6c757d' };
    return `<span style="color: ${tipoInfo.color}; font-weight: bold;">${tipoInfo.text}</span>`;
  }

  static formatStatus(status) {
    const statusMap = {
      'aberta': { text: '🔴 Aberta', color: '#dc3545' },
      'concluida': { text: '🟢 Concluída', color: '#28a745' },
      'cancelada': { text: '⚫ Cancelada', color: '#6c757d' },
      'andamento': { text: '🟡 Andamento', color: '#ffc107' }
    };

    const statusInfo = statusMap[status] || { text: status, color: '#6c757d' };
    return `<span style="color: ${statusInfo.color}; font-weight: bold;">${statusInfo.text}</span>`;
  }
}

export default ManutencoesPDF;