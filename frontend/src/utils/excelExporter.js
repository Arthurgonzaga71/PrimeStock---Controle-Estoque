// 📁 frontend/src/utils/excelExporter.js
// Versão simplificada - sem dependências externas
export const excelExporter = {
  exportarItensExcel: (itens) => {
    console.log('📊 Exportando Excel de itens:', itens);
    return true;
  },

  exportarMovimentacoesExcel: (movimentacoes) => {
    console.log('📊 Exportando Excel de movimentações:', movimentacoes);
    return true;
  }
};