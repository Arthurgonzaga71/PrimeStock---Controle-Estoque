// 📁 frontend/src/utils/exportUtils.js - VERSÃO CORRIGIDA
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ==================== CONFIGURAÇÕES GLOBAIS ====================
const PDF_CONFIG = {
  headerColor: [41, 128, 185],
  headerTextColor: [255, 255, 255],
  rowEvenColor: [245, 245, 245],
  rowOddColor: [255, 255, 255],
  textColor: [0, 0, 0],
  secondaryTextColor: [100, 100, 100]
};

// ==================== FUNÇÕES AUXILIARES ====================
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('pt-BR');
};

const truncateText = (text, maxLength = 50) => {
  if (!text) return 'N/A';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// ==================== PDF EXPORTS ====================

/**
 * Exporta dados genéricos para PDF
 */
export const exportToPDF = (data, columns, title, filename, options = {}) => {
  try {
    const doc = new jsPDF();
    const { includeHeader = true, includeFooter = true, landscape = false } = options;

    if (landscape) {
      doc.deletePage(1);
      doc.addPage([297, 210], 'l'); // A4 landscape
    }

    // Configurações do documento
    doc.setProperties({
      title: title,
      subject: 'Relatório do Sistema de Estoque TI',
      author: 'Sistema de Estoque TI',
      creator: 'Sistema de Estoque TI'
    });

    // Cabeçalho
    if (includeHeader) {
      doc.setFillColor(...PDF_CONFIG.headerColor);
      doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
      
      doc.setTextColor(...PDF_CONFIG.headerTextColor);
      doc.setFontSize(16);
      doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 25);
      doc.text(`Total de registros: ${data.length}`, doc.internal.pageSize.width - 14, 25, { align: 'right' });
    }

    // Preparar dados para tabela
    const tableColumns = columns.map(col => ({
      header: col.header,
      dataKey: col.key
    }));

    const tableData = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        if (col.format === 'currency') return formatCurrency(value);
        if (col.format === 'date') return formatDate(value);
        if (col.format === 'datetime') return formatDateTime(value);
        if (col.format === 'truncate') return truncateText(value, col.maxLength);
        return value || '';
      })
    );

    // Adicionar tabela
    doc.autoTable({
      startY: includeHeader ? 35 : 20,
      head: [columns.map(col => col.header)],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: PDF_CONFIG.headerColor,
        textColor: PDF_CONFIG.headerTextColor,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: PDF_CONFIG.rowEvenColor
      },
      margin: { top: 10, right: 14, bottom: 10, left: 14 }
    });

    // Rodapé
    if (includeFooter) {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(...PDF_CONFIG.secondaryTextColor);
        doc.text(
          `Página ${i} de ${pageCount} - Sistema de Controle de Estoque TI - ${new Date().getFullYear()}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    }

    // Salvar arquivo
    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF: ' + error.message);
  }
};

/**
 * Exporta relatório de itens para PDF
 */
export const exportItensToPDF = (itens, filtros = {}) => {
  const columns = [
    { header: 'Nome', key: 'nome', format: 'truncate', maxLength: 30 },
    { header: 'Categoria', key: 'categoria' },
    { header: 'Patrimônio', key: 'patrimonio' },
    { header: 'Quantidade', key: 'quantidade' },
    { header: 'Qtd. Mínima', key: 'quantidade_minima' },
    { header: 'Valor Unitário', key: 'valor', format: 'currency' },
    { header: 'Status', key: 'status' },
    { header: 'Estado', key: 'estado' },
    { header: 'Localização', key: 'localizacao' }
  ];

  const data = itens.map(item => ({
    ...item,
    categoria: item.categoria?.nome || 'N/A',
    valor: item.valor || 0
  }));

  let title = 'RELATÓRIO DE ITENS DO ESTOQUE';
  if (filtros.categoria) title += ` - Categoria: ${filtros.categoria}`;
  if (filtros.status) title += ` - Status: ${filtros.status}`;

  return exportToPDF(data, columns, title, 'relatorio-itens', {
    landscape: true
  });
};

/**
 * Exporta relatório de movimentações para PDF
 */
export const exportMovimentacoesToPDF = (movimentacoes, filtros = {}) => {
  const columns = [
    { header: 'Data', key: 'data_movimentacao', format: 'datetime' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Item', key: 'item', format: 'truncate', maxLength: 25 },
    { header: 'Quantidade', key: 'quantidade' },
    { header: 'Destinatário', key: 'destinatario', format: 'truncate', maxLength: 20 },
    { header: 'Departamento', key: 'departamento' },
    { header: 'Usuário', key: 'usuario' },
    { header: 'Devolução Prevista', key: 'data_devolucao_prevista', format: 'date' },
    { header: 'Status', key: 'status_movimentacao' }
  ];

  const data = movimentacoes.map(mov => ({
    ...mov,
    item: mov.item?.nome || 'N/A',
    usuario: mov.usuario?.nome || 'Sistema',
    status_movimentacao: mov.status_movimentacao || 'Concluída'
  }));

  let title = 'RELATÓRIO DE MOVIMENTAÇÕES';
  if (filtros.tipo) title += ` - Tipo: ${filtros.tipo}`;
  if (filtros.dataInicio && filtros.dataFim) {
    title += ` - Período: ${formatDate(filtros.dataInicio)} à ${formatDate(filtros.dataFim)}`;
  }

  return exportToPDF(data, columns, title, 'relatorio-movimentacoes', {
    landscape: true
  });
};

/**
 * Exporta relatório de manutenções para PDF
 */
export const exportManutencoesToPDF = (manutencoes, filtros = {}) => {
  const columns = [
    { header: 'Item', key: 'item', format: 'truncate', maxLength: 25 },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Status', key: 'status' },
    { header: 'Custo', key: 'custo', format: 'currency' },
    { header: 'Data Solicitação', key: 'data_solicitacao', format: 'date' },
    { header: 'Data Conclusão', key: 'data_conclusao', format: 'date' },
    { header: 'Técnico', key: 'tecnico' },
    { header: 'Problema', key: 'problema', format: 'truncate', maxLength: 30 },
    { header: 'Solução', key: 'solucao', format: 'truncate', maxLength: 30 }
  ];

  const data = manutencoes.map(manut => ({
    ...manut,
    item: manut.item?.nome || 'N/A',
    problema: manut.descricao_problema,
    solucao: manut.descricao_solucao,
    tecnico: manut.tecnico_responsavel || 'N/A',
    custo: manut.custo || 0
  }));

  let title = 'RELATÓRIO DE MANUTENÇÕES';
  if (filtros.tipo) title += ` - Tipo: ${filtros.tipo}`;
  if (filtros.status) title += ` - Status: ${filtros.status}`;

  return exportToPDF(data, columns, title, 'relatorio-manutencoes');
};

// ==================== EXCEL/CSV EXPORTS ====================

/**
 * Exporta dados genéricos para Excel/CSV
 */
export const exportToExcel = (data, columns, filename, format = 'csv') => {
  try {
    // Preparar cabeçalhos
    const headers = columns.map(col => col.header);
    
    // Preparar dados
    const csvData = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        if (col.format === 'currency') return formatCurrency(value);
        if (col.format === 'date') return formatDate(value);
        if (col.format === 'datetime') return formatDateTime(value);
        return value || '';
      })
    );

    // Criar conteúdo CSV
    const csvContent = [
      headers,
      ...csvData
    ].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([`\uFEFF${csvContent}`], { 
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.${format}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    throw new Error('Falha ao exportar Excel: ' + error.message);
  }
};

/**
 * Exporta relatório de itens para Excel
 */
export const exportItensToExcel = (itens, filtros = {}) => {
  const columns = [
    { header: 'Nome', key: 'nome' },
    { header: 'Categoria', key: 'categoria' },
    { header: 'Patrimônio', key: 'patrimonio' },
    { header: 'Quantidade', key: 'quantidade' },
    { header: 'Quantidade Mínima', key: 'quantidade_minima' },
    { header: 'Valor Unitário', key: 'valor', format: 'currency' },
    { header: 'Valor Total', key: 'valor_total', format: 'currency' },
    { header: 'Status', key: 'status' },
    { header: 'Estado', key: 'estado' },
    { header: 'Localização', key: 'localizacao' },
    { header: 'Descrição', key: 'descricao' },
    { header: 'Data de Cadastro', key: 'createdAt', format: 'datetime' }
  ];

  const data = itens.map(item => ({
    ...item,
    categoria: item.categoria?.nome || 'N/A',
    valor: item.valor || 0,
    valor_total: (item.valor || 0) * (item.quantidade || 0),
    createdAt: item.createdAt || new Date().toISOString()
  }));

  return exportToExcel(data, columns, 'relatorio-itens', 'csv');
};

/**
 * Exporta relatório de movimentações para Excel
 */
export const exportMovimentacoesToExcel = (movimentacoes, filtros = {}) => {
  const columns = [
    { header: 'Data Movimentação', key: 'data_movimentacao', format: 'datetime' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Item', key: 'item' },
    { header: 'Quantidade', key: 'quantidade' },
    { header: 'Destinatário', key: 'destinatario' },
    { header: 'Departamento Destino', key: 'departamento_destino' },
    { header: 'Usuário', key: 'usuario' },
    { header: 'Data Devolução Prevista', key: 'data_devolucao_prevista', format: 'date' },
    { header: 'Data Devolução Real', key: 'data_devolucao_real', format: 'date' },
    { header: 'Observação', key: 'observacao' },
    { header: 'Status', key: 'status_movimentacao' }
  ];

  const data = movimentacoes.map(mov => ({
    ...mov,
    item: mov.item?.nome || 'N/A',
    usuario: mov.usuario?.nome || 'Sistema'
  }));

  return exportToExcel(data, columns, 'relatorio-movimentacoes', 'csv');
};

/**
 * Exporta relatório de manutenções para Excel
 */
export const exportManutencoesToExcel = (manutencoes, filtros = {}) => {
  const columns = [
    { header: 'Item', key: 'item' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Status', key: 'status' },
    { header: 'Custo', key: 'custo', format: 'currency' },
    { header: 'Data Solicitação', key: 'data_solicitacao', format: 'datetime' },
    { header: 'Data Conclusão', key: 'data_conclusao', format: 'datetime' },
    { header: 'Técnico Responsável', key: 'tecnico_responsavel' },
    { header: 'Descrição do Problema', key: 'descricao_problema' },
    { header: 'Descrição da Solução', key: 'descricao_solucao' },
    { header: 'Tempo de Resolução (dias)', key: 'tempo_resolucao' }
  ];

  const data = manutencoes.map(manut => ({
    ...manut,
    item: manut.item?.nome || 'N/A',
    custo: manut.custo || 0,
    tempo_resolucao: manut.data_conclusao ? 
      Math.ceil((new Date(manut.data_conclusao) - new Date(manut.data_solicitacao)) / (1000 * 60 * 60 * 24)) : 
      'Em andamento'
  }));

  return exportToExcel(data, columns, 'relatorio-manutencoes', 'csv');
};

// ==================== RELATÓRIOS CONSOLIDADOS ====================

/**
 * Exporta relatório consolidado completo
 */
export const exportRelatorioConsolidado = async (dadosConsolidados) => {
  try {
    const doc = new jsPDF();
    
    // Página 1 - Resumo Executivo
    doc.setFillColor(...PDF_CONFIG.headerColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('RELATÓRIO CONSOLIDADO - ESTOQUE TI', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Período: ${formatDate(dadosConsolidados.periodo.inicio)} à ${formatDate(dadosConsolidados.periodo.fim)}`, 105, 30, { align: 'center' });
    
    // Estatísticas
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('RESUMO EXECUTIVO', 14, 55);
    
    const stats = [
      `Total de Itens: ${dadosConsolidados.estatisticas.totalItens}`,
      `Valor Total do Estoque: ${formatCurrency(dadosConsolidados.estatisticas.valorTotal)}`,
      `Movimentações no Período: ${dadosConsolidados.estatisticas.totalMovimentacoes}`,
      `Manutenções Realizadas: ${dadosConsolidados.estatisticas.totalManutencoes}`,
      `Itens com Estoque Baixo: ${dadosConsolidados.estatisticas.itensEstoqueBaixo}`,
      `Itens em Manutenção: ${dadosConsolidados.estatisticas.itensEmManutencao}`
    ];
    
    stats.forEach((stat, index) => {
      doc.setFontSize(10);
      doc.text(`• ${stat}`, 20, 70 + (index * 6));
    });

    // Página 2 - Itens com Estoque Baixo
    doc.addPage();
    doc.setFontSize(16);
    doc.text('ITENS COM ESTOQUE BAIXO', 14, 20);
    
    if (dadosConsolidados.itensEstoqueBaixo.length > 0) {
      const columns = [
        { header: 'Item', key: 'nome' },
        { header: 'Quantidade', key: 'quantidade' },
        { header: 'Qtd. Mínima', key: 'quantidade_minima' },
        { header: 'Localização', key: 'localizacao' }
      ];
      
      const tableData = dadosConsolidados.itensEstoqueBaixo.map(item => [
        item.nome,
        item.quantidade,
        item.quantidade_minima,
        item.localizacao || 'N/A'
      ]);
      
      doc.autoTable({
        startY: 30,
        head: [columns.map(col => col.header)],
        body: tableData,
        headStyles: {
          fillColor: PDF_CONFIG.headerColor,
          textColor: PDF_CONFIG.headerTextColor
        }
      });
    } else {
      doc.setFontSize(10);
      doc.text('Nenhum item com estoque baixo encontrado.', 14, 40);
    }

    // Página 3 - Movimentações Recentes
    doc.addPage();
    doc.setFontSize(16);
    doc.text('MOVIMENTAÇÕES RECENTES', 14, 20);
    
    if (dadosConsolidados.movimentacoesRecentes.length > 0) {
      const movColumns = [
        { header: 'Data', key: 'data' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Item', key: 'item' },
        { header: 'Quantidade', key: 'quantidade' },
        { header: 'Destinatário', key: 'destinatario' }
      ];
      
      const movData = dadosConsolidados.movimentacoesRecentes.map(mov => [
        formatDateTime(mov.data_movimentacao),
        mov.tipo,
        mov.item?.nome || 'N/A',
        mov.quantidade,
        mov.destinatario || 'N/A'
      ]);
      
      doc.autoTable({
        startY: 30,
        head: movColumns.map(col => col.header),
        body: movData,
        headStyles: {
          fillColor: PDF_CONFIG.headerColor,
          textColor: PDF_CONFIG.headerTextColor
        }
      });
    }

    // Salvar relatório consolidado
    doc.save(`relatorio-consolidado-${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar relatório consolidado:', error);
    throw new Error('Falha ao gerar relatório consolidado: ' + error.message);
  }
};

// ==================== EXPORTAÇÃO EM LOTE ====================

/**
 * Exporta múltiplos relatórios de uma vez
 */
export const exportBatch = async (exportConfigs) => {
  const results = [];
  
  for (const config of exportConfigs) {
    try {
      let result;
      
      switch (config.type) {
        case 'itens-pdf':
          result = await exportItensToPDF(config.data, config.filtros);
          break;
        case 'itens-excel':
          result = await exportItensToExcel(config.data, config.filtros);
          break;
        case 'movimentacoes-pdf':
          result = await exportMovimentacoesToPDF(config.data, config.filtros);
          break;
        case 'movimentacoes-excel':
          result = await exportMovimentacoesToExcel(config.data, config.filtros);
          break;
        case 'manutencoes-pdf':
          result = await exportManutencoesToPDF(config.data, config.filtros);
          break;
        case 'manutencoes-excel':
          result = await exportManutencoesToExcel(config.data, config.filtros);
          break;
        case 'consolidado':
          result = await exportRelatorioConsolidado(config.data);
          break;
        default:
          throw new Error(`Tipo de exportação não suportado: ${config.type}`);
      }
      
      results.push({
        type: config.type,
        success: true,
        filename: config.filename
      });
      
    } catch (error) {
      results.push({
        type: config.type,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// ==================== UTILITÁRIOS DE RELATÓRIO ====================

/**
 * Gera estatísticas para relatórios
 */
export const generateReportStats = (data, type) => {
  const stats = {
    total: data.length,
    dates: {
      min: null,
      max: null
    }
  };

  switch (type) {
    case 'itens':
      stats.totalValue = data.reduce((sum, item) => sum + (item.valor || 0) * (item.quantidade || 0), 0);
      stats.lowStock = data.filter(item => item.quantidade <= item.quantidade_minima).length;
      stats.categories = [...new Set(data.map(item => item.categoria?.nome).filter(Boolean))];
      break;
      
    case 'movimentacoes':
      stats.byType = data.reduce((acc, mov) => {
        acc[mov.tipo] = (acc[mov.tipo] || 0) + 1;
        return acc;
      }, {});
      stats.totalQuantity = data.reduce((sum, mov) => sum + (mov.quantidade || 0), 0);
      break;
      
    case 'manutencoes':
      stats.byStatus = data.reduce((acc, manut) => {
        acc[manut.status] = (acc[manut.status] || 0) + 1;
        return acc;
      }, {});
      stats.totalCost = data.reduce((sum, manut) => sum + (manut.custo || 0), 0);
      break;
  }

  return stats;
};

export default {
  // PDF Exports
  exportToPDF,
  exportItensToPDF,
  exportMovimentacoesToPDF,
  exportManutencoesToPDF,
  
  // Excel Exports
  exportToExcel,
  exportItensToExcel,
  exportMovimentacoesToExcel,
  exportManutencoesToExcel,
  
  // Consolidated Reports
  exportRelatorioConsolidado,
  exportBatch,
  
  // Utilities
  generateReportStats,
  formatCurrency,
  formatDate,
  formatDateTime
};