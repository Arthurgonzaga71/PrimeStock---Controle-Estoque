// src/pages/Movimentacoes/MovimentacoesDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movimentacoesService } from '../../services/api';
import { Button, Loading } from '../../components/UI';
import { MOVIMENTACOES_CONFIG, LABELS, MOVIMENTACOES_ESTATISTICAS } from '../../utils/constants';
import './MovimentacoesDashboard.css'; // Novo arquivo CSS

const MovimentacoesDashboard = () => {
  const [estatisticas, setEstatisticas] = useState(null);
  const [recentes, setRecentes] = useState([]);
  const [atrasados, setAtrasados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // 📊 CARREGAR DADOS DO DASHBOARD
  const carregarDashboard = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      const responseEstatisticas = await movimentacoesService.getEstatisticas();
      if (responseEstatisticas.data.success) {
        setEstatisticas(responseEstatisticas.data.data);
      }
      
      // Carregar movimentações recentes
      const responseRecentes = await movimentacoesService.getRecentes();
      if (responseRecentes.data.success) {
        setRecentes(responseRecentes.data.data);
      }
      
      // Carregar itens atrasados
      const responseAtrasados = await movimentacoesService.getAtrasados();
      if (responseAtrasados.data.success) {
        setAtrasados(responseAtrasados.data.data);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 ATUALIZAR DADOS
  const handleAtualizar = async () => {
    setAtualizando(true);
    await carregarDashboard();
    setAtualizando(false);
  };

  useEffect(() => {
    carregarDashboard();
  }, []);

  const getIcone = (tipo) => {
    return MOVIMENTACOES_CONFIG[tipo]?.icone || '📋';
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="movimentacoes-dashboard-page-loading">
        <Loading size="large" text="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="movimentacoes-dashboard-container">
      {/* 🎯 CABEÇALHO */}
      <header className="movimentacoes-dashboard-header">
        <div className="movimentacoes-dashboard-header-content">
          <h1>📊 Dashboard de Movimentações</h1>
          <p>Visão geral das movimentações do sistema</p>
        </div>
        
        <div className="movimentacoes-dashboard-header-actions">
          <Button 
            variant="secondary" 
            onClick={handleAtualizar}
            loading={atualizando}
            className="movimentacoes-dashboard-btn movimentacoes-dashboard-btn--outline"
          >
            🔄 Atualizar
          </Button>
          <Link to="/movimentacoes" className="movimentacoes-dashboard-btn movimentacoes-dashboard-btn--primary">
            📋 Ver Todas
          </Link>
        </div>
      </header>

      {/* 📈 CARDS DE ESTATÍSTICAS */}
      <section className="movimentacoes-dashboard-cards">
        <div className="movimentacoes-dashboard-card movimentacoes-dashboard-estatistica-card">
          <div className="movimentacoes-dashboard-card-icon">📊</div>
          <div className="movimentacoes-dashboard-card-content">
            <span className="movimentacoes-dashboard-card-number">
              {estatisticas?.movimentacoes_mes || 0}
            </span>
            <span className="movimentacoes-dashboard-card-label">Movimentações no Mês</span>
          </div>
        </div>
        
        <div className="movimentacoes-dashboard-card movimentacoes-dashboard-saidas-card">
          <div className="movimentacoes-dashboard-card-icon">📤</div>
          <div className="movimentacoes-dashboard-card-content">
            <span className="movimentacoes-dashboard-card-number">
              {estatisticas?.saidas_mes || 0}
            </span>
            <span className="movimentacoes-dashboard-card-label">Saídas no Mês</span>
          </div>
        </div>
        
        <div className="movimentacoes-dashboard-card movimentacoes-dashboard-atrasos-card">
          <div className="movimentacoes-dashboard-card-icon">⚠️</div>
          <div className="movimentacoes-dashboard-card-content">
            <span className="movimentacoes-dashboard-card-number">
              {estatisticas?.atrasados || 0}
            </span>
            <span className="movimentacoes-dashboard-card-label">Devoluções Atrasadas</span>
          </div>
        </div>
        
        <div className="movimentacoes-dashboard-card movimentacoes-dashboard-tipos-card">
          <div className="movimentacoes-dashboard-card-icon">📋</div>
          <div className="movimentacoes-dashboard-card-content">
            <span className="movimentacoes-dashboard-card-number">
              {estatisticas?.por_tipo?.length || 0}
            </span>
            <span className="movimentacoes-dashboard-card-label">Tipos de Movimentação</span>
          </div>
        </div>
      </section>

      <div className="movimentacoes-dashboard-grid">
        {/* 📤 MOVIMENTAÇÕES RECENTES */}
        <section className="movimentacoes-dashboard-section">
          <div className="movimentacoes-dashboard-section-header">
            <h3>📤 Movimentações Recentes</h3>
            <Link to="/movimentacoes" className="movimentacoes-dashboard-btn movimentacoes-dashboard-btn--sm movimentacoes-dashboard-btn--outline">
              Ver Todas
            </Link>
          </div>
          
          <div className="movimentacoes-dashboard-recentes-list">
            {recentes.length === 0 ? (
              <div className="movimentacoes-dashboard-empty-state-small">
                <p>Nenhuma movimentação recente</p>
              </div>
            ) : (
              recentes.map(mov => (
                <div key={mov.id} className="movimentacoes-dashboard-movimentacao-recente">
                  <div className="movimentacoes-dashboard-movimentacao-icon">
                    {getIcone(mov.tipo)}
                  </div>
                  <div className="movimentacoes-dashboard-movimentacao-info">
                    <div className="movimentacoes-dashboard-movimentacao-titulo">
                      <strong>{mov.item?.nome}</strong>
                      <span className={`movimentacoes-dashboard-tipo-badge movimentacoes-dashboard-tipo-${mov.tipo}`}>
                        {LABELS[mov.tipo]}
                      </span>
                    </div>
                    <div className="movimentacoes-dashboard-movimentacao-detalhes">
                      <span>Qtd: {mov.quantidade}</span>
                      <span>•</span>
                      <span>{formatarData(mov.data_movimentacao)}</span>
                      {mov.destinatario && (
                        <>
                          <span>•</span>
                          <span>Para: {mov.destinatario}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ⚠️ DEVOLUÇÕES ATRASADAS */}
        <section className="movimentacoes-dashboard-section movimentacoes-dashboard-atrasados-section">
          <div className="movimentacoes-dashboard-section-header">
            <h3>⚠️ Devoluções Atrasadas</h3>
            <span className="movimentacoes-dashboard-badge movimentacoes-dashboard-badge--danger">
              {atrasados.length}
            </span>
          </div>
          
          <div className="movimentacoes-dashboard-atrasados-list">
            {atrasados.length === 0 ? (
              <div className="movimentacoes-dashboard-empty-state-small success">
                <p>🎉 Nenhuma devolução atrasada!</p>
              </div>
            ) : (
              atrasados.map(mov => (
                <div key={mov.id} className="movimentacoes-dashboard-atrasado-item">
                  <div className="movimentacoes-dashboard-atrasado-header">
                    <strong>{mov.item?.nome}</strong>
                    <span className="movimentacoes-dashboard-dias-atraso">
                      {mov.dias_atraso} dias
                    </span>
                  </div>
                  <div className="movimentacoes-dashboard-atrasado-detalhes">
                    <div>
                      <span>Com: {mov.destinatario}</span>
                      <span>•</span>
                      <span>{mov.departamento_destino}</span>
                    </div>
                    <div className="movimentacoes-dashboard-atrasado-data">
                      Deveria voltar: {formatarData(mov.data_devolucao_prevista)}
                    </div>
                  </div>
                  <div className="movimentacoes-dashboard-atrasado-actions">
                    <Link 
                      to={`/movimentacoes/devolucao/${mov.id}`}
                      className="movimentacoes-dashboard-btn movimentacoes-dashboard-btn--sm movimentacoes-dashboard-btn--success"
                    >
                      🔄 Devolver
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 📈 ESTATÍSTICAS POR TIPO */}
        <section className="movimentacoes-dashboard-section">
          <div className="movimentacoes-dashboard-section-header">
            <h3>📈 Distribuição por Tipo</h3>
          </div>
          
          <div className="movimentacoes-dashboard-tipos-estatisticas">
            {estatisticas?.por_tipo?.length === 0 ? (
              <div className="movimentacoes-dashboard-empty-state-small">
                <p>Nenhuma estatística disponível</p>
              </div>
            ) : (
              estatisticas.por_tipo.map(stat => (
                <div key={stat.tipo} className="movimentacoes-dashboard-tipo-stat">
                  <div className="movimentacoes-dashboard-tipo-info">
                    <span className="movimentacoes-dashboard-tipo-icon">
                      {getIcone(stat.tipo)}
                    </span>
                    <span className="movimentacoes-dashboard-tipo-label">
                      {LABELS[stat.tipo]}
                    </span>
                  </div>
                  <div className="movimentacoes-dashboard-tipo-valor">
                    {stat.total} movimentações
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 🚀 AÇÕES RÁPIDAS */}
        <section className="movimentacoes-dashboard-section">
          <div className="movimentacoes-dashboard-section-header">
            <h3>🚀 Ações Rápidas</h3>
          </div>
          
          <div className="movimentacoes-dashboard-acoes-rapidas">
            <Link to="/movimentacoes/registrar-saida" className="movimentacoes-dashboard-acao-rapida">
              <div className="movimentacoes-dashboard-acao-icon">📤</div>
              <div className="movimentacoes-dashboard-acao-content">
                <strong>Registrar Saída</strong>
                <p>Registrar saída de equipamento</p>
              </div>
            </Link>
            
            <Link to="/movimentacoes/nova" className="movimentacoes-dashboard-acao-rapida">
              <div className="movimentacoes-dashboard-acao-icon">➕</div>
              <div className="movimentacoes-dashboard-acao-content">
                <strong>Nova Movimentação</strong>
                <p>Outros tipos de movimentação</p>
              </div>
            </Link>
            
            <Link to="/itens" className="movimentacoes-dashboard-acao-rapida">
              <div className="movimentacoes-dashboard-acao-icon">📦</div>
              <div className="movimentacoes-dashboard-acao-content">
                <strong>Gerenciar Itens</strong>
                <p>Ver todos os itens</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MovimentacoesDashboard;