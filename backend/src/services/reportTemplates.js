import api from './api';

class ExportService {
  
  // 📄 GERAR RELATÓRIO PDF
  async generatePDF(tipo, filtros = {}) {
    try {
      const response = await api.post('/export/pdf', {
        tipo,
        filtros,
        formato: 'pdf'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw error;
    }
  }

  // 📊 GERAR RELATÓRIO EXCEL
  async generateExcel(tipo, filtros = {}) {
    try {
      const response = await api.post('/export/excel', {
        tipo,
        filtros,
        formato: 'excel'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      throw error;
    }
  }

  // 📋 OBTER DADOS PARA EXPORTAÇÃO
  async getExportData(tipo, filtros = {}) {
    try {
      let endpoint = '';
      switch (tipo) {
        case 'itens':
          endpoint = '/itens/export';
          break;
        case 'movimentacoes':
          endpoint = '/movimentacoes/export';
          break;
        case 'manutencoes':
          endpoint = '/manutencoes/export';
          break;
        default:
          throw new Error('Tipo de exportação não suportado');
      }

      const response = await api.get(endpoint, { params: filtros });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter dados para exportação:', error);
      throw error;
    }
  }

  // ⬇️ DOWNLOAD DE ARQUIVO
  async downloadFile(url, filename) {
    try {
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      // Criar link para download
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true, filename };
    } catch (error) {
      console.error('❌ Erro ao fazer download:', error);
      throw error;
    }
  }
}

export default new ExportService();