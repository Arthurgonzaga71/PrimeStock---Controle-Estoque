// 📁 frontend/src/components/Alerts/AlertSystem.js
import React, { useState, useEffect } from 'react';
import { alertService, dashboardService } from '../../services/api';
import './AlertSystem.css';

const AlertSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const [alertsResponse, statsResponse] = await Promise.all([
        alertService.getActiveAlerts(),
        dashboardService.getAlertStats()
      ]);

      if (alertsResponse.data.success) {
        setAlerts(alertsResponse.data.data);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // Atualizar a cada minuto
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = async (alertId) => {
    try {
      await alertService.dismissAlert(alertId);
      loadAlerts();
    } catch (error) {
      console.error('Erro ao descartar alerta:', error);
    }
  };

  const getAlertIcon = (type) => {
    const icons = {
      estoque_baixo: '⚠️',
      manutencao_atrasada: '🔧',
      devolucao_atrasada: '📅',
      item_sem_movimentacao: '📊',
      valor_alto: '💰'
    };
    return icons[type] || '🔔';
  };

  const getAlertPriority = (type) => {
    const priorities = {
      estoque_baixo: 'high',
      manutencao_atrasada: 'medium',
      devolucao_atrasada: 'high',
      item_sem_movimentacao: 'low',
      valor_alto: 'medium'
    };
    return priorities[type] || 'low';
  };

  const getActionButton = (alert) => {
    switch (alert.tipo) {
      case 'estoque_baixo':
        return (
          <button 
            className="btn-action"
            onClick={() => window.location.href = `/itens/${alert.item_id}/editar`}
          >
            📝 Ajustar Estoque
          </button>
        );
      case 'devolucao_atrasada':
        return (
          <button 
            className="btn-action"
            onClick={() => window.location.href = `/movimentacoes/devolucao/${alert.movimentacao_id}`}
          >
            🔄 Registrar Devolução
          </button>
        );
      case 'manutencao_atrasada':
        return (
          <button 
            className="btn-action"
            onClick={() => window.location.href = `/manutencoes/${alert.manutencao_id}/editar`}
          >
            🔧 Atualizar Manutenção
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="alert-system">
      <div className="alert-header">
        <h2>🔔 Alertas Inteligentes</h2>
        <div className="alert-stats">
          <div className="stat-item critical">
            <span className="stat-number">{stats.critical || 0}</span>
            <span className="stat-label">Críticos</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-number">{stats.warning || 0}</span>
            <span className="stat-label">Atenção</span>
          </div>
          <div className="stat-item info">
            <span className="stat-number">{stats.info || 0}</span>
            <span className="stat-label">Informações</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-alerts">
          <div className="loading-spinner"></div>
          <p>Carregando alertas...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="no-alerts">
          <div className="no-alerts-icon">✅</div>
          <h3>Tudo sob controle!</h3>
          <p>Nenhum alerta crítico no momento.</p>
        </div>
      ) : (
        <div className="alerts-grid">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`alert-card ${getAlertPriority(alert.tipo)}`}
            >
              <div className="alert-icon">
                {getAlertIcon(alert.tipo)}
              </div>
              
              <div className="alert-content">
                <div className="alert-title">
                  {alert.titulo}
                </div>
                <div className="alert-message">
                  {alert.mensagem}
                </div>
                <div className="alert-meta">
                  <span className="alert-time">
                    {new Date(alert.createdAt).toLocaleString('pt-BR')}
                  </span>
                  {alert.item_nome && (
                    <span className="alert-item">
                      Item: {alert.item_nome}
                    </span>
                  )}
                </div>
              </div>

              <div className="alert-actions">
                {getActionButton(alert)}
                <button 
                  className="btn-dismiss"
                  onClick={() => dismissAlert(alert.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prevenção de Problemas */}
      <div className="prevention-section">
        <h3>🛡️ Prevenção de Problemas</h3>
        <div className="prevention-tips">
          <div className="tip-card">
            <h4>📊 Monitor de Estoque</h4>
            <ul>
              <li>Configure quantidades mínimas</li>
              <li>Revise estoque semanalmente</li>
              <li>Antecipe reposições</li>
            </ul>
          </div>
          
          <div className="tip-card">
            <h4>🔧 Gestão de Manutenções</h4>
            <ul>
              <li>Agende manutenções preventivas</li>
              <li>Acompanhe prazos</li>
              <li>Registre custos</li>
            </ul>
          </div>
          
          <div className="tip-card">
            <h4>📅 Controle de Devoluções</h4>
            <ul>
              <li>Defina prazos realistas</li>
              <li>Envie lembretes</li>
              <li>Registre atrasos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;