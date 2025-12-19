// 📁 frontend/src/services/api.js - VERSÃO COMPLETAMENTE CORRIGIDA E FUNCIONAL
import axios from 'axios';

// ⚡ URL fixa do backend
const API_BASE_URL = "http://192.168.205.141:3000/api";

console.log('🎯 [API] Inicializando conexão com:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 🎯 INTERCEPTOR DE REQUISIÇÃO
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('userToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// 🎯 INTERCEPTOR DE RESPOSTA
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || 'URL desconhecida';
    
    console.error(`❌ [API] Erro ${status || 'NO_RESPONSE'} em ${url}`);
    
    if (status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    return Promise.reject(error);
  }
);

// 👤 AUTENTICAÇÃO
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  alterarSenha: (data) => api.put('/auth/alterar-senha', data),
  logout: () => api.post('/auth/logout')
};

// 🗂️ CATEGORIAS
export const categoriasService = {
  getAll: (params = {}) => api.get('/categorias', { params }),
  getById: (id) => api.get(`/categorias/${id}`),
  create: (data) => api.post('/categorias', data),
  update: (id, data) => api.put(`/categorias/${id}`, data),
  delete: (id) => api.delete(`/categorias/${id}`),
};

// 📦 ITENS
export const itensService = {
  getAll: (params = {}) => api.get('/itens', { params }),
  getById: (id) => api.get(`/itens/${id}`),
  create: (data) => api.post('/itens', data),
  update: (id, data) => api.put(`/itens/${id}`, data),
  delete: (id) => api.delete(`/itens/${id}`),
  getEstoqueBaixo: () => api.get('/itens/alerta/estoque-baixo'),
  getDisponiveis: () => api.get('/itens/disponiveis'),
  getPorCategoria: (categoriaId) => api.get(`/itens/categoria/${categoriaId}`),
  getEstatisticas: () => api.get('/itens/estatisticas'),
};

// 🔄 MOVIMENTAÇÕES
export const movimentacoesService = {
  getAll: (params = {}) => api.get('/movimentacoes', { params }),
  getById: (id) => api.get(`/movimentacoes/${id}`),
  create: (data) => api.post('/movimentacoes', data),
  createSaida: (data) => api.post('/movimentacoes/saida', data),
  
  // ✅ ADICIONE ESTE MÉTODO - é o que seu componente está tentando chamar
  registrarSaida: (data) => api.post('/movimentacoes/saida', data),
  
  update: (id, data) => api.put(`/movimentacoes/${id}`, data),
  delete: (id) => api.delete(`/movimentacoes/${id}`),
  
  // Métodos de devolução
  registrarDevolucao: (id, data = {}) => api.post(`/movimentacoes/devolucao/${id}`, data),
  devolver: (id, data = {}) => api.post(`/movimentacoes/devolucao/${id}`, data),
  devolverItemDireto: (itemId, data = {}) => api.post(`/movimentacoes/devolucao-item/${itemId}`, data),
  
  getRecentes: () => api.get('/movimentacoes/dashboard/recentes'),
  getEstatisticas: () => api.get('/movimentacoes/dashboard/estatisticas'),
  
  // ✅ ADICIONE ESTES MÉTODOS ADICIONAIS PARA COMPATIBILIDADE
  getSaidas: (params = {}) => api.get('/movimentacoes/tipo/saida', { params }),
  getEntradas: (params = {}) => api.get('/movimentacoes/tipo/entrada', { params }),
  
  // Método alternativo se precisar de mais controle
  registrarSaidaCompleta: (itemId, usuarioId, quantidade, motivo, observacoes) => 
    api.post('/movimentacoes/saida', {
      itemId,
      usuarioId,
      quantidade,
      motivo,
      observacoes,
      tipo: 'saida'
    })
}

// 🛠️ MANUTENÇÕES
export const manutencoesService = {
  getAll: (params = {}) => api.get('/manutencoes', { params }),
  getById: (id) => api.get(`/manutencoes/${id}`),
  create: (data) => api.post('/manutencoes', data),
  update: (id, data) => api.put(`/manutencoes/${id}`, data),
  delete: (id) => api.delete(`/manutencoes/${id}`),
  getAbertas: () => api.get('/manutencoes/abertas'),
  getRecentes: () => api.get('/manutencoes/recentes'),
  getEstatisticas: () => api.get('/manutencoes/estatisticas'),
};

// 👤 USUÁRIOS
export const usuariosService = {
  getAll: (params = {}) => api.get('/usuarios', { params }),
  getById: (id) => api.get(`/usuarios/${id}`),
  getMe: () => api.get('/usuarios/me'),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`),
  getEquipe: () => api.get('/usuarios/equipe'),
  getDisponiveis: () => api.get('/usuarios/disponiveis'),
  getEstatisticas: () => api.get('/usuarios/estatisticas'),
};

// 📋 SOLICITAÇÕES
export const solicitacoesService = {
  create: (data) => api.post('/solicitacoes', data),
  getAll: (params = {}) => api.get('/solicitacoes', { params }),
  getById: (id) => api.get(`/solicitacoes/${id}`),
  getMinhas: (params = {}) => api.get('/solicitacoes/minhas', { params }),
  getPendentes: (params = {}) => api.get('/solicitacoes/pendentes', { params }),
  enviarParaAprovacao: (id) => api.put(`/solicitacoes/${id}/enviar`),
  aprovar: (id, data = {}) => api.put(`/solicitacoes/${id}/aprovar`, data),
  rejeitar: (id, data = {}) => api.put(`/solicitacoes/${id}/rejeitar`, data),
  cancelar: (id, motivo = '') => api.delete(`/solicitacoes/${id}`, { data: { motivo } }),
  getItens: (solicitacaoId) => api.get(`/solicitacoes/${solicitacaoId}/itens`),
  getHistorico: (solicitacaoId) => api.get(`/solicitacoes/${solicitacaoId}/historico`),
  getEstatisticas: (params = {}) => api.get('/solicitacoes/estatisticas', { params }),
  testConnection: () => api.get('/solicitacoes/test')
};

// 📊 DASHBOARD
export const dashboardService = {
  getDashboard: () => api.get('/dashboard'),
  getEstatisticas: () => api.get('/dashboard/estatisticas'),
  getAlertas: () => api.get('/dashboard/alertas'),
  getAtividades: () => api.get('/dashboard/atividades'),
  getRelatorioManutencoes: (params = {}) => api.get('/dashboard/relatorios/manutencoes', { params }),
  getRelatorioSolicitacoes: (params = {}) => api.get('/dashboard/relatorios/solicitacoes', { params }),
  getRelatorioEstoque: (params = {}) => api.get('/dashboard/relatorios/itens', { params }),
  getRelatorioMovimentacoes: (params = {}) => api.get('/dashboard/relatorios/movimentacoes', { params }),
  exportRelatorioManutencoes: (params = {}) => api.get('/dashboard/export/relatorio-manutencoes', { 
    params,
    responseType: 'blob'
  })
};

// 🔔 ALERTAS
export const alertasService = {
  getAll: () => api.get('/alertas'),
  marcarComoLido: (id) => api.put(`/alertas/${id}/ler`),
  getNaoLidos: () => api.get('/alertas/nao-lidos'),
  getConfiguracoes: () => api.get('/alertas/configuracoes'),
  atualizarConfiguracoes: (data) => api.put('/alertas/configuracoes', data),
};

// 📱 QR CODE
export const qrCodeService = {
  getItemForQR: (itemId) => api.get(`/qrcode/item/${itemId}`),
  generateQRCode: (data) => api.post('/qrcode/generate', data),
};

// 🗃️ BACKUP - VERSÃO COMPLETAMENTE CORRIGIDA
export const backupService = {
  // 📋 LISTAR BACKUPS
  getBackups: () => api.get('/backup'),
  
  // 🆕 CRIAR BACKUP
  createBackup: () => api.post('/backup/create'),
  
  // 🔄 RESTAURAR BACKUP
  restoreBackup: (filename) => api.post(`/backup/restore/${filename}`),
  
  // ⬇️ DOWNLOAD BACKUP - VERSÃO CORRIGIDA E FUNCIONAL
  downloadBackup: async (filename) => {
    try {
      console.log(`⬇️ [API] Download do backup: ${filename}`);
      
      const response = await api.get(`/backup/download/${filename}`, {
        responseType: 'blob',
        timeout: 60000, // 60 segundos
      });
      
      // Detecta tipo do arquivo
      const contentType = response.headers['content-type'];
      let fileExtension = 'backup';
      
      // Mapeamento de tipos MIME para extensões
      const mimeToExt = {
        'application/zip': 'zip',
        'application/x-zip-compressed': 'zip',
        'application/x-gzip': 'gz',
        'application/x-tar': 'tar',
        'application/sql': 'sql',
        'application/octet-stream': 'dump',
        'application/json': 'json',
        'text/plain': 'txt',
        'text/csv': 'csv'
      };
      
      if (contentType && mimeToExt[contentType]) {
        fileExtension = mimeToExt[contentType];
      }
      
      // Cria nome do arquivo com extensão correta
      let finalFilename = filename;
      if (!filename.includes('.')) {
        finalFilename = `${filename}.${fileExtension}`;
      }
      
      // Cria e baixa o arquivo
      const blob = new Blob([response.data], { 
        type: contentType || 'application/octet-stream' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Limpeza
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`✅ Download realizado: ${finalFilename}`);
      
      return {
        success: true,
        filename: finalFilename,
        size: response.data.size
      };
      
    } catch (error) {
      console.error('❌ Erro no download do backup:', error);
      throw error;
    }
  },
  
  // 🗑️ DELETAR BACKUP
  deleteBackup: (filename) => api.delete(`/backup/${filename}`),
  
  // ℹ️ INFORMAÇÕES DO BACKUP
  getBackupInfo: (filename) => api.get(`/backup/info/${filename}`),
  
  // 🏥 HEALTH CHECK
  checkBackupHealth: () => api.get('/backup/health'),
  
  // 🧪 TESTE
  testBackup: () => api.get('/backup/test')
};

// 📤 EXPORTAÇÃO
export const exportService = {
  // EXPORTAR PARA EXCEL
  exportItens: (params = {}) => api.post('/export/excel', { tipo: 'itens', filtros: params }),
  exportManutencoes: (params = {}) => api.post('/export/excel', { tipo: 'manutencoes', filtros: params }),
  exportMovimentacoes: (params = {}) => api.post('/export/excel', { tipo: 'movimentacoes', filtros: params }),
  exportSolicitacoes: (params = {}) => api.post('/export/excel', { tipo: 'solicitacoes', filtros: params }),
  
  // EXPORTAR PARA PDF
  exportToPDF: (params = {}) => api.post('/export/pdf', { 
    tipo: params.type || 'manutencoes', 
    filtros: params 
  }),
  
  // EXPORTAR PARA CSV
  exportToCSV: (params = {}) => api.post('/export/csv', { 
    tipo: params.type || 'manutencoes', 
    filtros: params 
  }),
  
  // EXPORTAÇÃO GENÉRICA
  exportToExcel: (params = {}) => api.post('/export/excel', { 
    tipo: params.type || 'manutencoes', 
    filtros: params 
  }),
  
  // EXPORTAR DASHBOARD
  exportDashboard: (params = {}) => api.post('/export/excel', { 
    tipo: 'dashboard', 
    filtros: params 
  })
};

// 🧪 TESTE
export const testService = {
  testConnection: () => api.get('/test'),
  testEmail: () => api.post('/test/email'),
  testDatabase: () => api.get('/test/database'),
};

// 🏥 HEALTH CHECK
export const healthService = {
  check: () => api.get('/health'),
  checkDatabase: () => api.get('/api/health/database'),
  checkEmail: () => api.get('/api/health/email'),
};

// 🎯 EXPORTAÇÃO PRINCIPAL
export default api;

// 🎯 FUNÇÕES AUXILIARES
export const testApiConnection = async () => {
  try {
    const response = await api.get('/test');
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export const checkAuth = () => {
  const token = localStorage.getItem('authToken') || 
                localStorage.getItem('token') || 
                localStorage.getItem('userToken');
  return !!token;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || 
                localStorage.getItem('token') || 
                localStorage.getItem('userToken');
  
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 🎯 FUNÇÃO PARA DOWNLOAD DE BLOB
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// 🎯 FUNÇÃO AUXILIAR PARA FORMATAR BYTES
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 🎯 FUNÇÃO PARA PRÉ-VISUALIZAR BACKUP
export const previewBackup = async (filename) => {
  try {
    const response = await api.get(`/backup/preview/${filename}`, {
      headers: { 'Range': 'bytes=0-1023' },
      responseType: 'arraybuffer'
    });
    
    const buffer = new Uint8Array(response.data);
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(buffer);
    
    const isText = !text.includes('�') && text.length > 0;
    
    if (isText) {
      return {
        success: true,
        isTextFile: true,
        preview: text.substring(0, 500) + (text.length > 500 ? '...' : '')
      };
    } else {
      return {
        success: true,
        isTextFile: false,
        message: 'Arquivo binário detectado'
      };
    }
    
  } catch (error) {
    console.error('❌ Erro ao pré-visualizar backup:', error);
    return {
      success: false,
      error: 'Não foi possível pré-visualizar o arquivo'
    };
  }
};

// 🎯 FUNÇÃO PARA DOWNLOAD SIMPLES (FALLBACK)
export const downloadBackupSimple = async (filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/backup/download/${filename}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    
    let fileExtension = 'zip';
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('zip')) {
      fileExtension = 'zip';
    } else if (contentType && contentType.includes('gzip')) {
      fileExtension = 'gz';
    }
    
    const finalFilename = filename.includes('.') 
      ? filename 
      : `${filename}.${fileExtension}`;
    
    downloadBlob(blob, finalFilename);
    
    return {
      success: true,
      filename: finalFilename,
      size: blob.size
    };
    
  } catch (error) {
    console.error('❌ Erro no download simples:', error);
    throw error;
  }
};

// 🎯 FUNÇÃO PARA EXPORTAÇÃO SIMPLES
export const simpleExport = async (tipo = 'manutencoes', filtros = {}) => {
  try {
    const response = await exportService.exportToExcel({
      tipo,
      ...filtros
    });
    
    if (response.data instanceof Blob) {
      const filename = `export_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadBlob(response.data, filename);
      return { success: true, filename };
    }
    
    if (response.data.success) {
      return { success: true, data: response.data };
    }
    
    return { success: false, error: 'Formato de resposta desconhecido' };
    
  } catch (error) {
    console.error('❌ Erro na exportação:', error);
    return { 
      success: false, 
      error: error.message
    };
  }
};