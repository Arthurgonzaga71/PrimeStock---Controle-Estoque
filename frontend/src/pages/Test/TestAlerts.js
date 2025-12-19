// 📁 frontend/src/pages/Test/TestAlerts.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TestAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      
      const [alertsResponse, statsResponse] = await Promise.all([
        api.get('/alerts'),
        api.get('/alerts/stats')
      ]);

      if (alertsResponse.data.success) {
        setAlerts(alertsResponse.data.data);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      console.log('🔔 Alertas carregados:', alertsResponse.data.data);
      console.log('📊 Estatísticas:', statsResponse.data.data);

    } catch (error) {
      console.error('❌ Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    let interval;
    
    if (autoRefresh) {
      interval = setInterval(loadAlerts, 5000); // Atualizar a cada 5 segundos
      console.log('🔄 Atualização automática ativada');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        console.log('⏹️ Atualização automática desativada');
      }
    };
  }, [autoRefresh]);

  const dismissAlert = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/dismiss`);
      
      // Remover alerta da lista localmente
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      console.log(`✅ Alerta ${alertId} resolvido`);
    } catch (error) {
      console.error('❌ Erro ao resolver alerta:', error);
    }
  };

  const checkNewAlerts = async () => {
    try {
      const response = await api.post('/alerts/check');
      
      if (response.data.success) {
        if (response.data.hasNewAlerts) {
          alert('🎉 Novos alertas encontrados! Recarregando...');
          loadAlerts();
        } else {
          alert('✅ Nenhum novo alerta encontrado.');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar alertas:', error);
    }
  };

  const getAlertIcon = (type) => {
    const icons = {
      estoque_baixo: '⚠️',
      manutencao_atrasada: '🔧', 
      devolucao_atrasada: '📅',
      item_sem_movimentacao: '📊'
    };
    return icons[type] || '🔔';
  };

  const getAlertColor = (priority) => {
    const colors = {
      high: '#e74c3c',
      medium: '#f39c12',
      low: '#3498db'
    };
    return colors[priority] || '#95a5a6';
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours} h atrás`;
    return `${diffDays} dias atrás`;
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2c3e50', textAlign: 'center' }}>
        🔔 TESTE DO SISTEMA DE ALERTAS
      </h1>

      {/* Estatísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.critical || 0}</div>
          <div>Críticos</div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #f39c12, #e67e22)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔧</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.warning || 0}</div>
          <div>Atenção</div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #3498db, #2980b9)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.info || 0}</div>
          <div>Informações</div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #27ae60, #229954)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total || 0}</div>
          <div>Total</div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <button 
          onClick={loadAlerts}
          disabled={loading}
          style={{
            padding: '15px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '⏳ Carregando...' : '🔄 Atualizar Alertas'}
        </button>

        <button 
          onClick={checkNewAlerts}
          style={{
            padding: '15px',
            background: '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔍 Verificar Novos Alertas
        </button>

        <button 
          onClick={() => setAutoRefresh(!autoRefresh)}
          style={{
            padding: '15px',
            background: autoRefresh ? '#e74c3c' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {autoRefresh ? '⏹️ Parar Auto-Refresh' : '🔄 Ligar Auto-Refresh'}
        </button>
      </div>

      {/* Lista de Alertas */}
      <div style={{ 
        background: 'white',
        borderRadius: '15px',
        padding: '25px',
        border: '3px solid #f39c12'
      }}>
        <h3 style={{ color: '#d68910', marginBottom: '20px' }}>
          📋 Alertas Ativos ({alerts.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px' }}>⏳</div>
            <p>Carregando alertas...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '48px' }}>✅</div>
            <p>Nenhum alerta ativo no momento</p>
            <p>Tudo sob controle! 🎉</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {alerts.map(alert => (
              <div 
                key={alert.id}
                style={{ 
                  border: `3px solid ${getAlertColor(alert.prioridade)}`,
                  borderRadius: '10px',
                  padding: '20px',
                  background: '#f8f9fa',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{ fontSize: '2rem' }}>
                    {getAlertIcon(alert.tipo)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                      {alert.titulo}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', color: '#5d6d7e' }}>
                      {alert.mensagem}
                    </p>
                    <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                      <span>🕒 {getTimeAgo(alert.createdAt)}</span>
                      {alert.item_nome && (
                        <span style={{ marginLeft: '15px' }}>📦 {alert.item_nome}</span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => dismissAlert(alert.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✅ Resolver
                  </button>
                </div>
                
                {/* Indicador de prioridade */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    background: getAlertColor(alert.prioridade),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {alert.prioridade === 'high' ? 'CRÍTICO' : 
                   alert.prioridade === 'medium' ? 'ATENÇÃO' : 'INFORMAÇÃO'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '10px',
        border: '2px dashed #bdc3c7'
      }}>
        <h3>📋 O QUE TESTAR:</h3>
        <ol>
          <li><strong>Carregar Alertas:</strong> Veja os alertas de exemplo carregados</li>
          <li><strong>Estatísticas:</strong> Observe os números no topo da página</li>
          <li><strong>Resolver Alertas:</strong> Clique em "Resolver" para remover alertas</li>
          <li><strong>Auto-Refresh:</strong> Ative a atualização automática a cada 5 segundos</li>
          <li><strong>Verificar Novos:</strong> Use o botão para simular busca por novos alertas</li>
        </ol>

        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          background: '#fff3cd',
          borderRadius: '5px',
          color: '#856404'
        }}>
          <strong>💡 Verifique o terminal do backend</strong> para ver os logs em tempo real!
        </div>
      </div>
    </div>
  );
};

export default TestAlerts;