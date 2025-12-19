import BaseTemplate from '../ReportTemplates/BaseTemplate';

class MovimentacoesPDF {
  
  static generate(movimentacoes, options = {}) {
    const { 
      title = 'Relatório de Movimentações',
      includeHeader = true,
      includeSummary = true,
      periodo = ''
    } = options;

    const header = includeHeader ? 
      BaseTemplate.generateHeader(
        title, 
        periodo ? `Período: ${periodo}` : 'Histórico completo de movimentações'
      ) : '';

    const summary = includeSummary ? this.generateSummary(movimentacoes) : '';

    const tableContent = this.generateTable(movimentacoes);

    const footer = BaseTemplate.generateFooter();

    return `
      ${header}
      ${summary}
      ${tableContent}
      ${footer}
    `;
  }

  static generateSection(movimentacoes, options = {}) {
    return `
      <div style="margin: 30px 0;">
        <h3 style="color: #2c5aa0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">🔄 Movimentações</h3>
        ${this.generateTable(movimentacoes)}
      </div>
    `;
  }

  static generateSummary(movimentacoes) {
    const totalMovimentacoes = movimentacoes.length;
    const entradas = movimentacoes.filter(m => m.tipo === 'entrada').length;
    const saidas = movimentacoes.filter(m => m.tipo === 'saida').length;
    const devolucoes = movimentacoes.filter(m => m.tipo === 'devolucao').length;
    const ajustes = movimentacoes.filter(m => m.tipo === 'ajuste').length;

    const totalQuantidade = movimentacoes.reduce((sum, mov) => sum + (mov.quantidade || 0), 0);

    // Última movimentação
    const ultimaMov = movimentacoes.length > 0 ? 
      new Date(movimentacoes[0].data_movimentacao).toLocaleDateString('pt-BR') : 'N/A';

    return `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
        <h4 style="margin: 0 0 15px 0; color: #2c5aa0;">📊 Resumo de Movimentações</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
          <div><strong>Total de Movimentações:</strong> ${totalMovimentacoes}</div>
          <div><strong>Entradas:</strong> <span style="color: #28a745;">${entradas}</span></div>
          <div><strong>Saídas:</strong> <span style="color: #dc3545;">${saidas}</span></div>
          <div><strong>Devoluções:</strong> <span style="color: #17a2b8;">${devolucoes}</span></div>
          <div><strong>Ajustes:</strong> <span style="color: #ffc107;">${ajustes}</span></div>
          <div><strong>Quantidade Total:</strong> ${totalQuantidade}</div>
          <div><strong>Última Movimentação:</strong> ${ultimaMov}</div>
        </div>
      </div>
    `;
  }

  static generateTable(movimentacoes) {
    if (!movimentacoes || movimentacoes.length === 0) {
      return '<p style="text-align: center; color: #666; font-style: italic;">Nenhuma movimentação encontrada</p>';
    }

    const headers = ['Data/Hora', 'Tipo', 'Item', 'Patrimônio', 'Quantidade', 'Destinatário', 'Departamento', 'Usuário'];
    
    const rows = movimentacoes.map(mov => [
      new Date(mov.data_movimentacao).toLocaleString('pt-BR'),
      this.formatTipo(mov.tipo),
      mov.item?.nome || '-',
      mov.item?.patrimonio || '-',
      mov.quantidade || 0,
      mov.destinatario || '-',
      mov.departamento_destino || '-',
      mov.usuario?.nome || '-'
    ]);

    // Adicionar linha de total
    const totalRow = [
      'TOTAL',
      '',
      '',
      '',
      movimentacoes.reduce((sum, mov) => sum + (mov.quantidade || 0), 0),
      '',
      '',
      `${movimentacoes.length} movimentações`
    ];

    rows.push(totalRow);

    return BaseTemplate.generateTable(headers, rows);
  }

  static formatTipo(tipo) {
    const tipos = {
      'entrada': { text: '📥 Entrada', color: '#28a745' },
      'saida': { text: '📤 Saída', color: '#dc3545' },
      'devolucao': { text: '🔄 Devolução', color: '#17a2b8' },
      'ajuste': { text: '⚙️ Ajuste', color: '#ffc107' }
    };

    const tipoInfo = tipos[tipo] || { text: tipo, color: '#6c757d' };
    return `<span style="color: ${tipoInfo.color}; font-weight: bold;">${tipoInfo.text}</span>`;
  }
}

export default MovimentacoesPDF;