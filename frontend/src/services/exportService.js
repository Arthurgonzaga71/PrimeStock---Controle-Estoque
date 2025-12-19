import api from './api';

class ExportService {
  
  // 📄 GERAR RELATÓRIO PDF
  async generatePDF(tipo, filtros = {}) {
    try {
      console.log(`📄 Gerando PDF para: ${tipo}`, filtros);
      
      const response = await api.post('/export/pdf', {
        tipo,
        filtros
      }, {
        timeout: 30000 // 30 segundos para PDF
      });
      
      const result = response.data;
      
      // ✅ CORREÇÃO: Verificação mais robusta do resultado
      if (result.success) {
        if (result.downloadUrl) {
          // Se já tem URL pronta, usar ela
          window.open(result.downloadUrl, '_blank');
        } else if (result.filename) {
          // Construir URL corretamente
          const downloadUrl = `http://localhost:3001/exports/${result.filename}`;
          console.log(`📥 Iniciando download: ${downloadUrl}`);
          window.open(downloadUrl, '_blank');
        } else if (result.filePath) {
          // Outra possível chave para o caminho
          const downloadUrl = `http://localhost:3001${result.filePath}`;
          window.open(downloadUrl, '_blank');
        }
        
        // Feedback visual
        console.log('✅ PDF gerado com sucesso!');
      } else {
        throw new Error(result.message || 'Erro desconhecido ao gerar PDF');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao gerar PDF');
    }
  }

  // 📊 GERAR RELATÓRIO EXCEL COM MÚLTIPLAS ABAS
  async generateExcel(tipo = 'completo', filtros = {}) {
    try {
      console.log(`📊 Gerando Excel para: ${tipo}`, filtros);
      
      const response = await api.post('/export/excel', {
        tipo,
        filtros
      }, {
        timeout: 45000 // 45 segundos para Excel
      });
      
      const result = response.data;
      
      // ✅ CORREÇÃO: Download automático melhorado
      if (result.success) {
        let downloadUrl;
        
        if (result.downloadUrl) {
          downloadUrl = result.downloadUrl;
        } else if (result.filename) {
          downloadUrl = `http://localhost:3001/exports/${result.filename}`;
        } else if (result.filePath) {
          downloadUrl = `http://localhost:3001${result.filePath}`;
        }
        
        if (downloadUrl) {
          console.log(`📥 Iniciando download Excel: ${downloadUrl}`);
          
          // Abrir em nova aba
          const newWindow = window.open(downloadUrl, '_blank');
          if (!newWindow) {
            console.warn('⚠️ Pop-up bloqueado. Tentando download direto...');
            // Fallback: criar link de download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = result.filename || `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else {
          console.warn('⚠️ Nenhuma URL de download disponível', result);
        }
        
        console.log('✅ Excel gerado com sucesso!');
      } else {
        throw new Error(result.message || 'Erro desconhecido ao gerar Excel');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao gerar Excel');
    }
  }

  // 📋 EXPORTAÇÃO PARA CSV
  async generateCSV(tipo, filtros = {}) {
    try {
      console.log(`📋 Gerando CSV para: ${tipo}`, filtros);
      
      const response = await api.post('/export/csv', {
        tipo,
        filtros
      }, {
        timeout: 30000
      });
      
      const result = response.data;
      
      if (result.success && result.filename) {
        const downloadUrl = `http://localhost:3001/exports/${result.filename}`;
        console.log(`📥 Iniciando download CSV: ${downloadUrl}`);
        window.open(downloadUrl, '_blank');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao gerar CSV:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao gerar CSV');
    }
  }

  // 🗃️ EXPORTAÇÃO COMPLETA (TODAS AS TABELAS)
  async exportCompleto(filtros = {}) {
    try {
      console.log('🏗️ Iniciando exportação completa do sistema...');
      
      const response = await api.post('/export/completo', {
        filtros,
        formatos: ['excel', 'csv'] // Pode solicitar múltiplos formatos
      }, {
        timeout: 60000 // 1 minuto para export completa
      });
      
      const result = response.data;
      
      // ✅ CORREÇÃO: Processar múltiplos arquivos
      if (result.success && result.arquivos) {
        result.arquivos.forEach(arquivo => {
          if (arquivo.url || arquivo.filename) {
            const downloadUrl = arquivo.url || `http://localhost:3001/exports/${arquivo.filename}`;
            console.log(`📥 Download disponível: ${downloadUrl}`);
            
            // Abrir cada arquivo em nova aba
            setTimeout(() => {
              window.open(downloadUrl, '_blank');
            }, 1000); // Delay para evitar bloqueio de pop-ups
          }
        });
        
        console.log(`✅ Exportação completa concluída! ${result.arquivos.length} arquivos gerados.`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro na exportação completa:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro na exportação completa');
    }
  }

  // 📊 OBTER DADOS PARA EXPORTAÇÃO
  async getExportData(tipo, filtros = {}) {
    try {
      console.log(`📋 Buscando dados para exportação: ${tipo}`, filtros);
      
      const response = await api.get(`/export/data/${tipo}`, { 
        params: filtros,
        timeout: 15000
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter dados para exportação:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao buscar dados');
    }
  }

  // 📥 BAIXAR ARQUIVO DIRETO
  async downloadFile(filename) {
    try {
      const downloadUrl = `http://localhost:3001/exports/${filename}`;
      console.log(`📥 Download direto: ${downloadUrl}`);
      
      window.open(downloadUrl, '_blank');
      return { 
        success: true, 
        filename,
        message: 'Download iniciado'
      };
    } catch (error) {
      console.error('❌ Erro ao fazer download:', error);
      throw new Error('Erro ao iniciar download');
    }
  }

  // 🗑️ LIMPAR ARQUIVOS TEMPORÁRIOS
  async limparArquivosTemporarios() {
    try {
      const response = await api.delete('/export/limpar');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao limpar arquivos:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao limpar arquivos');
    }
  }

  // 📈 OBTER ESTATÍSTICAS DE EXPORTAÇÃO
  async getEstatisticasExportacao() {
    try {
      const response = await api.get('/export/estatisticas');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao buscar estatísticas');
    }
  }

  // 🧪 TESTAR CONEXÃO COM API
  async testConnection() {
    try {
      const response = await api.get('/export/health', {
        timeout: 5000
      });
      
      console.log('✅ Conexão com API de exportação: OK');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      throw new Error('Serviço de exportação indisponível');
    }
  }

  // 🔄 VERIFICAR STATUS DA EXPORTAÇÃO
  async checkExportStatus(jobId) {
    try {
      const response = await api.get(`/export/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Erro ao verificar status');
    }
  }
}

export default new ExportService();