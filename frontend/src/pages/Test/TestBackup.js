// 📁 frontend/src/pages/Test/TestBackup.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TestBackup = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/backup');
      
      if (response.data.success) {
        setBackups(response.data.data);
        setMessage(`📋 ${response.data.total} backups encontrados`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar backups:', error);
      setMessage('Erro ao carregar backups: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const createBackup = async () => {
    try {
      setCreating(true);
      setMessage('');
      
      const response = await api.post('/backup/create');
      
      if (response.data.success) {
        setMessage('✅ Backup criado com sucesso!');
        console.log('📦 Backup criado:', response.data.data);
        loadBackups(); // Recarregar lista
      }
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
      setMessage('Erro ao criar backup: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteBackup = async (backupName) => {
    if (!window.confirm(`Tem certeza que deseja deletar o backup "${backupName}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/backup/${backupName}`);
      
      if (response.data.success) {
        setMessage('🗑️ Backup deletado com sucesso!');
        loadBackups(); // Recarregar lista
      }
    } catch (error) {
      console.error('❌ Erro ao deletar backup:', error);
      setMessage('Erro ao deletar backup: ' + error.message);
    }
  };

  const downloadBackup = (backupName) => {
    // Abrir em nova aba para download
    window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/backup/download/${backupName}`);
  };

  const getBackupInfo = async (backupName) => {
    try {
      const response = await api.get(`/backup/info/${backupName}`);
      
      if (response.data.success) {
        console.log('📊 Informações do backup:', response.data.data);
        alert(`📊 Backup: ${backupName}\nRegistros: ${JSON.stringify(response.data.data.metadata?.totalRegistros, null, 2)}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar informações:', error);
      alert('Erro ao buscar informações do backup');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2c3e50', textAlign: 'center' }}>
        💾 TESTE DO SISTEMA DE BACKUP
      </h1>

      {/* Ações Principais */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Criar Backup */}
        <div style={{ 
          border: '3px solid #3498db', 
          borderRadius: '15px', 
          padding: '25px',
          background: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2980b9' }}>🔄 Criar Backup</h3>
          <p>Crie um novo backup do sistema</p>
          <button 
            onClick={createBackup}
            disabled={creating}
            style={{
              padding: '12px 24px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: creating ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '15px',
              opacity: creating ? 0.6 : 1
            }}
          >
            {creating ? '⏳ Criando Backup...' : '💾 Criar Backup'}
          </button>
        </div>

        {/* Listar Backups */}
        <div style={{ 
          border: '3px solid #27ae60', 
          borderRadius: '15px', 
          padding: '25px',
          background: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#229954' }}>📋 Listar Backups</h3>
          <p>Atualize a lista de backups</p>
          <button 
            onClick={loadBackups}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '15px'
            }}
          >
            🔄 Atualizar Lista
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {message && (
        <div style={{ 
          padding: '15px', 
          background: message.includes('Erro') ? '#f8d7da' : '#d4edda',
          color: message.includes('Erro') ? '#721c24' : '#155724',
          borderRadius: '8px',
          marginBottom: '20px',
          border: `1px solid ${message.includes('Erro') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* Lista de Backups */}
      <div style={{ 
        border: '3px solid #f39c12', 
        borderRadius: '15px', 
        padding: '25px',
        background: 'white',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#d68910', marginBottom: '20px' }}>
          📁 Backups Disponíveis ({backups.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px' }}>⏳</div>
            <p>Carregando backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '48px' }}>💾</div>
            <p>Nenhum backup encontrado</p>
            <p>Crie seu primeiro backup clicando no botão acima!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {backups.map((backup, index) => (
              <div 
                key={index}
                style={{ 
                  border: '2px solid #e9ecef',
                  borderRadius: '10px',
                  padding: '20px',
                  background: '#f8f9fa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                      {backup.nome}
                    </h4>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      <span>📅 {formatDate(backup.dataCriacao)}</span>
                      <span style={{ marginLeft: '15px' }}>📊 {formatFileSize(backup.tamanho)}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => getBackupInfo(backup.nome)}
                      style={{
                        padding: '8px 16px',
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ℹ️ Info
                    </button>
                    
                    <button 
                      onClick={() => downloadBackup(backup.nome)}
                      style={{
                        padding: '8px 16px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📥 Download
                    </button>
                    
                    <button 
                      onClick={() => deleteBackup(backup.nome)}
                      style={{
                        padding: '8px 16px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🗑️ Deletar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações */}
      <div style={{ 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '10px',
        border: '2px dashed #bdc3c7'
      }}>
        <h3>📋 O QUE TESTAR:</h3>
        <ol>
          <li><strong>Criar Backup:</strong> Clique em "Criar Backup" e verifique o terminal do backend</li>
          <li><strong>Listar Backups:</strong> Os backups criados devem aparecer na lista</li>
          <li><strong>Download:</strong> Faça download de um backup para ver o arquivo JSON</li>
          <li><strong>Informações:</strong> Veja os detalhes do backup clicando em "Info"</li>
          <li><strong>Deletar:</strong> Remova um backup da lista (com confirmação)</li>
        </ol>

        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          background: '#fff3cd',
          borderRadius: '5px',
          color: '#856404'
        }}>
          <strong>💡 Verifique o terminal do backend</strong> para ver os logs em tempo real de cada operação!
        </div>
      </div>
    </div>
  );
};

export default TestBackup;