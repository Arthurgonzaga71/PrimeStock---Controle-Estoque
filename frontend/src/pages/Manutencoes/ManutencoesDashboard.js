// src/pages/Manutencoes/ManutencoesDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { manutencoesService } from '../../services/api';
import { Button, Loading } from '../../components/UI';
import { MANUTENCOES_CONFIG, STATUS_MANUTENCAO_CONFIG, LABELS } from '../../utils/constants';
import './Manutencoes.css';

const ManutencoesDashboard = () => {
  const [estatisticas, setEstatisticas] = useState(null);
  const [manutencoesAbertas, setManutencoesAbertas] = useState([]);
  const [manutencoesRecentes, setManutencoesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // 📊 CARREGAR DADOS DO DASHBOARD
  const carregarDashboard = async () => {
    try {
      setLoading(true);
      
      // Carregar todas as manutenções para estatísticas
      const responseManutencoes = await manutencoesService.getAll();
      if (responseManutencoes.data.success) {
        const todasManutencoes = responseManutencoes.data.data;
        
        // Calcular estatísticas
        const stats = {
          total: todasManutencoes.length,
          abertas: todasManutencoes.filter(m => m.status === 'aberta').length,
          em_andamento: todasManutencoes.filter(m => m.status === 'em_andamento').length,
          concluidas: todasManutencoes.filter(m => m.status === 'concluida').length,
          por_tipo: {
            preventiva: todasManutencoes.filter(m => m.tipo_manutencao === 'preventiva').length,
            corretiva: todasManutencoes.filter(m => m.tipo_manutencao === 'corretiva').length,
            instalacao: todasManutencoes.filter(m => m.tipo_manutencao === 'instalacao').length
          }
        };
        
        setEstatisticas(stats);
        setManutencoesAbertas(todasManutencoes.filter(m => m.status === 'aberta'));
        setManutencoesRecentes(todasManutencoes.slice(0, 5)); // 5 mais recentes
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
    return MANUTENCOES_CONFIG[tipo]?.icone || '🔧';
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const calcularDiasAberto = (dataAbertura) => {
    const abertura = new Date(dataAbertura);
    const agora = new Date();
    const diffMs = agora - abertura;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Loading size="large" text="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="manutencoes-page">
      {/* 🎯 CABEÇALHO */}
      <header className="page-header">
        <div className="header-content">
          <h1>📊 Dashboard de Manutenções</h1>
          <p>Visão geral das manutenções do sistema</p>
        </div>
        
        <div className="header-actions">
          <Button 
            variant="secondary" 
            onClick={handleAtualizar}
            loading={atualizando}
            className="btn--outline"
          >
            🔄 Atualizar
          </Button>
          <Link to="/manutencoes" className="btn btn--primary">
            📋 Ver Todas
          </Link>
        </div>
      </header>

      {/* 📈 CARDS DE ESTATÍSTICAS */}
      <section className="dashboard-cards">
        <div className="dashboard-card total-card">
          <div className="card-icon">🔧</div>
          <div className="card-content">
            <span className="card-number">
              {estatisticas?.total || 0}
            </span>
            <span className="card-label">Total de Manutenções</span>
          </div>
        </div>
        
        <div className="dashboard-card abertas-card">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <span className="card-number">
              {estatisticas?.abertas || 0}
            </span>
            <span className="card-label">Abertas</span>
          </div>
        </div>
        
        <div className="dashboard-card andamento-card">
          <div className="card-icon">🔧</div>
          <div className="card-content">
            <span className="card-number">
              {estatisticas?.em_andamento || 0}
            </span>
            <span className="card-label">Em Andamento</span>
          </div>
        </div>
        
        <div className="dashboard-card concluidas-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <span className="card-number">
              {estatisticas?.concluidas || 0}
            </span>
            <span className="card-label">Concluídas</span>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        {/* ⚠️ MANUTENÇÕES ABERTAS URGENTES */}
        <section className="dashboard-section urgentes-section">
          <div className="section-header">
            <h3>⚠️ Manutenções Abertas</h3>
            <span className="badge badge--danger">
              {manutencoesAbertas.length}
            </span>
          </div>
          
          <div className="urgentes-list">
            {manutencoesAbertas.length === 0 ? (
              <div className="empty-state-small success">
                <p>🎉 Nenhuma manutenção aberta!</p>
              </div>
            ) : (
              manutencoesAbertas.map(manutencao => (
                <div key={manutencao.id} className="urgente-item">
                  <div className="urgente-header">
                    <div className="urgente-info">
                      <strong>{manutencao.item?.nome}</strong>
                      <span className="tipo-badge">
                        {getIcone(manutencao.tipo_manutencao)} {LABELS[manutencao.tipo_manutencao]}
                      </span>
                    </div>
                    <span className="dias-aberto">
                      {calcularDiasAberto(manutencao.data_abertura)} dias
                    </span>
                  </div>
                  
                  <div className="urgente-detalhes">
                    <div className="problema-resumo">
                      {manutencao.descricao_problema?.length > 60 
                        ? `${manutencao.descricao_problema.substring(0, 60)}...`
                        : manutencao.descricao_problema
                      }
                    </div>
                    
                    <div className="urgente-prioridade">
                      <span className={`prioridade-badge prioridade-${manutencao.prioridade}`}>
                        {LABELS[manutencao.prioridade]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="urgente-actions">
                    
                    <Link 
                      to={`/manutencoes/editar/${manutencao.id}`}
                      className="btn btn--sm btn--primary"
                    >
                      ✏️ Editar
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 📋 MANUTENÇÕES RECENTES */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>📋 Manutenções Recentes</h3>
            <Link to="/manutencoes" className="btn btn--sm btn--outline">
              Ver Todas
            </Link>
          </div>
          
          <div className="recentes-list">
            {manutencoesRecentes.length === 0 ? (
              <div className="empty-state-small">
                <p>Nenhuma manutenção recente</p>
              </div>
            ) : (
              manutencoesRecentes.map(manutencao => (
                <div key={manutencao.id} className="manutencao-recente">
                  <div className="manutencao-icon">
                    {getIcone(manutencao.tipo_manutencao)}
                  </div>
                  <div className="manutencao-info">
                    <div className="manutencao-titulo">
                      <strong>{manutencao.item?.nome}</strong>
                      <span className={`status-badge status-${manutencao.status}`}>
                        {STATUS_MANUTENCAO_CONFIG[manutencao.status]?.icone}
                        {LABELS[manutencao.status]}
                      </span>
                    </div>
                    <div className="manutencao-detalhes">
                      <span>{formatarData(manutencao.data_abertura)}</span>
                      <span>•</span>
                      <span>Por: {manutencao.tecnico?.nome}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 📊 DISTRIBUIÇÃO POR TIPO */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>📊 Distribuição por Tipo</h3>
          </div>
          
          <div className="tipos-estatisticas">
            {!estatisticas?.por_tipo ? (
              <div className="empty-state-small">
                <p>Nenhuma estatística disponível</p>
              </div>
            ) : (
              <>
                <div className="tipo-stat">
                  <div className="tipo-info">
                    <span className="tipo-icon">🛡️</span>
                    <span className="tipo-label">Preventivas</span>
                  </div>
                  <div className="tipo-valor">
                    {estatisticas.por_tipo.preventiva || 0}
                  </div>
                </div>
                
                <div className="tipo-stat">
                  <div className="tipo-info">
                    <span className="tipo-icon">🔧</span>
                    <span className="tipo-label">Corretivas</span>
                  </div>
                  <div className="tipo-valor">
                    {estatisticas.por_tipo.corretiva || 0}
                  </div>
                </div>
                
                <div className="tipo-stat">
                  <div className="tipo-info">
                    <span className="tipo-icon">💻</span>
                    <span className="tipo-label">Instalações</span>
                  </div>
                  <div className="tipo-valor">
                    {estatisticas.por_tipo.instalacao || 0}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 🚀 AÇÕES RÁPIDAS */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>🚀 Ações Rápidas</h3>
          </div>
          
          <div className="acoes-rapidas">
            <Link to="/manutencoes/registrar" className="acao-rapida">
              <div className="acao-icon">🔧</div>
              <div className="acao-content">
                <strong>Nova Manutenção</strong>
                <p>Registro rápido</p>
              </div>
            </Link>
            
            <Link to="/manutencoes/nova" className="acao-rapida">
              <div className="acao-icon">📝</div>
              <div className="acao-content">
                <strong>Manutenção Detalhada</strong>
                <p>Formulário completo</p>
              </div>
            </Link>
            
            <Link to="/itens" className="acao-rapida">
              <div className="acao-icon">📦</div>
              <div className="acao-content">
                <strong>Ver Itens</strong>
                <p>Gerenciar equipamentos</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManutencoesDashboard;