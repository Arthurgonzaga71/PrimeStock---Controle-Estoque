// src/pages/Manutencoes/ManutencoesList.js - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { manutencoesService, itensService } from '../../services/api';
import { Button, Loading } from '../../components/UI';
import { TIPO_MANUTENCAO, STATUS_MANUTENCAO, LABELS, MANUTENCOES_CONFIG, STATUS_MANUTENCAO_CONFIG } from '../../utils/constants';
import './Manutencoes.css';
import ExportManutencoesButton from '../../components/ExportManutencoesButton';

const ManutencoesList = () => {
  const [manutencoes, setManutencoes] = useState([]);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    status: '',
    item_id: '',
    data_inicio: '',
    data_fim: ''
  });

  // Carregar manutenções
  const carregarManutencoes = async () => {
    try {
      setLoading(true);
      const response = await manutencoesService.getAll(filtros);
      if (response.data.success) {
        setManutencoes(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar itens para filtro
  const carregarItens = async () => {
    try {
      const response = await itensService.getAll({ limit: 100 });
      if (response.data.success) {
        setItens(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  useEffect(() => {
    carregarManutencoes();
    carregarItens();
  }, [filtros]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const limparFiltros = () => {
    setFiltros({
      tipo: '',
      status: '',
      item_id: '',
      data_inicio: '',
      data_fim: ''
    });
  };

  const getBadgeVariant = (status) => {
    const variants = {
      aberta: 'danger',
      em_andamento: 'warning',
      concluida: 'success',
      cancelada: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const getTipoBadgeVariant = (tipo) => {
    const variants = {
      preventiva: 'success',
      corretiva: 'danger',
      instalacao: 'primary'
    };
    return variants[tipo] || 'secondary';
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const calcularTempoDecorrido = (dataAbertura) => {
    const abertura = new Date(dataAbertura);
    const agora = new Date();
    const diffMs = agora - abertura;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) return 'Hoje';
    if (diffDias === 1) return '1 dia';
    return `${diffDias} dias`;
  };

  return (
    <div className="manutencoes-page">
      {/* 🎯 CABEÇALHO */}
      <header className="page-header">
        <div className="header-content">
          <h1>🛠️ Histórico de Manutenções</h1>
          <p>Controle de manutenções preventivas e corretivas</p>
        </div>
        
        <div className="header-actions">
          <Link to="/manutencoes/registrar" className="btn btn--warning">
            🔧 Nova Manutenção
          </Link>
          <Link to="/manutencoes/dashboard" className="btn btn--primary">
            📊 Dashboard
          </Link>
        </div>
      </header>

      {/* 🔍 FILTROS */}
      <section className="filtros-section">
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Tipo</label>
            <select 
              name="tipo"
              value={filtros.tipo}
              onChange={handleFiltroChange}
            >
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO_MANUTENCAO).map(([key, value]) => (
                <option key={key} value={value}>{LABELS[value]}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Status</label>
            <select 
              name="status"
              value={filtros.status}
              onChange={handleFiltroChange}
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_MANUTENCAO).map(([key, value]) => (
                <option key={key} value={value}>{LABELS[value]}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Item</label>
            <select 
              name="item_id"
              value={filtros.item_id}
              onChange={handleFiltroChange}
            >
              <option value="">Todos os itens</option>
              {itens.map(item => (
                <option key={item.id} value={item.id}>
                  {item.nome} {item.patrimonio ? `(${item.patrimonio})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Data Início</label>
            <input
              type="date"
              name="data_inicio"
              value={filtros.data_inicio}
              onChange={handleFiltroChange}
            />
          </div>

          <div className="filtro-group">
            <label>Data Fim</label>
            <input
              type="date"
              name="data_fim"
              value={filtros.data_fim}
              onChange={handleFiltroChange}
            />
          </div>

          <div className="filtro-actions">
            <Button 
              variant="secondary" 
              onClick={limparFiltros}
              className="btn btn--limpar"
            >
              🗑️ Limpar
            </Button>
          </div>
        </div>
      </section>

      {/* 📊 ESTATÍSTICAS RÁPIDAS */}
      <section className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className="stat-number">
              {manutencoes.filter(m => m.status === 'aberta').length}
            </span>
            <span className="stat-label">Abertas</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <span className="stat-number">
              {manutencoes.filter(m => m.status === 'em_andamento').length}
            </span>
            <span className="stat-label">Em Andamento</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-number">
              {manutencoes.filter(m => m.status === 'concluida').length}
            </span>
            <span className="stat-label">Concluídas</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <span className="stat-number">{manutencoes.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </section>
      <div className="header-actions">
  
 
  
</div>

      {/* 📋 LISTA DE MANUTENÇÕES */}
      <section className="manutencoes-list">
        {loading ? (
          <div className="loading-container">
            <Loading size="large" text="Carregando manutenções..." />
          </div>
        ) : manutencoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔧</div>
            <h3>Nenhuma manutenção encontrada</h3>
            <p>Não há manutenções registradas com os filtros atuais.</p>
            <Link to="/manutencoes/registrar" className="btn btn--primary">
              🔧 Registrar Primeira Manutenção
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th>Problema</th>
                  <th>Técnico</th>
                  <th>Data Abertura</th>
                  <th>Tempo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {manutencoes.map(manutencao => (
                  <tr key={manutencao.id}>
                    <td>
                      <span className={`badge badge--${getBadgeVariant(manutencao.status)}`}>
                        {STATUS_MANUTENCAO_CONFIG[manutencao.status]?.icone} 
                        {LABELS[manutencao.status]}
                      </span>
                    </td>
                    <td>
                      <div className="item-info">
                        <strong>{manutencao.item?.nome}</strong>
                        {manutencao.item?.patrimonio && (
                          <span className="item-patrimonio">
                            {manutencao.item.patrimonio}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge--${getTipoBadgeVariant(manutencao.tipo_manutencao)}`}>
                        {MANUTENCOES_CONFIG[manutencao.tipo_manutencao]?.icone}
                        {LABELS[manutencao.tipo_manutencao]}
                      </span>
                    </td>
                    <td>
                      <div className="problema-info">
                        {manutencao.descricao_problema ? (
                          <span title={manutencao.descricao_problema}>
                            {manutencao.descricao_problema.length > 50 
                              ? `${manutencao.descricao_problema.substring(0, 50)}...`
                              : manutencao.descricao_problema
                            }
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="tecnico-info">
                        <strong>{manutencao.tecnico?.nome}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="data-info">
                        {formatarData(manutencao.data_abertura)}
                      </div>
                    </td>
                    <td>
                      <div className="tempo-info">
                        {manutencao.status !== 'concluida' && (
                          <span className="tempo-decorrido">
                            {calcularTempoDecorrido(manutencao.data_abertura)}
                          </span>
                        )}
                        {manutencao.data_conclusao && (
                          <span className="data-conclusao">
                            Concluída: {formatarData(manutencao.data_conclusao)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        {/* 🔥 CORREÇÃO CRÍTICA: URL CORRETA */}
                        <Link 
                          to={`/manutencoes/detalhes/${manutencao.id}`}
                          className="btn btn--sm btn--outline"
                        >
                          👁️ Detalhes
                        </Link>
                        
                        {manutencao.status === 'aberta' && (
                          <Link 
                            to={`/manutencoes/editar/${manutencao.id}`}
                            className="btn btn--sm btn--primary"
                          >
                            ✏️ Editar
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

export default ManutencoesList;