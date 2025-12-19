// frontend/src/pages/Dashboard/DashboardRestricted.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/UI';
import './DashboardRestricted.css';

const DashboardRestricted = () => {
  const { user, logout } = useAuth();

  // Componente de Card de Serviço
  const ServiceCard = ({ title, description, icon, action, available = true }) => (
    <div className={`service-card ${available ? 'available' : 'disabled'}`}>
      <div className="service-icon">{icon}</div>
      <div className="service-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="service-action">
        {available ? (
          <Button 
            variant="primary" 
            size="small"
            onClick={action}
          >
            Acessar
          </Button>
        ) : (
          <span className="service-badge">🔒 Restrito</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="restricted-dashboard">
      {/* Header */}
      <header className="restricted-header">
        <div className="restricted-header__info">
          <h1>👋 Bem-vindo, {user?.nome || 'Usuário'}!</h1>
          <p>Sistema de Gestão de Estoque TI - Acesso Limitado</p>
          <div className="access-badge">
            <span className="badge badge-warning">Acesso Básico</span>
          </div>
        </div>
        <div className="restricted-header__actions">
          <Button onClick={logout} variant="outline">
            Sair
          </Button>
        </div>
      </header>

      {/* Mensagem de Boas-Vindas */}
      <div className="welcome-section">
        <div className="welcome-card">
          <div className="welcome-content">
            <h2>📊 Acesso ao Dashboard Restrito</h2>
            <p>
              Seu perfil atual <strong>({user?.perfil})</strong> tem acesso limitado ao sistema. 
              Você pode utilizar os serviços básicos listados abaixo.
            </p>
            
            <div className="access-info">
              <h4>ℹ️ Informações de Acesso</h4>
              <div className="access-details">
                <div className="access-item">
                  <span className="access-label">Perfil:</span>
                  <span className="access-value">{user?.perfil}</span>
                </div>
                <div className="access-item">
                  <span className="access-label">Dashboard:</span>
                  <span className="access-value badge-danger">🔒 Restrito</span>
                </div>
                <div className="access-item">
                  <span className="access-label">Responsável Estoque:</span>
                  <span className="access-value">
                    {user?.responsavel_estoque ? '✅ Sim' : '❌ Não'}
                  </span>
                </div>
              </div>
            </div>

            <div className="contact-info">
              <h4>📞 Solicitar Acesso Completo</h4>
              <div className="contact-details">
                <p>
                  Para acessar o dashboard completo com gráficos, métricas em tempo real 
                  e funcionalidades avançadas, entre em contato com o administrador do sistema.
                </p>
                <div className="contact-methods">
                  <span>📧 <strong>ti@empresa.com</strong></span>
                  <span>📞 <strong>Ramal: 1234</strong></span>
                  <span>🕒 <strong>08h-18h (Segunda a Sexta)</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Serviços Disponíveis */}
      <section className="services-section">
        <div className="services-header">
          <h2>✅ Serviços Disponíveis</h2>
          <p>Recursos que você pode acessar com seu perfil atual</p>
        </div>
        
        <div className="services-grid">
          <ServiceCard
            title="Consulta de Itens"
            description="Pesquise e visualize todos os itens do estoque"
            icon="🔍"
            available={true}
            action={() => window.location.href = '/itens'}
          />
          
          <ServiceCard
            title="Minhas Solicitações"
            description="Acompanhe suas solicitações e histórico"
            icon="📋"
            available={true}
            action={() => window.location.href = '/minhas-solicitacoes'}
          />
          
          <ServiceCard
            title="Meu Perfil"
            description="Atualize suas informações pessoais"
            icon="👤"
            available={true}
            action={() => window.location.href = '/perfil'}
          />
          
          <ServiceCard
            title="Central de Ajuda"
            description="Documentação, tutoriais e suporte"
            icon="❓"
            available={true}
            action={() => window.location.href = '/ajuda'}
          />

          <ServiceCard
            title="Relatório de Itens"
            description="Relatórios básicos de consulta"
            icon="📄"
            available={true}
            action={() => window.location.href = '/relatorios/itens'}
          />

          <ServiceCard
            title="Histórico Pessoal"
            description="Seu histórico de movimentações"
            icon="🕒"
            available={true}
            action={() => window.location.href = '/meu-historico'}
          />
        </div>
      </section>

      {/* Seção de Serviços Restritos */}
      <section className="restricted-section">
        <div className="restricted-header">
          <h2>🔐 Funcionalidades Restritas</h2>
          <p>Estes recursos requerem permissões de dashboard</p>
        </div>
        
        <div className="services-grid">
          <ServiceCard
            title="Dashboard Completo"
            description="Visão geral em tempo real com gráficos e métricas"
            icon="📊"
            available={false}
          />
          
          <ServiceCard
            title="Gestão de Itens"
            description="Adicionar, editar e remover itens do estoque"
            icon="📦"
            available={false}
          />
          
          <ServiceCard
            title="Relatórios Avançados"
            description="Analytics detalhados e relatórios executivos"
            icon="📈"
            available={false}
          />
          
          <ServiceCard
            title="Administração"
            description="Gestão de usuários e permissões do sistema"
            icon="⚙️"
            available={false}
          />

          <ServiceCard
            title="Alertas em Tempo Real"
            description="Notificações instantâneas do sistema"
            icon="🔔"
            available={false}
          />

          <ServiceCard
            title="Controle de Estoque"
            description="Gestão completa do fluxo de estoque"
            icon="📋"
            available={false}
          />
        </div>
      </section>

      {/* Status do Sistema */}
      <div className="system-status">
        <div className="status-card">
          <h3>🟢 Sistema Online</h3>
          <p>Todos os serviços básicos estão disponíveis para seu perfil</p>
          <div className="status-info">
            <span>Perfil: <strong>{user?.perfil}</strong></span>
            <span>Departamento: <strong>{user?.departamento || 'Não informado'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardRestricted;