import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './DashboardAprovacao.css';

const DashboardAprovacao = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [periodo, setPeriodo] = useState('hoje'); // hoje, semana, mes
  const [viewMode, setViewMode] = useState('cards'); // cards, tabela
  const [solicitacoesSelecionadas, setSolicitacoesSelecionadas] = useState([]);

  // 🔍 Verificar se usuário é Admin Estoque
  useEffect(() => {
    if (user?.perfil !== 'admin_estoque') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // 📊 Carregar dados da dashboard
  const carregarDados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/aprovacao', {
        params: { periodo }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard de aprovação:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  // 📋 Aprovar múltiplas solicitações
  const aprovarSolicitacoes = async () => {
    if (solicitacoesSelecionadas.length === 0) {
      alert('Selecione pelo menos uma solicitação para aprovar');
      return;
    }

    if (!window.confirm(`Deseja aprovar ${solicitacoesSelecionadas.length} solicitação(ões)?`)) {
      return;
    }

    try {
      const response = await api.post('/solicitacoes/aprovar-lote', {
        solicitacao_ids: solicitacoesSelecionadas,
        observacao: 'Aprovado em lote via dashboard'
      });

      if (response.data.success) {
        alert('Solicitações aprovadas com sucesso!');
        setSolicitacoesSelecionadas([]);
        carregarDados();
      }
    } catch (error) {
      console.error('Erro ao aprovar solicitações:', error);
      alert('Erro ao aprovar solicitações');
    }
  };

  // 📋 Rejeitar múltiplas solicitações
  const rejeitarSolicitacoes = async () => {
    if (solicitacoesSelecionadas.length === 0) {
      alert('Selecione pelo menos uma solicitação para rejeitar');
      return;
    }

    const motivo = prompt('Informe o motivo da rejeição:');
    if (!motivo) return;

    try {
      const response = await api.post('/solicitacoes/rejeitar-lote', {
        solicitacao_ids: solicitacoesSelecionadas,
        motivo
      });

      if (response.data.success) {
        alert('Solicitações rejeitadas com sucesso!');
        setSolicitacoesSelecionadas([]);
        carregarDados();
      }
    } catch (error) {
      console.error('Erro ao rejeitar solicitações:', error);
      alert('Erro ao rejeitar solicitações');
    }
  };

  // 🔄 Alternar seleção de solicitação
  const toggleSelecaoSolicitacao = (solicitacaoId) => {
    setSolicitacoesSelecionadas(prev => {
      if (prev.includes(solicitacaoId)) {
        return prev.filter(id => id !== solicitacaoId);
      } else {
        return [...prev, solicitacaoId];
      }
    });
  };

  // 🔄 Selecionar todas as solicitações
  const selecionarTodas = () => {
    if (!dashboardData?.solicitacoesPendentes) return;
    
    if (solicitacoesSelecionadas.length === dashboardData.solicitacoesPendentes.length) {
      setSolicitacoesSelecionadas([]);
    } else {
      const todasIds = dashboardData.solicitacoesPendentes.map(s => s.id);
      setSolicitacoesSelecionadas(todasIds);
    }
  };

  // 📊 Componente: Card de Métrica de Aprovação
  const MetricCard = ({ title, value, icon, color, subtitle, onClick }) => (
    <div 
      className={`metric-card metric-${color} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h3>{value}</h3>
        <h4>{title}</h4>
        {subtitle && <p className="metric-subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  // 📊 Componente: Card de Solicitação
  const SolicitaçãoCard = ({ solicitacao, isSelected }) => {
    const formatarData = (data) => {
      if (!data) return '';
      return new Date(data).toLocaleDateString('pt-BR');
    };

    const formatarValor = (valor) => {
      if (!valor) return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    };

    const getPrioridadeColor = (prioridade) => {
      const cores = {
        urgente: '#ef4444',
        alta: '#f97316',
        media: '#eab308',
        baixa: '#22c55e'
      };
      return cores[prioridade] || '#6b7280';
    };

    return (
      <div 
        className={`solicitacao-card ${isSelected ? 'selected' : ''}`}
        onClick={() => navigate(`/solicitacoes/${solicitacao.id}/aprovar`)}
      >
        <div className="solicitacao-card-header">
          <div className="solicitacao-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelecaoSolicitacao(solicitacao.id);
              }}
            />
          </div>
          <div className="solicitacao-info">
            <div className="solicitacao-codigo">
              <strong>{solicitacao.codigo_solicitacao}</strong>
              <span className="prioridade-badge" style={{ 
                backgroundColor: getPrioridadeColor(solicitacao.prioridade)
              }}>
                {solicitacao.prioridade.toUpperCase()}
              </span>
            </div>
            <h4 className="solicitacao-titulo">{solicitacao.titulo}</h4>
            <div className="solicitacao-meta">
              <span>👤 {solicitacao.solicitante_nome}</span>
              <span>📅 {formatarData(solicitacao.data_solicitacao)}</span>
              {solicitacao.valor_total && (
                <span>💰 {formatarValor(solicitacao.valor_total)}</span>
              )}
              <span>📦 {solicitacao.total_itens} itens</span>
            </div>
          </div>
          <div className="solicitacao-actions">
            <button 
              className="btn-ver btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/solicitacoes/${solicitacao.id}/aprovar`);
              }}
            >
              🔍 Analisar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 📊 Componente: Gráfico de Distribuição
  const DistribuicaoChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-container">
          <h4>{title}</h4>
          <div className="no-data">Sem dados disponíveis</div>
        </div>
      );
    }

    const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="distribuicao-chart">
          <div className="distribuicao-bars">
            {data.map((item, index) => {
              const porcentagem = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.name} className="distribuicao-bar-container">
                  <div className="distribuicao-bar-label">
                    <span>{item.name}</span>
                    <span>{item.value} ({porcentagem.toFixed(1)}%)</span>
                  </div>
                  <div className="distribuicao-bar-track">
                    <div 
                      className="distribuicao-bar"
                      style={{
                        width: `${porcentagem}%`,
                        backgroundColor: cores[index % cores.length]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 📊 Componente: Tabela de Solicitações
  const TabelaSolicitacoes = () => {
    if (!dashboardData?.solicitacoesPendentes?.length) {
      return (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>Nenhuma solicitação pendente</h3>
          <p>Todas as solicitações foram processadas.</p>
        </div>
      );
    }

    const formatarData = (data) => {
      return new Date(data).toLocaleDateString('pt-BR');
    };

    return (
      <div className="tabela-container">
        <div className="tabela-header">
          <h3>Solicitações Pendentes de Aprovação</h3>
          <div className="tabela-acoes">
            <button 
              className="btn-select-all"
              onClick={selecionarTodas}
            >
              {solicitacoesSelecionadas.length === dashboardData.solicitacoesPendentes.length ? 
                '❌ Desselecionar Todas' : '✅ Selecionar Todas'}
            </button>
          </div>
        </div>
        
        <div className="tabela-content">
          <table className="solicitacoes-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={solicitacoesSelecionadas.length === dashboardData.solicitacoesPendentes.length && dashboardData.solicitacoesPendentes.length > 0}
                    onChange={selecionarTodas}
                  />
                </th>
                <th>Código</th>
                <th>Solicitante</th>
                <th>Departamento</th>
                <th>Título</th>
                <th>Itens</th>
                <th>Valor Total</th>
                <th>Prioridade</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.solicitacoesPendentes.map(solicitacao => (
                <tr 
                  key={solicitacao.id} 
                  className={solicitacoesSelecionadas.includes(solicitacao.id) ? 'selected-row' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={solicitacoesSelecionadas.includes(solicitacao.id)}
                      onChange={() => toggleSelecaoSolicitacao(solicitacao.id)}
                    />
                  </td>
                  <td>
                    <strong>{solicitacao.codigo_solicitacao}</strong>
                  </td>
                  <td>{solicitacao.solicitante_nome}</td>
                  <td>{solicitacao.departamento}</td>
                  <td>
                    <div className="truncate-text" title={solicitacao.titulo}>
                      {solicitacao.titulo}
                    </div>
                  </td>
                  <td>{solicitacao.total_itens}</td>
                  <td>
                    {solicitacao.valor_total ? 
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(solicitacao.valor_total) : 
                      'R$ 0,00'
                    }
                  </td>
                  <td>
                    <span className={`prioridade-tag prioridade-${solicitacao.prioridade}`}>
                      {solicitacao.prioridade}
                    </span>
                  </td>
                  <td>{formatarData(solicitacao.data_solicitacao)}</td>
                  <td>
                    <button 
                      className="btn-analisar"
                      onClick={() => navigate(`/solicitacoes/${solicitacao.id}/aprovar`)}
                    >
                      🔍 Analisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Carregando dashboard de aprovação...</p>
      </div>
    );
  }

  const data = dashboardData || {
    estatisticas: {
      totalSolicitacoes: 0,
      solicitacoesPendentes: 0,
      solicitacoesAprovadasPeriodo: 0,
      solicitacoesRejeitadasPeriodo: 0,
      valorTotalPendente: 0,
      totalItensPatrimonio: 0,
      valorPatrimonioTotal: 0,
      itensBaixoEstoque: 0
    },
    solicitacoesPendentes: [],
    distribuicaoPrioridade: [],
    distribuicaoTipo: []
  };

  return (
    <div className="dashboard-aprovacao">
      {/* Cabeçalho */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1>👑 Dashboard de Aprovação</h1>
            <h2>Administrador do Estoque - Controle de Solicitações</h2>
            <p>Gerencie todas as solicitações aprovadas por coordenadores/gerentes</p>
          </div>
          <div className="header-actions">
            <div className="periodo-selector">
              <select 
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="periodo-select"
              >
                <option value="hoje">Hoje</option>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mês</option>
              </select>
            </div>
            <button 
              className="logout-btn"
              onClick={logout}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Ações em Lote */}
      {solicitacoesSelecionadas.length > 0 && (
        <div className="batch-actions">
          <div className="batch-info">
            <strong>{solicitacoesSelecionadas.length}</strong> solicitações selecionadas
          </div>
          <div className="batch-buttons">
            <button 
              className="btn-batch-approve"
              onClick={aprovarSolicitacoes}
            >
              ✅ Aprovar Selecionadas
            </button>
            <button 
              className="btn-batch-reject"
              onClick={rejeitarSolicitacoes}
            >
              ❌ Rejeitar Selecionadas
            </button>
            <button 
              className="btn-batch-clear"
              onClick={() => setSolicitacoesSelecionadas([])}
            >
              🗑️ Limpar Seleção
            </button>
          </div>
        </div>
      )}

      {/* Métricas Principais */}
      <section className="metrics-section">
        <div className="metrics-grid">
          <MetricCard
            title="Solicitações Pendentes"
            value={data.estatisticas.solicitacoesPendentes}
            icon="⏳"
            color="warning"
            subtitle="Aguardando sua análise"
            onClick={() => {
              const element = document.querySelector('.solicitacoes-section');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          <MetricCard
            title="Valor Pendente"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(data.estatisticas.valorTotalPendente)}
            icon="💰"
            color="danger"
            subtitle="Valor total das solicitações pendentes"
          />

          <MetricCard
            title="Patrimônio Total"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(data.estatisticas.valorPatrimonioTotal)}
            icon="🏦"
            color="info"
            subtitle={`${data.estatisticas.totalItensPatrimonio} itens`}
          />

          <MetricCard
            title="Estoque Baixo"
            value={data.estatisticas.itensBaixoEstoque}
            icon="⚠️"
            color="danger"
            subtitle="Itens que precisam de atenção"
            onClick={() => navigate('/estoque-baixo')}
          />

          <MetricCard
            title="Aprovadas (Período)"
            value={data.estatisticas.solicitacoesAprovadasPeriodo}
            icon="✅"
            color="success"
            subtitle={`${data.estatisticas.solicitacoesRejeitadasPeriodo} rejeitadas`}
          />

          <MetricCard
            title="Total Solicitações"
            value={data.estatisticas.totalSolicitacoes}
            icon="📋"
            color="primary"
            subtitle="No período selecionado"
          />
        </div>
      </section>

      {/* Seção de Visualização */}
      <section className="view-controls">
        <div className="view-tabs">
          <button 
            className={`view-tab ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            🃏 Visualização em Cards
          </button>
          <button 
            className={`view-tab ${viewMode === 'tabela' ? 'active' : ''}`}
            onClick={() => setViewMode('tabela')}
          >
            📊 Visualização em Tabela
          </button>
        </div>
      </section>

      {/* Seção de Solicitações */}
      <section className="solicitacoes-section">
        {viewMode === 'cards' ? (
          <div className="solicitacoes-grid">
            {data.solicitacoesPendentes?.length > 0 ? (
              data.solicitacoesPendentes.map(solicitacao => (
                <SolicitaçãoCard
                  key={solicitacao.id}
                  solicitacao={solicitacao}
                  isSelected={solicitacoesSelecionadas.includes(solicitacao.id)}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <h3>Todas as solicitações processadas!</h3>
                <p>Nenhuma solicitação pendente no momento.</p>
              </div>
            )}
          </div>
        ) : (
          <TabelaSolicitacoes />
        )}
      </section>

      {/* Seção de Análise */}
      <section className="analise-section">
        <div className="analise-grid">
          <div className="analise-card">
            <DistribuicaoChart
              title="Distribuição por Prioridade"
              data={data.distribuicaoPrioridade || []}
            />
          </div>
          
          <div className="analise-card">
            <DistribuicaoChart
              title="Distribuição por Tipo"
              data={data.distribuicaoTipo || []}
            />
          </div>
          
          <div className="analise-card estatisticas-card">
            <h4>📈 Estatísticas Rápidas</h4>
            <div className="estatisticas-list">
              <div className="estatistica-item">
                <span className="estatistica-label">Média de Itens por Solicitação:</span>
                <span className="estatistica-value">
                  {data.solicitacoesPendentes?.length > 0 
                    ? (data.solicitacoesPendentes.reduce((sum, s) => sum + s.total_itens, 0) / data.solicitacoesPendentes.length).toFixed(1)
                    : 0
                  }
                </span>
              </div>
              <div className="estatistica-item">
                <span className="estatistica-label">Valor Médio por Solicitação:</span>
                <span className="estatistica-value">
                  {data.estatisticas.solicitacoesPendentes > 0 
                    ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(data.estatisticas.valorTotalPendente / data.estatisticas.solicitacoesPendentes)
                    : 'R$ 0,00'
                  }
                </span>
              </div>
              <div className="estatistica-item">
                <span className="estatistica-label">Tempo Médio de Espera:</span>
                <span className="estatistica-value">
                  {data.solicitacoesPendentes?.length > 0 ? '2.5 dias' : 'N/A'}
                </span>
              </div>
              <div className="estatistica-item">
                <span className="estatistica-label">Taxa de Aprovação (Período):</span>
                <span className="estatistica-value">
                  {data.estatisticas.totalSolicitacoes > 0 
                    ? `${((data.estatisticas.solicitacoesAprovadasPeriodo / data.estatisticas.totalSolicitacoes) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-info">
          <p>🕐 Última atualização: {new Date().toLocaleTimeString('pt-BR')}</p>
          <p>👑 Usuário: {user?.nome} ({user?.perfil})</p>
          <p>🏢 Departamento: {user?.departamento || 'Não informado'}</p>
        </div>
        <div className="footer-actions">
          <button 
            className="btn-atualizar"
            onClick={carregarDados}
          >
            🔄 Atualizar Dados
          </button>
        </div>
      </footer>
    </div>
  );
};

export default DashboardAprovacao;