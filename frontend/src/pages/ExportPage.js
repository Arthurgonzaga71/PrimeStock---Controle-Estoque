import React, { useState, useEffect } from 'react';
import ExportManager from '../components/Export/ExportManager';
import ExportService from '../services/exportService';
import './ExportPage.css';

const ExportPage = () => {
  const [activeTab, setActiveTab] = useState('itens');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [stats, setStats] = useState({});

  // 📥 CARREGAR DADOS
  const loadData = async (type) => {
    setLoading(true);
    try {
      const result = await ExportService.getExportData(type, filters);
      setData(result.data || []);
      
      // Calcular estatísticas
      calculateStats(result.data || [], type);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setData([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // 📊 CALCULAR ESTATÍSTICAS
  const calculateStats = (data, type) => {
    if (type === 'itens') {
      const total = data.length;
      const disponiveis = data.filter(item => item.status === 'disponivel').length;
      const baixoEstoque = data.filter(item => item.quantidade <= item.quantidade_minima).length;
      const valorTotal = data.reduce((sum, item) => sum + ((item.valor || 0) * (item.quantidade || 0)), 0);
      
      setStats({
        total,
        disponiveis,
        baixoEstoque,
        valorTotal
      });
    } else if (type === 'movimentacoes') {
      const total = data.length;
      const entradas = data.filter(m => m.tipo === 'entrada').length;
      const saidas = data.filter(m => m.tipo === 'saida').length;
      
      setStats({
        total,
        entradas,
        saidas
      });
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, filters]);

  // 🎯 TABS
  const tabs = [
    { id: 'itens', label: '📦 Itens', icon: '📦' },
    { id: 'movimentacoes', label: '🔄 Movimentações', icon: '🔄' }
  ];

  // 🎛️ APLICAR FILTROS
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="export-page">
      {/* CABEÇALHO */}
      <div className="page-header">
        <h1>📤 Sistema de Exportação</h1>
        <p>Exporte relatórios em PDF e Excel com dados do sistema</p>
      </div>

      {/* TABS */}
      <div className="tabs-container">
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* FILTROS */}
      <div className="filters-panel">
        <h3>🎛️ Filtros</h3>
        <div className="filters-grid">
          <select 
            className="filter-select"
            onChange={(e) => applyFilters({ ...filters, periodo: e.target.value })}
          >
            <option value="">Todos os períodos</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 3 meses</option>
          </select>
          
          {activeTab === 'itens' && (
            <select 
              className="filter-select"
              onChange={(e) => applyFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Todos os status</option>
              <option value="disponivel">Disponível</option>
              <option value="emprestado">Emprestado</option>
            </select>
          )}
          
          <button 
            className="apply-filters-btn"
            onClick={() => loadData(activeTab)}
          >
            🔄 Aplicar Filtros
          </button>
        </div>
      </div>

      {/* ESTATÍSTICAS */}
      {!loading && Object.keys(stats).length > 0 && (
        <div className="stats-panel">
          <h3>📊 Estatísticas</h3>
          <div className="stats-grid">
            {activeTab === 'itens' ? (
              <>
                <div className="stat-card">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total de Itens</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{color: '#28a745'}}>{stats.disponiveis}</div>
                  <div className="stat-label">Disponíveis</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{color: '#dc3545'}}>{stats.baixoEstoque}</div>
                  <div className="stat-label">Estoque Baixo</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">R$ {stats.valorTotal?.toFixed(2)}</div>
                  <div className="stat-label">Valor Total</div>
                </div>
              </>
            ) : (
              <>
                <div className="stat-card">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Movimentações</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{color: '#28a745'}}>{stats.entradas}</div>
                  <div className="stat-label">Entradas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{color: '#dc3545'}}>{stats.saidas}</div>
                  <div className="stat-label">Saídas</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* GERENCIADOR DE EXPORTAÇÃO */}
      <ExportManager
        data={data}
        type={activeTab}
        filters={filters}
        title={`Exportar ${tabs.find(t => t.id === activeTab)?.label}`}
        onExportStart={() => console.log('🔄 Iniciando exportação...')}
        onExportComplete={(result) => {
          console.log('✅ Exportação concluída:', result);
          // Recarregar dados após exportação
          setTimeout(() => loadData(activeTab), 1000);
        }}
        onExportError={(error) => {
          console.error('❌ Erro na exportação:', error);
        }}
      />

      {/* PRÉ-VISUALIZAÇÃO DOS DADOS */}
      {!loading && (
        <div className="preview-panel">
          <h3>👀 Pré-visualização dos Dados</h3>
          <div className="preview-content">
            {data.length > 0 ? (
              <div className="data-preview">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {activeTab === 'itens' ? (
                        <>
                          <th>Nome</th>
                          <th>Categoria</th>
                          <th>Quantidade</th>
                          <th>Status</th>
                        </>
                      ) : (
                        <>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Item</th>
                          <th>Quantidade</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((item, index) => (
                      <tr key={index}>
                        {activeTab === 'itens' ? (
                          <>
                            <td>{item.nome}</td>
                            <td>{item.categoria?.nome}</td>
                            <td>{item.quantidade}</td>
                            <td>
                              <span className={`status-badge status-${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{new Date(item.data_movimentacao).toLocaleDateString('pt-BR')}</td>
                            <td>
                              <span className={`type-badge type-${item.tipo}`}>
                                {item.tipo}
                              </span>
                            </td>
                            <td>{item.item?.nome}</td>
                            <td>{item.quantidade}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 5 && (
                  <div className="preview-more">
                    ... e mais {data.length - 5} registros
                  </div>
                )}
              </div>
            ) : (
              <div className="no-data">
                📭 Nenhum dado encontrado com os filtros aplicados
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando dados...</p>
        </div>
      )}
    </div>
  );
};

export default ExportPage;