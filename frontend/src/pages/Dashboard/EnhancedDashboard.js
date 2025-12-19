// 📁 frontend/src/pages/Dashboard/EnhancedDashboard.js
import React, { useState, useEffect } from 'react';
import QRCodeManager from '../../components/QRCode/QRCodeManager';
import BackupManager from '../../components/Backup/BackupManager';
import AlertSystem from '../../components/Alerts/AlertSystem';
import NotificationCenter from '../../components/Notifications/NotificationCenter';
import { enableOfflineMode, installPWA } from '../../utils/mobileOptimizations';
import './EnhancedDashboard.css';

const EnhancedDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [pwaAvailable, setPwaAvailable] = useState(false);

  useEffect(() => {
    // Habilitar funcionalidades PWA
    enableOfflineMode();
    
    // Verificar se PWA pode ser instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 App rodando em modo standalone');
    } else {
      setPwaAvailable(true);
      installPWA();
    }
  }, []);

  const sections = {
    overview: { name: '📊 Visão Geral', component: <DashboardOverview /> },
    qrcode: { name: '🔲 QR Codes', component: <QRCodeManager /> },
    alerts: { name: '🔔 Alertas', component: <AlertSystem /> },
    backup: { name: '💾 Backup', component: <BackupManager /> },
    notifications: { name: '📧 Notificações', component: <NotificationCenter /> }
  };

  return (
    <div className="enhanced-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚀 Sistema de Estoque TI - Dashboard Avançado</h1>
          <p>Todas as funcionalidades em um só lugar</p>
        </div>
        
        <div className="header-actions">
          <NotificationCenter />
          {pwaAvailable && (
            <button className="pwa-btn" onClick={installPWA}>
              📱 Instalar App
            </button>
          )}
        </div>
      </header>

      <nav className="dashboard-nav">
        {Object.entries(sections).map(([key, section]) => (
          <button
            key={key}
            className={`nav-btn ${activeSection === key ? 'active' : ''}`}
            onClick={() => setActiveSection(key)}
          >
            {section.name}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {sections[activeSection].component}
      </main>

      {/* Footer com status do sistema */}
      <footer className="dashboard-footer">
        <div className="footer-status">
          <span className="status-online">🟢 Sistema Online</span>
          <span>📱 Modo: {window.matchMedia('(display-mode: standalone)').matches ? 'App' : 'Navegador'}</span>
          <span>💾 Backup Automático: Ativo</span>
        </div>
      </footer>
    </div>
  );
};

// Componente de visão geral simplificado
const DashboardOverview = () => (
  <div className="overview-grid">
    <div className="welcome-card">
      <h2>Bem-vindo ao Sistema Avançado! 🎉</h2>
      <p>Explore todas as novas funcionalidades:</p>
      
      <div className="feature-list">
        <div className="feature-item">
          <span className="feature-icon">🔲</span>
          <div>
            <h4>QR Code System</h4>
            <p>Gerencie itens com QR Codes</p>
          </div>
        </div>
        
        <div className="feature-item">
          <span className="feature-icon">🔔</span>
          <div>
            <h4>Alertas Inteligentes</h4>
            <p>Monitoramento automático</p>
          </div>
        </div>
        
        <div className="feature-item">
          <span className="feature-icon">💾</span>
          <div>
            <h4>Sistema de Backup</h4>
            <p>Proteja seus dados</p>
          </div>
        </div>
        
        <div className="feature-item">
          <span className="feature-icon">📧</span>
          <div>
            <h4>Notificações</h4>
            <p>Comunicação eficiente</p>
          </div>
        </div>
        
        <div className="feature-item">
          <span className="feature-icon">📱</span>
          <div>
            <h4>PWA Mobile</h4>
            <p>Use como app nativo</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EnhancedDashboard;