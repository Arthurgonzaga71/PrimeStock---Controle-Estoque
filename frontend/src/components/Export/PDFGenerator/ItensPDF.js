import BaseTemplate from '../ReportTemplates/BaseTemplate';

class ItensPDF {
  
  static generate(itens, options = {}) {
    const { 
      title = 'Relatório de Itens do Estoque',
      includeHeader = true,
      includeSummary = true 
    } = options;

    const header = includeHeader ? 
      BaseTemplate.generateHeader(title, 'Lista completa de itens em estoque') : '';

    const summary = includeSummary ? this.generateSummary(itens) : '';

    const tableContent = this.generateTable(itens);

    const footer = BaseTemplate.generateFooter();

    return `
      ${header}
      ${summary}
      ${tableContent}
      ${footer}
    `;
  }

  static generateSection(itens, options = {}) {
    return `
      <div style="margin: 30px 0;">
        <h3 style="color: #2c5aa0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">📦 Itens em Estoque</h3>
        ${this.generateTable(itens)}
      </div>
    `;
  }

  static generateSummary(itens) {
    const totalItens = itens.length;
    const itensDisponiveis = itens.filter(item => item.status === 'disponivel').length;
    const itensEmprestados = itens.filter(item => item.status === 'emprestado').length;
    const itensBaixoEstoque = itens.filter(item => 
      item.quantidade <= item.quantidade_minima
    ).length;
    const valorTotal = itens.reduce((sum, item) => 
      sum + (item.valor || 0) * (item.quantidade || 0), 0
    );

    return `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
        <h4 style="margin: 0 0 15px 0; color: #2c5aa0;">📊 Resumo do Estoque</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
          <div><strong>Total de Itens:</strong> ${totalItens}</div>
          <div><strong>Itens Disponíveis:</strong> <span style="color: #28a745;">${itensDisponiveis}</span></div>
          <div><strong>Itens Emprestados:</strong> <span style="color: #ffc107;">${itensEmprestados}</span></div>
          <div><strong>Estoque Baixo:</strong> <span style="color: #dc3545;">${itensBaixoEstoque}</span></div>
          <div><strong>Valor Total:</strong> R$ ${valorTotal.toFixed(2)}</div>
        </div>
      </div>
    `;
  }

  static generateTable(itens) {
    if (!itens || itens.length === 0) {
      return '<p style="text-align: center; color: #666; font-style: italic;">Nenhum item encontrado</p>';
    }

    const headers = ['Nome', 'Categoria', 'Patrimônio', 'Quantidade', 'Valor Unit.', 'Status', 'Localização'];
    
    const rows = itens.map(item => [
      item.nome || '-',
      item.categoria?.nome || '-',
      item.patrimonio || '-',
      item.quantidade || 0,
      `R$ ${(item.valor || 0).toFixed(2)}`,
      this.formatStatus(item),
      item.localizacao || '-'
    ]);

    // Adicionar linha de total
    const totalRow = [
      'TOTAL',
      '',
      '',
      itens.reduce((sum, item) => sum + (item.quantidade || 0), 0),
      `R$ ${itens.reduce((sum, item) => sum + ((item.valor || 0) * (item.quantidade || 0)), 0).toFixed(2)}`,
      '',
      `${itens.length} itens`
    ];

    rows.push(totalRow);

    return BaseTemplate.generateTable(headers, rows);
  }

  static formatStatus(item) {
    const statusMap = {
      'disponivel': { text: 'Disponível', class: 'status-disponivel' },
      'emprestado': { text: 'Emprestado', class: 'status-emprestado' },
      'manutencao': { text: 'Manutenção', class: 'status-baixo' }
    };

    let status = statusMap[item.status] || { text: 'Indisponível', class: 'status-baixo' };
    
    // Verificar estoque baixo
    if (item.quantidade <= item.quantidade_minima) {
      status = { text: 'Estoque Baixo', class: 'status-baixo' };
    }

    return `<span class="${status.class}">${status.text}</span>`;
  }
}

export default ItensPDF;