// src/pages/Dashboard/Dashboard.js - VERSÃO CORRIGIDA COMPLETA
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { Button, Loading } from '../../components/UI';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// =============================================
// COMPONENTES COMPARTILHADOS
// =============================================
const calcularEstoqueBaixoCorreto = (itens = []) => {
  if (!itens || itens.length === 0) return 0;
  
  return itens.filter(item => {
    const estoqueMinimo = item.estoque_minimo || item.estoqueMinimo || 0;
    const quantidade = item.quantidade || 0;
    
    // ✅ REGRAS CLARAS:
    // 1. Se quantidade = 0 → NÃO é estoque baixo (é estoque ZERO)
    if (quantidade === 0) return false;
    
    // 2. Se não tem estoque mínimo definido → NÃO é estoque baixo
    if (estoqueMinimo === 0) return false;

    // 3. Se está acima do mínimo → NÃO é estoque baixo
    if (quantidade > estoqueMinimo) return false;

    // 4. Estoque baixo: quantidade > 0 E quantidade <= estoqueMinimo
    //    E não é crítico (mais de 2 unidades E mais de 30% do mínimo)
    if (quantidade <= 2) return false; // Isso é crítico, não baixo

    const porcentagem = (quantidade / estoqueMinimo) * 100;
    if (porcentagem <= 30) return false; // Isso também é crítico
    
    // 5. Estoque baixo: quantidade > 0 E quantidade <= estoqueMinimo
    return true;
  }).length;
};

const calcularTotalAlertas = (itens = []) => {
  if (!itens || itens.length === 0) return 0;

  const estoqueBaixo = calcularEstoqueBaixoCorreto(itens);
  const estoqueZero = itens.filter(item => {
    const quantidade = item.quantidade || 0;
    return quantidade === 0;
  }).length;
  
  return estoqueBaixo + estoqueZero;
};

// 🆕 FUNÇÃO: Calcular itens em manutenção ATIVA
const calcularItensEmManutencaoAtiva = async () => {
  try {
    // Tenta buscar do dashboard primeiro
    const response = await dashboardService.getDashboard();
    if (response.data.success) {
      const data = response.data.data;
      // 🎯 Dashboard deve retornar apenas manutenções ativas (não concluídas)
      return data.estatisticas?.itensEmManutencao || 0;
    }
    return 0;
  } catch (error) {
    console.error('❌ Erro ao carregar manutenções ativas:', error);
    return 0;
  }
};

// 🆕 COMPONENTE: Badge de Status SEM NÚMERO
const StatusBadge = ({ status }) => {
  const badges = {
    'Em Manutenção': { text: '⚠️ Atenção', class: 'warning' },
    'Estoque Baixo': { text: '🔴 Crítico', class: 'danger' },
    'Itens Disponíveis': { text: '✅ Normal', class: 'success' },
    'Sem Alertas': { text: '✅ Sem Alertas', class: 'success' },
    'Normal': { text: '✅ Normal', class: 'success' },
    'Sem Manutenção': { text: '✅ Normal', class: 'success' }
  };
  
  const badge = badges[status];
  if (!badge) return null;
  
  return <span className={`status-badge status-badge--${badge.class}`}>{badge.text}</span>;
};

// 🆕 COMPONENTE: Indicador Visual SEM NÚMERO - VERSÃO COMPLETA
const VisualIndicator = ({ type, hasAlert, value }) => {
  // Se for "Em Manutenção" com valor > 0
  if (type === 'Em Manutenção' && value > 0) {
    return (
      <div className="visual-indicator maintenance-indicator">
        <span className="maintenance-icon">🛠️</span>
        <span className="maintenance-text">{value} item(s)</span>
      </div>
    );
  }
  
  // Se for "Em Manutenção" com valor = 0
  if (type === 'Em Manutenção' && value === 0) {
    return (
      <div className="visual-indicator normal-indicator">
        <span className="normal-icon">✅</span>
        <span className="normal-text">Normal</span>
      </div>
    );
  }
  
  // Para outros alertas (Estoque Baixo, Alertas Ativos)
  if (hasAlert) {
    return (
      <div className="visual-indicator alert-indicator">
        <div className="pulse-animation"></div>
        <span className="alert-text">VERIFICAR</span>
      </div>
    );
  }
  
  return (
    <div className="visual-indicator normal-indicator">
      <span className="normal-icon">✅</span>
      <span className="normal-text">Normal</span>
    </div>
  );
};

// 🆕 COMPONENTE: Ações Rápidas
const QuickActions = ({ onNewItem, onNewMovement }) => (
  <div className="quick-actions">
    <Button 
      variant="primary" 
      size="small"
      onClick={onNewItem}
      className="quick-action-btn"
    >
      ➕ Novo Item
    </Button>
    <Button 
      variant="success" 
      size="small"
      onClick={onNewMovement}
      className="quick-action-btn"
    >
      📤 Nova Movimentação
    </Button>
  </div>
);

// 🆕 COMPONENTE MODIFICADO: Cartão de Métrica SEM NÚMERO para alertas e manutenção
const MetricCard = ({ title, subtitle, color = 'primary', icon, trend, onClick, badge, showNumber = true, value, hasAlert = false, isMaintenance = false }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`metric-card metric-card--${color} ${onClick ? 'clickable' : ''}`} 
      onClick={handleClick}
    >
      <div className="metric-card__icon">{icon}</div>
      <div className="metric-card__content">
        <div className="metric-card__header">
          {showNumber ? (
            <h3 className="metric-card__value">{value}</h3>
          ) : (
            <VisualIndicator type={title} hasAlert={hasAlert} value={value} />
          )}
          {badge}
        </div>
        <p className="metric-card__title">{title}</p>
        {subtitle && <span className="metric-card__subtitle">{subtitle}</span>}
        {trend && (
          <div className={`metric-trend metric-trend--${trend.direction}`}>
            {trend.direction === 'up' ? '↗' : '↘'} {trend.value}%
          </div>
        )}
        {(title === 'Estoque Baixo' || title === 'Alertas Ativos') && hasAlert && (
          <div className="metric-hint">👆 Clique para ver detalhes</div>
        )}
        {title === 'Em Manutenção' && value > 0 && (
          <div className="metric-hint">👆 Clique para ver manutenções</div>
        )}
        {title === 'Em Manutenção' && value === 0 && (
          <div className="metric-hint">✅ Nenhuma manutenção ativa</div>
        )}
      </div>
    </div>
  );
};

// 🆕 COMPONENTE: Gráfico de Pizza Simples
const SimplePieChart = ({ title, data, colors, height = 200 }) => {
  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="no-data">Nenhum dado disponível</div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="no-data">Nenhum dado disponível</div>
      </div>
    );
  }

  let currentAngle = 0;

  return (
    <div className="chart-container">
      <h4>{title}</h4>
      <div className="pie-chart-wrapper">
        <svg width={height} height={height} viewBox={`0 0 ${height} ${height}`} className="pie-chart-svg">
          {data.map((item, index) => {
            if (item.value === 0) return null;
            
            const angle = (item.value / total) * 360;
            const largeArc = angle > 180 ? 1 : 0;
            
            const x1 = height/2 + (height/2 - 20) * Math.cos(currentAngle * Math.PI / 180);
            const y1 = height/2 + (height/2 - 20) * Math.sin(currentAngle * Math.PI / 180);
            const x2 = height/2 + (height/2 - 20) * Math.cos((currentAngle + angle) * Math.PI / 180);
            const y2 = height/2 + (height/2 - 20) * Math.sin((currentAngle + angle) * Math.PI / 180);
            
            const pathData = [
              `M ${height/2} ${height/2}`,
              `L ${x1} ${y1}`,
              `A ${height/2 - 20} ${height/2 - 20} 0 ${largeArc} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');
            
            const segment = (
              <path
                key={item.name}
                d={pathData}
                fill={colors[index % colors.length]}
                className="pie-segment"
              />
            );
            
            currentAngle += angle;
            return segment;
          })}
        </svg>
        <div className="pie-chart-legend">
          {data.map((item, index) => (
            <div key={item.name} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="legend-label">{item.name}</span>
              <span className="legend-value">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 🆕 COMPONENTE: Gráfico de Barras
const BarChart = ({ title, data, color = '#3B82F6', height = 200 }) => {
  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="no-data">Nenhum dado disponível</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  
  if (maxValue === 0) {
    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="no-data">Nenhum dado disponível</div>
      </div>
    );
  }

  const barWidth = 100 / data.length;

  return (
    <div className="chart-container">
      <h4>{title}</h4>
      <div className="bar-chart" style={{ height: `${height}px` }}>
        {data.map((item, index) => (
          <div
            key={index}
            className="bar-chart-item"
            style={{
              width: `${barWidth - 2}%`,
              height: `${(item.value / maxValue) * 80}%`
            }}
          >
            <div
              className="bar-chart-bar"
              style={{ backgroundColor: color }}
            />
            <div className="bar-chart-label">{item.label}</div>
            <div className="bar-chart-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 🆕 COMPONENTE: Status da Conexão WebSocket
const ConnectionStatus = ({ isConnected, lastUpdate }) => (
  <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
    <div className="connection-dot"></div>
    <span>
      {isConnected ? '🟢 Conectado' : '🔴 Desconectado'} 
      {lastUpdate && ` - ${lastUpdate.toLocaleTimeString('pt-BR')}`}
    </span>
  </div>
);

// 🆕 COMPONENTE: Notificações em Tempo Real
const NotificationCenter = ({ notifications, onCloseNotification }) => (
  <div className="notification-center">
    {notifications.map((notification) => (
      <div key={notification.id} className={`notification notification--${notification.type}`}>
        <div className="notification-header">
          <strong>{notification.title}</strong>
          <button 
            onClick={() => onCloseNotification(notification)}
            className="notification-close"
          >
            ×
          </button>
        </div>
        <div className="notification-body">{notification.message}</div>
        <div className="notification-time">
          {notification.timestamp.toLocaleTimeString()}
        </div>
      </div>
    ))}
  </div>
);

// 🆕 COMPONENTE: Atividades Recentes FIXAS
const FixedActivities = ({ activities, isConnected }) => {
  if (!activities || activities.length === 0) {
    return <div className="no-data">Nenhuma atividade recente</div>;
  }

  return (
    <div className="activity-feed fixed-activities">
      {activities.map((mov, index) => (
        <div key={mov.id || `activity-${index}`} className="activity-item fixed-activity">
          <div className="activity-icon">
            {mov.tipo === 'entrada' ? '📥' : '📤'}
          </div>
          <div className="activity-content">
            <div className="activity-text">
              <strong>{mov.usuario?.nome || 'Sistema'}</strong> {mov.tipo === 'entrada' ? 'adicionou' : 'retirou'} {mov.quantidade} {mov.item?.nome}
            </div>
            <div className="activity-time">
              {new Date(mov.data_movimentacao).toLocaleTimeString('pt-BR')}
              {isConnected && <span className="real-time-indicator"> ⚡</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 🆕 COMPONENTE: Card de Alerta Crítico
const AlertCard = ({ alerta, onClick }) => {
  const handleClick = () => {
    if (onClick && typeof onClick === 'function') {
      onClick(alerta);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div 
      className="alert-card alert-card--critical clickable"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">
        <h4>{alerta.item_nome || alerta.mensagem?.split(' está com')[0] || 'Alerta de Estoque'}</h4>
        <p>{alerta.mensagem}</p>
        <span className="alert-time">
          {formatDate(alerta.data_alerta || alerta.data_criacao)}
        </span>
      </div>
      <div className="alert-action">
        <span className="alert-hint">👆 Ver detalhes</span>
      </div>
    </div>
  );
};

// 🆕 COMPONENTE: Card de Serviço (Para tela restrita)
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
          className="service-action-btn"
        >
          Acessar
        </Button>
      ) : (
        <span className="service-badge">🔒 Restrito</span>
      )}
    </div>
  </div>
);

// =============================================
// COMPONENTE DASHBOARD RESTRITO - CORRIGIDO
// =============================================

const DashboardRestricted = ({ user, logout }) => {
  const hasRealAccess = () => {
    const perfisComDashboard = [
      'admin',
      'admin_estoque', 
      'tecnico_manutencao',
      'coordenador', 
      'gerente', 
      'tecnico', 
      'analista'
    ];
    
    return perfisComDashboard.includes(user?.perfil) || 
           user?.permissao_acesso_dashboard === true;
  };

  if (hasRealAccess()) {
    return <DashboardFull user={user} logout={logout} />;
  }

  return (
    <div className="restricted-dashboard">
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
                  <span className="access-label">Dashboard Completo:</span>
                  <span className="access-value badge-danger">
                    {hasRealAccess() ? '✅ Disponível' : '🔒 Restrito'}
                  </span>
                </div>
                <div className="access-item">
                  <span className="access-label">Permissão Dashboard:</span>
                  <span className="access-value">
                    {user?.permissao_acesso_dashboard ? '✅ Habilitada' : '❌ Não habilitada'}
                  </span>
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

// =============================================
// COMPONENTE DASHBOARD COMPLETO - CORRIGIDO
// =============================================

const DashboardFull = ({ user, logout }) => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const notificationTimeoutRef = useRef({});
  const dataLoadedRef = useRef(false);
  const disconnectNotificationShownRef = useRef(false);
  const [todosItens, setTodosItens] = useState([]);
  const [itensEmManutencaoCorrigido, setItensEmManutencaoCorrigido] = useState(0);

  // 🎯 CARREGAR TODOS OS ITENS PARA CÁLCULO CORRETO
  const carregarTodosItens = useCallback(async () => {
    try {
      console.log('📦 Carregando todos os itens para cálculo correto...');
      const response = await dashboardService.getTodosItens();
      if (response.data.success) {
        const itens = response.data.data?.itens || [];
        setTodosItens(itens);
        
        // 🎯 CALCULAR VALORES CORRETOS
        const estoqueBaixoCorreto = calcularEstoqueBaixoCorreto(itens);
        const totalAlertasCorreto = calcularTotalAlertas(itens);
        
        console.log('🔍 Cálculo correto:', {
          totalItens: itens.length,
          estoqueBaixoCorreto: estoqueBaixoCorreto,
          totalAlertasCorreto: totalAlertasCorreto
        });
        
        // 🎯 CARREGAR MANUTENÇÕES ATIVAS
        const manutencoesAtivas = await calcularItensEmManutencaoAtiva();
        setItensEmManutencaoCorrigido(manutencoesAtivas);
        
        // 🎯 CORRIGIR OS DADOS DO DASHBOARD
        setDashboardData(prev => {
          if (!prev) return initialData;
          
          return {
            ...prev,
            estatisticas: {
              ...prev.estatisticas,
              itensEstoqueBaixo: estoqueBaixoCorreto,
              alertasAtivos: totalAlertasCorreto,
              itensEmManutencao: manutencoesAtivas
            }
          };
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar todos os itens:', error);
    }
  }, []);

  // 🆕 DADOS INICIAIS PARA PREVENIR TELA VAZIA
  const initialData = {
    estatisticas: {
      totalItens: 0,
      itensDisponiveis: 0,
      itensEmUso: 0,
      itensEmManutencao: 0,
      movimentacoesRecentes: 0,
      valorPatrimonio: 0,
      itensEstoqueBaixo: 0,
      alertasAtivos: 0
    },
    itensPorCategoria: [],
    alertasCriticos: [],
    ultimasMovimentacoes: []
  };

  // 🆕 HANDLER DE CLIQUE PARA MANUTENÇÃO
  const handleManutencaoClick = () => {
    console.log('🎯 Navegando para manutenções...');
    navigate('/manutencoes');
  };

  // 🆕 HANDLER DE CLIQUE PARA ALERTAS
  const handleAlertClick = (alerta) => {
    console.log('🎯 Navegando para detalhes do alerta:', alerta);
    navigate('/estoque-baixo', { 
      state: { 
        alertaSelecionado: alerta 
      } 
    });
  };

  // 🆕 HANDLERS DE NAVEGAÇÃO
  const handleLowStockClick = () => {
    console.log('🎯 Navegando para estoque baixo...');
    navigate('/estoque-baixo');
  };

  const handleNewItem = () => {
    navigate('/itens/novo');
  };

  const handleNewMovement = () => {
    navigate('/movimentacoes/nova');
  };

  // 🎯 Sistema de notificações
  const addNotification = useCallback((newNotification) => {
    const now = Date.now();
    const notificationId = `notif_${newNotification.type}_${newNotification.title}_${now}`;
    
    setNotifications(prev => {
      const recentDuplicate = prev.find(n => {
        const timeDiff = now - new Date(n.timestamp).getTime();
        return (
          n.type === newNotification.type && 
          n.title === newNotification.title &&
          timeDiff < 5000
        );
      });
      
      if (recentDuplicate) {
        console.log('🚫 Notificação duplicada EVITADA:', newNotification.title);
        return prev;
      }
      
      const newNotifications = [
        {
          ...newNotification,
          id: notificationId,
          timestamp: new Date(now)
        },
        ...prev
      ].slice(0, 3);
      
      console.log('📨 Nova notificação adicionada:', newNotification.title);
      return newNotifications;
    });
    
    if (notificationTimeoutRef.current[notificationId]) {
      clearTimeout(notificationTimeoutRef.current[notificationId]);
    }
    
    notificationTimeoutRef.current[notificationId] = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      delete notificationTimeoutRef.current[notificationId];
    }, 5000);
    
  }, []);

  const removeNotification = useCallback((notification) => {
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    
    if (notification.id && notificationTimeoutRef.current[notification.id]) {
      clearTimeout(notificationTimeoutRef.current[notification.id]);
      delete notificationTimeoutRef.current[notification.id];
    }
  }, []);

  // 🎯 WebSocket hook
  const { 
    isConnected, 
    dashboardData: wsDashboardData, 
    alerts: wsAlerts,
    registerUser,
    requestDashboard,
    requestAlerts
  } = useWebSocket({
    getUser: () => user,
    
    onConnected: () => {
      console.log('✅ WebSocket conectado no Dashboard');
      disconnectNotificationShownRef.current = false;
      
      if (user) {
        registerUser(user);
      }
      
      requestDashboard();
      requestAlerts();
      
      addNotification({
        type: 'success', 
        title: '🔌 Conectado',
        message: 'Conexão em tempo real estabelecida'
      });
    },
    
    onDashboardUpdate: (data) => {
      console.log('🔄 Dados atualizados via WebSocket');
      
      setDashboardData(prev => ({
        ...(prev || initialData),
        ...data,
        estatisticas: {
          ...(prev?.estatisticas || initialData.estatisticas),
          ...data.estatisticas
        },
        ultimasMovimentacoes: data.ultimasMovimentacoes || prev?.ultimasMovimentacoes || []
      }));
      
      setLastUpdate(new Date());
    },
    
    onNewMovement: (data) => {
      console.log('📤 Nova movimentação via WebSocket');
      
      addNotification({
        type: 'info',
        title: '📤 Nova Movimentação',
        message: `${data.movement?.usuario || 'Sistema'} ${data.movement?.tipo === 'saida' ? 'retirou' : 'adicionou'} ${data.movement?.quantidade}x ${data.movement?.item}`
      });
      
      setDashboardData(prev => {
        const currentData = prev || initialData;
        const newMovement = {
          id: Date.now(),
          tipo: data.movement?.tipo || 'saida',
          quantidade: data.movement?.quantidade || 1,
          item: { 
            nome: data.movement?.item || 'Item desconhecido'
          },
          usuario: { 
            nome: data.movement?.usuario || 'Sistema' 
          },
          data_movimentacao: new Date()
        };
        
        return {
          ...currentData,
          ultimasMovimentacoes: [newMovement, ...(currentData.ultimasMovimentacoes || []).slice(0, 9)],
          estatisticas: {
            ...currentData.estatisticas,
            movimentacoesRecentes: (currentData.estatisticas.movimentacoesRecentes || 0) + 1
          }
        };
      });
    },
    
    onStockAlert: (data) => {
      console.log('🔔 Alerta de estoque via WebSocket', data);
      addNotification({
        type: 'error',
        title: '⚠️ Alerta de Estoque',
        message: data.alert?.mensagem || 'Item com estoque baixo'
      });
    },
    
    onDisconnected: (event) => {
      console.log('🔌 WebSocket desconectado - Callback chamado', event?.code);
      
      if (!disconnectNotificationShownRef.current) {
        disconnectNotificationShownRef.current = true;
        
        addNotification({
          type: 'warning',
          title: '🔌 Desconectado', 
          message: event?.code === 1006 
            ? 'Conexão com servidor perdida - Tentando reconectar...' 
            : 'Conexão em tempo real perdida - Dados mantidos localmente'
        });
      }
    },
    
    onReconnectFailed: () => {
      addNotification({
        type: 'error',
        title: '❌ Falha na Conexão',
        message: 'Não foi possível reconectar - Verifique sua conexão'
      });
    }
  });

  // 📊 CARREGAR DADOS INICIAIS
  const loadDashboardData = useCallback(async () => {
    if (dataLoadedRef.current && isConnected) {
      console.log('🚫 Dados já carregados - Evitando carga duplicada');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      const response = await dashboardService.getDashboard();
      
      if (response.data.success) {
        console.log('📊 Dados iniciais carregados (APENAS UMA VEZ)');
        const data = response.data.data;
        
        console.log('🔍 Dados recebidos da API:', {
          itensEstoqueBaixoAPI: data.estatisticas?.itensEstoqueBaixo,
          alertasAtivosAPI: data.estatisticas?.alertasAtivos,
          itensEmManutencaoAPI: data.estatisticas?.itensEmManutencao,
          totalItens: data.estatisticas?.totalItens
        });
        
        setDashboardData(data);
        setLastUpdate(new Date());
        dataLoadedRef.current = true;
        carregarTodosItens();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setError(error.response?.data?.message || 'Erro ao carregar dados');
      setDashboardData(initialData);
    } finally {
      setLoading(false);
    }
  }, [isConnected, carregarTodosItens]);

  // 🔄 ATUALIZAÇÃO AUTOMÁTICA
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    if (!dataLoadedRef.current || !isConnected) {
      loadDashboardData();
    }

    if (autoRefresh && !isConnected && mounted) {
      intervalId = setInterval(() => {
        if (mounted) {
          console.log('🔄 Atualizando dados via polling...');
          dataLoadedRef.current = false;
          loadDashboardData();
        }
      }, 30000);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, isConnected, loadDashboardData]);

  // 🎯 ATUALIZAR COM DADOS DO WEBSOCKET
  useEffect(() => {
    if (wsDashboardData) {
      console.log('📊 Atualizando com dados do WebSocket');
      setDashboardData(prev => ({
        ...(prev || initialData),
        ...wsDashboardData
      }));
      setLastUpdate(new Date());
      dataLoadedRef.current = true;
    }
  }, [wsDashboardData]);

  // 🎯 ATUALIZAR ALERTAS DO WEBSOCKET
  useEffect(() => {
    if (wsAlerts && wsAlerts.length > 0) {
      console.log('🔔 Atualizando alertas do WebSocket:', wsAlerts.length);
      setDashboardData(prev => ({
        ...(prev || initialData),
        alertasCriticos: wsAlerts
      }));
    }
  }, [wsAlerts]);

  // 🆕 CONTROLES DO DASHBOARD
  const DashboardControls = () => (
    <div className="dashboard-controls">
      <div className="control-group">
        <label className="control-label">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            disabled={isConnected}
          />
          {isConnected ? '🟢 WebSocket Ativo' : '🔄 Polling Automático'}
        </label>
        
        <Button 
          variant="outline" 
          size="small"
          onClick={() => {
            dataLoadedRef.current = false;
            loadDashboardData();
          }}
          className="control-btn"
        >
          🔃 Atualizar Agora
        </Button>
      </div>
      
      <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} />
    </div>
  );

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-loading">
        <Loading size="large" text="Carregando dashboard..." />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="dashboard-error">
        <div className="error-content">
          <h2>❌ Erro ao carregar dashboard</h2>
          <p>{error}</p>
          <Button onClick={() => {
            dataLoadedRef.current = false;
            loadDashboardData();
          }} variant="primary" className="error-btn">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // 🎯 USAR DADOS EXISTENTES MESMO COM ERRO
  const displayData = dashboardData || initialData;
  const { estatisticas, itensPorCategoria, ultimasMovimentacoes, alertasCriticos } = displayData;

  // 🎯 CALCULAR VALORES CORRETOS
  const estoqueBaixoCorrigido = todosItens.length > 0 
    ? calcularEstoqueBaixoCorreto(todosItens) 
    : Math.min(estatisticas.itensEstoqueBaixo || 0, 5);

  const alertasAtivosCorrigidos = todosItens.length > 0
    ? calcularTotalAlertas(todosItens)
    : Math.min(estatisticas.alertasAtivos || 0, 5);

  // 🎯 USAR VALOR CORRIGIDO PARA MANUTENÇÃO
  const itensEmManutencaoCorreto = itensEmManutencaoCorrigido > 0 
    ? itensEmManutencaoCorrigido 
    : estatisticas.itensEmManutencao || 0;

  console.log('🎯 Valores corrigidos no dashboard:', {
    totalItens: estatisticas.totalItens,
    estoqueBaixoCorrigido,
    alertasAtivosCorrigidos,
    itensEmManutencaoCorreto,
    disponiveis: estatisticas.itensDisponiveis
  });

  // 📊 DADOS PARA GRÁFICOS
  const statusData = [
    { name: 'Disponível', value: estatisticas.itensDisponiveis || 0 },
    { name: 'Em Uso', value: estatisticas.itensEmUso || 0 },
    { name: 'Manutenção', value: itensEmManutencaoCorreto }
  ];

  const categoriaData = (itensPorCategoria || []).map(item => ({
    name: item.nome,
    value: item.total_itens
  }));

  const movimentacoesData = [
    { label: 'Seg', value: 12 },
    { label: 'Ter', value: 19 },
    { label: 'Qua', value: 8 },
    { label: 'Qui', value: 15 },
    { label: 'Sex', value: 11 }
  ];

  // 🎨 CORES PARA GRÁFICOS
  const statusColors = ['#10B981', '#3B82F6', '#F59E0B'];
  const categoriaColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  // 🆕 MÉTRICAS PRINCIPAIS - SEM NÚMEROS NOS ALERTAS E MANUTENÇÃO
  const mainMetrics = [
    {
      title: "Total de Itens",
      value: estatisticas.totalItens || 0,
      icon: "📦",
      badge: null,
      onClick: null,
      color: 'primary',
      showNumber: true
    },
    {
      title: "Itens Disponíveis",
      value: estatisticas.itensDisponiveis || 0,
      subtitle: estatisticas.totalItens > 0 ? `${((estatisticas.itensDisponiveis / estatisticas.totalItens) * 100).toFixed(1)}% do total` : '0% do total',
      icon: "✅",
      badge: <StatusBadge status="Itens Disponíveis" />,
      onClick: null,
      color: 'success',
      showNumber: true
    },
    {
      title: "Estoque Baixo",
      value: estoqueBaixoCorrigido,
      icon: "⚠️",
      badge: estoqueBaixoCorrigido > 0 ? <StatusBadge status="Estoque Baixo" /> : <StatusBadge status="Sem Alertas" />,
      onClick: estoqueBaixoCorrigido > 0 ? handleLowStockClick : null,
      color: 'warning',
      showNumber: false, // 🚫 SEM NÚMERO
      hasAlert: estoqueBaixoCorrigido > 0
    },
    {
      title: "Alertas Ativos",
      value: alertasAtivosCorrigidos,
      icon: "🔔",
      badge: alertasAtivosCorrigidos > 0 ? <StatusBadge status="Estoque Baixo" /> : <StatusBadge status="Sem Alertas" />,
      onClick: alertasAtivosCorrigidos > 0 ? handleLowStockClick : null,
      color: 'danger',
      showNumber: false, // 🚫 SEM NÚMERO
      hasAlert: alertasAtivosCorrigidos > 0
    },
    {
      title: "Em Manutenção",
      value: itensEmManutencaoCorreto,
      icon: "🛠️",
      badge: itensEmManutencaoCorreto > 0 ? <StatusBadge status="Em Manutenção" /> : <StatusBadge status="Sem Manutenção" />,
      onClick: itensEmManutencaoCorreto > 0 ? handleManutencaoClick : null,
      color: 'warning',
      showNumber: false, // 🚫 SEM NÚMERO (mas mostra número no texto quando > 0)
      hasAlert: itensEmManutencaoCorreto > 0
    },
    {
      title: "Patrimônio Total",
      value: `R$ ${(estatisticas.valorPatrimonio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: "💰",
      badge: null,
      onClick: null,
      color: 'info',
      showNumber: true
    }
  ];

  return (
    <div className="dashboard">
      {/* 🎯 NOTIFICAÇÕES EM TEMPO REAL */}
      <NotificationCenter 
        notifications={notifications}
        onCloseNotification={removeNotification}
      />

      {/* 🎯 CABEÇALHO */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="dashboard-title">👋 Bem-vindo, {user?.nome || 'Usuário'}!</h1>
            <h2 className="dashboard-subtitle">📊 Dashboard de Estoque</h2>
            <p className="dashboard-description">Visão geral em tempo real do estoque de TI</p>
          </div>
          <div className="header-actions">
            <QuickActions 
              onNewItem={handleNewItem}
              onNewMovement={handleNewMovement}
            />
            <DashboardControls />
            <Button onClick={logout} variant="outline" className="logout-btn">
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* 🎯 SEÇÃO DE MÉTRICAS PRINCIPAIS */}
      <section className="metrics-section">
        <div className="metrics-grid">
          {mainMetrics.map((metric, index) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              subtitle={metric.subtitle}
              color={metric.color}
              icon={metric.icon}
              badge={metric.badge}
              onClick={metric.onClick}
              showNumber={metric.showNumber}
              hasAlert={metric.hasAlert}
              isMaintenance={metric.title === 'Em Manutenção'}
            />
          ))}
        </div>
      </section>

      {/* 🎯 SEÇÃO DE GRÁFICOS E ATIVIDADES */}
      <section className="charts-section">
        <div className="charts-grid">
          {/* Gráfico de Status */}
          <div className="chart-card">
            <SimplePieChart
              title="Status dos Itens"
              data={statusData}
              colors={statusColors}
              height={200}
            />
          </div>

          {/* Gráfico de Categorias */}
          <div className="chart-card">
            <SimplePieChart
              title="Itens por Categoria"
              data={categoriaData}
              colors={categoriaColors}
              height={200}
            />
          </div>

          {/* Gráfico de Movimentações */}
          <div className="chart-card">
            <BarChart
              title="Movimentações da Semana"
              data={movimentacoesData}
              color="#8B5CF6"
              height={200}
            />
          </div>

          {/* Atividades Recentes */}
          <div className="chart-card activities-card">
            <div className="activities-header">
              <h4>📋 Atividades Recentes</h4>
              <span className="activities-badge">
                {ultimasMovimentacoes?.length || 0}
              </span>
            </div>
            <FixedActivities 
              activities={ultimasMovimentacoes}
              isConnected={isConnected}
            />
          </div>
        </div>
      </section>

      {/* 🎯 SEÇÃO DE ALERTAS CRÍTICOS - ADICIONADA NOVAMENTE */}
      {(alertasCriticos && alertasCriticos.length > 0) && (
        <section className="alerts-section">
          <div className="alerts-header">
            <h3>⚠️ Alertas Críticos</h3>
            <span className="alerts-count">{alertasCriticos.length} alerta(s)</span>
          </div>
          <div className="alerts-grid">
            {alertasCriticos.map((alerta, index) => (
              <AlertCard
                key={alerta.id || `alerta-${index}`}
                alerta={alerta}
                onClick={handleAlertClick}
              />
            ))}
          </div>
        </section>
      )}
    </div>   
  );
};

// =============================================
// COMPONENTE PRINCIPAL DASHBOARD - VERSÃO CORRIGIDA
// =============================================

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [hasDashboardAccess, setHasDashboardAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      const perfisComDashboard = [
        'admin',
        'admin_estoque', 
        'tecnico_manutencao',
        'coordenador', 
        'gerente', 
        'tecnico', 
        'analista'
      ];
      
      const userHasAccess = user && (
        perfisComDashboard.includes(user.perfil) || 
        user.permissao_acesso_dashboard === true
      );
      
      setHasDashboardAccess(userHasAccess);
      setCheckingAccess(false);
    };

    if (user) {
      checkAccess();
    } else {
      setHasDashboardAccess(false);
      setCheckingAccess(false);
    }
  }, [user]);

  if (checkingAccess) {
    return (
      <div className="dashboard-loading">
        <Loading size="large" text="Verificando permissões..." />
      </div>
    );
  }

  if (!hasDashboardAccess) {
    return <DashboardRestricted user={user} logout={logout} />;
  }

  return <DashboardFull user={user} logout={logout} />;
};

export default Dashboard;