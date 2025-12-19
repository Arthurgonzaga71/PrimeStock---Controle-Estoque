// 📁 frontend/src/components/Notifications/NotificationCenter.js
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/api';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.filter(n => !n.lida).length);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      estoque_baixo: '⚠️',
      manutencao: '🔧',
      devolucao: '📅',
      sistema: '🔔',
      info: 'ℹ️'
    };
    return icons[type] || '🔔';
  };

  const getNotificationClass = (type) => {
    const classes = {
      estoque_baixo: 'warning',
      manutencao: 'info',
      devolucao: 'danger',
      sistema: 'primary',
      info: 'secondary'
    };
    return classes[type] || 'secondary';
  };

  return (
    <div className="notification-center">
      <button 
        className="notification-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔 Notificações
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="panel-header">
            <h4>Notificações</h4>
            <div className="panel-actions">
              {unreadCount > 0 && (
                <button 
                  className="btn-mark-all"
                  onClick={markAllAsRead}
                >
                  Marcar todas como lidas
                </button>
              )}
              <button 
                className="btn-close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.lida ? 'read' : 'unread'} ${getNotificationClass(notification.tipo)}`}
                  onClick={() => !notification.lida && markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.tipo)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.titulo}
                    </div>
                    <div className="notification-message">
                      {notification.mensagem}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  {!notification.lida && (
                    <div className="notification-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="panel-footer">
            <button 
              className="btn-view-all"
              onClick={() => window.location.href = '/notificacoes'}
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;