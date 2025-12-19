// src/pages/Movimentacoes/MovimentacoesList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movimentacoesService, itensService, healthService } from '../../services/api';
import { Button, Loading } from '../../components/UI';
import { MOVIMENTACOES_TIPOS, LABELS } from '../../utils/constants';
import './MovimentacoesList.css'; // Novo arquivo CSS

const MovimentacoesList = () => {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  
  const [filtros, setFiltros] = useState({
    tipo: '',
    item_id: '',
    data_inicio: '',
    data_fim: '',
    search: ''
  });

  // Verificar status do backend
  const verificarBackend = async () => {
    try {
      console.log('🔍 Verificando backend na porta 3001...');
      await healthService.check();
      setBackendStatus('online');
      console.log('✅ Backend ONLINE na porta 3001');
      return true;
    } catch (error) {
      console.error('❌ Backend OFFLINE:', error);
      setBackendStatus('offline');
      return false;
    }
  };

  // Carregar movimentações
  const carregarMovimentacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando movimentações...');
      
      // Verificar se backend está online
      const backendOnline = await verificarBackend();
      if (!backendOnline) {
        throw new Error('Backend não está respondendo na porta 3001');
      }
      
      const params = new URLSearchParams();
      
      if (filtros.tipo && filtros.tipo !== '') params.append('tipo', filtros.tipo);
      if (filtros.item_id && filtros.item_id !== '') params.append('item_id', filtros.item_id);
      if (filtros.data_inicio && filtros.data_inicio !== '') params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim && filtros.data_fim !== '') params.append('data_fim', filtros.data_fim);
      if (filtros.search && filtros.search !== '') params.append('search', filtros.search);
      
      const response = await movimentacoesService.getAll(Object.fromEntries(params));
      
      if (response.data && response.data.success) {
        const movimentacoesData = response.data.data || [];
        console.log(`📊 ${movimentacoesData.length} movimentações carregadas`);
        setMovimentacoes(movimentacoesData);
      } else {
        throw new Error(response.data?.message || 'Estrutura de resposta inválida');
      }
    } catch (error) {
      console.error('💥 Erro ao carregar movimentações:', error);
      
      let errorMessage = 'Erro ao carregar movimentações';
      
      if (error.message.includes('Backend não está respondendo')) {
        errorMessage = 'Servidor backend não está rodando na porta 3001.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout: Servidor demorou para responder.';
      } else if (!error.response) {
        errorMessage = 'Erro de conexão. Verifique se o backend está rodando.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. Verifique os logs do backend.';
      } else {
        errorMessage = error.response?.data?.message || error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Carregar itens para filtro
  const carregarItens = async () => {
    try {
      const response = await itensService.getAll({ limit: 100 });
      if (response.data && response.data.success) {
        setItens(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  useEffect(() => {
    carregarMovimentacoes();
    carregarItens();
  }, [filtros]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const limparFiltros = () => {
    setFiltros({
      tipo: '',
      item_id: '',
      data_inicio: '',
      data_fim: '',
      search: ''
    });
  };

  const getBadgeVariant = (tipo) => {
    const variants = {
      entrada: 'success',
      saida: 'warning', 
      devolucao: 'info',
      ajuste: 'secondary',
      transferencia: 'primary'
    };
    return variants[tipo] || 'secondary';
  };

  const getIcone = (tipo) => {
    const icones = {
      entrada: '📥',
      saida: '📤',
      devolucao: '🔄',
      ajuste: '⚙️',
      transferencia: '🔄'
    };
    return icones[tipo] || '📋';
  };

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    try {
      return new Date(dataString).toLocaleString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dataString;
    }
  };

  const renderItemInfo = (movimentacao) => {
    if (!movimentacao.item) return <span className="movimentacoes-list-text-muted">-</span>;
    
    return (
      <div className="movimentacoes-list-item-info">
        <strong className="movimentacoes-list-item-nome">{movimentacao.item.nome || 'Nome não disponível'}</strong>
        {movimentacao.item.patrimonio && (
          <span className="movimentacoes-list-item-patrimonio">
            #{movimentacao.item.patrimonio}
          </span>
        )}
      </div>
    );
  };

  const renderUsuarioInfo = (movimentacao) => {
    if (!movimentacao.usuario) return <span className="movimentacoes-list-text-muted">-</span>;
    
    return (
      <div className="movimentacoes-list-usuario-info">
        <strong className="movimentacoes-list-usuario-nome">{movimentacao.usuario.nome || 'Usuário'}</strong>
        {movimentacao.usuario.email && (
          <div className="movimentacoes-list-usuario-email">
            {movimentacao.usuario.email}
          </div>
        )}
      </div>
    );
  };

  // Componente de erro detalhado
  const renderError = () => (
    <div className="movimentacoes-list-error-container">
      <div className="movimentacoes-list-error-header">
        <div className="movimentacoes-list-error-icon">❌</div>
        <h3>Erro ao Carregar Movimentações</h3>
      </div>
      
      <div className="movimentacoes-list-error-content">
        <p><strong>Mensagem:</strong> {error}</p>
        
        <div className="movimentacoes-list-debug-section">
          <h4>🛠️ Para Resolver:</h4>
          <ol>
            <li>
              <strong>Verifique o Backend:</strong>
              <br />
              <code>cd backend && npm run dev</code>
            </li>
            <li>
              <strong>Teste manualmente:</strong>
              <br />
              <a 
                href="http://localhost:3001/api/movimentacoes" 
                target="_blank" 
                rel="noopener noreferrer"
                className="movimentacoes-list-debug-link"
              >
                Abrir: http://localhost:3001/api/movimentacoes
              </a>
            </li>
            <li>
              <strong>Status Backend:</strong> 
              <span className={`movimentacoes-list-status ${backendStatus}`}>
                {backendStatus === 'online' ? '✅ Online' : '❌ Offline'}
              </span>
            </li>
          </ol>
        </div>
        
        <div className="movimentacoes-list-error-actions">
          <Button 
            variant="primary" 
            onClick={carregarMovimentacoes}
            className="movimentacoes-list-btn movimentacoes-list-btn-primary"
          >
            🔄 Tentar Novamente
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={verificarBackend}
            className="movimentacoes-list-btn movimentacoes-list-btn-secondary"
          >
            🔍 Verificar Backend
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="movimentacoes-list-container">
      {/* 🎯 CABEÇALHO MODERNIZADO */}
      <header className="movimentacoes-list-header">
        <div className="movimentacoes-list-header-content">
          <div className="movimentacoes-list-header-title">
            <h1>
              <span className="movimentacoes-list-page-icon">📋</span>
              Histórico de Movimentações
            </h1>
            <p>Controle completo de entrada, saída e devolução de equipamentos</p>
          </div>
          <div className="movimentacoes-list-header-status">
            <span className="movimentacoes-list-status-label">Status do Sistema:</span>
            <span className={`movimentacoes-list-status-badge ${backendStatus}`}>
              {backendStatus === 'online' ? '✅ Conectado' : 
               backendStatus === 'offline' ? '❌ Offline' : '🔍 Verificando...'}
            </span>
          </div>
        </div>
        
        <div className="movimentacoes-list-header-actions">
          <Link to="/movimentacoes/registrar-saida" className="movimentacoes-list-btn movimentacoes-list-btn-action movimentacoes-list-btn-warning">
            <span className="movimentacoes-list-btn-icon">📤</span>
            Registrar Saída
          </Link>
          <Link to="/movimentacoes/nova" className="movimentacoes-list-btn movimentacoes-list-btn-action movimentacoes-list-btn-primary">
            <span className="movimentacoes-list-btn-icon">➕</span>
            Nova Movimentação
          </Link>
        </div>
      </header>

      {/* 🔍 SEÇÃO DE FILTROS MODERNIZADA */}
      <section className="movimentacoes-list-filtros-section">
        <div className="movimentacoes-list-section-header">
          <h3>🔍 Filtros e Pesquisa</h3>
          <p>Filtre as movimentações conforme sua necessidade</p>
        </div>
        
        <div className="movimentacoes-list-filtros-grid">
          <div className="movimentacoes-list-filtro-group">
            <label className="movimentacoes-list-filtro-label">Tipo de Movimentação</label>
            <select 
              name="tipo"
              value={filtros.tipo}
              onChange={handleFiltroChange}
              className="movimentacoes-list-filtro-select"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(MOVIMENTACOES_TIPOS).map(([key, value]) => (
                <option key={key} value={key}>{LABELS[key] || value}</option>
              ))}
            </select>
          </div>

          <div className="movimentacoes-list-filtro-group">
            <label className="movimentacoes-list-filtro-label">Item/Equipamento</label>
            <select 
              name="item_id"
              value={filtros.item_id}
              onChange={handleFiltroChange}
              className="movimentacoes-list-filtro-select"
            >
              <option value="">Todos os itens</option>
              {itens.map(item => (
                <option key={item.id} value={item.id}>
                  {item.nome} {item.patrimonio ? `(#${item.patrimonio})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="movimentacoes-list-filtro-group">
            <label className="movimentacoes-list-filtro-label">Data Início</label>
            <input
              type="date"
              name="data_inicio"
              value={filtros.data_inicio}
              onChange={handleFiltroChange}
              className="movimentacoes-list-filtro-input"
            />
          </div>

          <div className="movimentacoes-list-filtro-group">
            <label className="movimentacoes-list-filtro-label">Data Fim</label>
            <input
              type="date"
              name="data_fim"
              value={filtros.data_fim}
              onChange={handleFiltroChange}
              className="movimentacoes-list-filtro-input"
            />
          </div>

          <div className="movimentacoes-list-filtro-actions">
            <button 
              className="movimentacoes-list-btn movimentacoes-list-btn-clear"
              onClick={limparFiltros}
            >
              <span className="movimentacoes-list-btn-icon">🗑️</span>
              Limpar Filtros
            </button>
          </div>
        </div>
      </section>

      {/* 📊 CARDS DE ESTATÍSTICAS MODERNIZADOS */}
      {!error && !loading && (
        <section className="movimentacoes-list-stats-section">
          <div className="movimentacoes-list-stats-grid">
            <div className="movimentacoes-list-stat-card movimentacoes-list-stat-card--total">
              <div className="movimentacoes-list-stat-icon">📋</div>
              <div className="movimentacoes-list-stat-content">
                <span className="movimentacoes-list-stat-number">{movimentacoes.length}</span>
                <span className="movimentacoes-list-stat-label">Total Geral</span>
              </div>
            </div>
            
            <div className="movimentacoes-list-stat-card movimentacoes-list-stat-card--entrada">
              <div className="movimentacoes-list-stat-icon">📥</div>
              <div className="movimentacoes-list-stat-content">
                <span className="movimentacoes-list-stat-number">
                  {movimentacoes.filter(m => m.tipo === 'entrada').length}
                </span>
                <span className="movimentacoes-list-stat-label">Entradas</span>
              </div>
            </div>
            
            <div className="movimentacoes-list-stat-card movimentacoes-list-stat-card--saida">
              <div className="movimentacoes-list-stat-icon">📤</div>
              <div className="movimentacoes-list-stat-content">
                <span className="movimentacoes-list-stat-number">
                  {movimentacoes.filter(m => m.tipo === 'saida').length}
                </span>
                <span className="movimentacoes-list-stat-label">Saídas</span>
              </div>
            </div>
            
            <div className="movimentacoes-list-stat-card movimentacoes-list-stat-card--devolucao">
              <div className="movimentacoes-list-stat-icon">🔄</div>
              <div className="movimentacoes-list-stat-content">
                <span className="movimentacoes-list-stat-number">
                  {movimentacoes.filter(m => m.tipo === 'devolucao').length}
                </span>
                <span className="movimentacoes-list-stat-label">Devoluções</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 📋 TABELA DE MOVIMENTAÇÕES MODERNIZADA */}
      <section className="movimentacoes-list-movimentacoes-section">
        <div className="movimentacoes-list-section-header">
          <h3>📋 Lista de Movimentações</h3>
          <p>{movimentacoes.length} movimentações encontradas</p>
        </div>

        {loading ? (
          <div className="movimentacoes-list-loading-container">
            <Loading size="large" text="Carregando movimentações..." />
          </div>
        ) : error ? (
          renderError()
        ) : movimentacoes.length === 0 ? (
          <div className="movimentacoes-list-empty-state">
            <div className="movimentacoes-list-empty-icon">📋</div>
            <h3>Nenhuma movimentação encontrada</h3>
            <p>Não há movimentações registradas com os filtros atuais.</p>
            <Link to="/movimentacoes/nova" className="movimentacoes-list-btn movimentacoes-list-btn-primary">
              <span className="movimentacoes-list-btn-icon">➕</span>
              Registrar Primeira Movimentação
            </Link>
          </div>
        ) : (
          <div className="movimentacoes-list-table-container">
            <table className="movimentacoes-list-modern-table">
              <thead>
                <tr>
                  <th className="movimentacoes-list-col-tipo">Tipo</th>
                  <th className="movimentacoes-list-col-item">Item</th>
                  <th className="movimentacoes-list-col-quantidade">Qtd</th>
                  <th className="movimentacoes-list-col-destinatario">Destinatário</th>
                  <th className="movimentacoes-list-col-data">Data/Hora</th>
                  <th className="movimentacoes-list-col-usuario">Responsável</th>
                  <th className="movimentacoes-list-col-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map(movimentacao => (
                  <tr key={movimentacao.id} className="movimentacoes-list-table-row">
                    <td className="movimentacoes-list-col-tipo">
                      <span className={`movimentacoes-list-badge movimentacoes-list-badge--${getBadgeVariant(movimentacao.tipo)}`}>
                        <span className="movimentacoes-list-badge-icon">{getIcone(movimentacao.tipo)}</span>
                        <span className="movimentacoes-list-badge-text">{LABELS[movimentacao.tipo] || movimentacao.tipo}</span>
                      </span>
                    </td>
                    <td className="movimentacoes-list-col-item">
                      {renderItemInfo(movimentacao)}
                    </td>
                    <td className="movimentacoes-list-col-quantidade">
                      <span className="movimentacoes-list-quantidade-badge">
                        {movimentacao.quantidade || 0}
                      </span>
                    </td>
                    <td className="movimentacoes-list-col-destinatario">
                      {movimentacao.destinatario ? (
                        <div className="movimentacoes-list-destinatario-info">
                          <strong className="movimentacoes-list-destinatario-nome">{movimentacao.destinatario}</strong>
                          {movimentacao.departamento_destino && (
                            <div className="movimentacoes-list-destinatario-departamento">
                              {movimentacao.departamento_destino}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="movimentacoes-list-text-muted">-</span>
                      )}
                    </td>
                    <td className="movimentacoes-list-col-data">
                      <div className="movimentacoes-list-data-info">
                        <div className="movimentacoes-list-data-hora">{formatarData(movimentacao.data_movimentacao)}</div>
                        {movimentacao.data_devolucao_prevista && (
                          <div className="movimentacoes-list-devolucao-prevista">
                            📅 Prevista: {formatarData(movimentacao.data_devolucao_prevista)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="movimentacoes-list-col-usuario">
                      {renderUsuarioInfo(movimentacao)}
                    </td>
                    <td className="movimentacoes-list-col-acoes">
                      <div className="movimentacoes-list-actions-group">
                        <Link 
                          to={`/movimentacoes/detalhes/${movimentacao.id}`}
                          className="movimentacoes-list-btn movimentacoes-list-btn-sm movimentacoes-list-btn-outline"
                        >
                          <span className="movimentacoes-list-btn-icon">👁️</span>
                          Detalhes
                        </Link>
                        
                        {movimentacao.tipo === 'saida' && (
                          <Link 
                            to={`/movimentacoes/devolucao/${movimentacao.id}`}
                            className="movimentacoes-list-btn movimentacoes-list-btn-sm movimentacoes-list-btn-success"
                          >
                            <span className="movimentacoes-list-btn-icon">🔄</span>
                            Devolver
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default MovimentacoesList;