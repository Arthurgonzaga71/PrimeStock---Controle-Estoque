import api from './api';

class BackupService {
  // ✅ CRIAR BACKUP COMPLETO (ROTA CORRETA)
  async createBackupCompleto(usuarioId = null) {
    try {
      const response = await api.post('/backup/create', { 
        usuarioId, 
        tipo: 'completo' 
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar backup completo:', error);
      throw error;
    }
  }

  // ✅ CRIAR BACKUP INCREMENTAL
  async createBackupIncremental(usuarioId, dias = 7) {
    try {
      const response = await api.post('/backup/create', { 
        usuarioId, 
        tipo: 'incremental',
        dias 
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar backup incremental:', error);
      throw error;
    }
  }

  // ✅ LISTAR BACKUPS (ROTA CORRETA)
  async listBackups() {
    try {
      const response = await api.get('/backup');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error);
      throw error;
    }
  }

  // ✅ RESTAURAR BACKUP (SE IMPLEMENTAR)
  async restoreBackup(backupName) {
    try {
      const response = await api.post('/backup/restore', { backupName });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      throw error;
    }
  }

  // ✅ EXPORTAR PARA CSV (SE IMPLEMENTAR)
  async exportToCSV() {
    try {
      const response = await api.post('/backup/export-csv');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao exportar CSV:', error);
      throw error;
    }
  }

  // ✅ DOWNLOAD BACKUP (ROTA CORRETA)
  async downloadBackup(backupName) {
    try {
      const response = await api.get(`/backup/download/${backupName}`, {
        responseType: 'blob'
      });
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backupName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao fazer download:', error);
      throw error;
    }
  }

  // ✅ DELETAR BACKUP (ROTA CORRETA)
  async deleteBackup(backupName) {
    try {
      const response = await api.delete(`/backup/${backupName}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao deletar backup:', error);
      throw error;
    }
  }

  // ✅ INFORMAÇÕES DO BACKUP
  async getBackupInfo(backupName) {
    try {
      const response = await api.get(`/backup/info/${backupName}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar informações:', error);
      throw error;
    }
  }

  // ✅ HEALTH CHECK DO BACKUP
  async checkBackupHealth() {
    try {
      const response = await api.get('/backup/health');
      return response.data;
    } catch (error) {
      console.error('❌ Erro no health check:', error);
      throw error;
    }
  }

  // ✅ TESTE DE CONEXÃO
  async testBackupConnection() {
    try {
      const response = await api.get('/backup/test');
      return response.data;
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      throw error;
    }
  }
}

export default new BackupService();