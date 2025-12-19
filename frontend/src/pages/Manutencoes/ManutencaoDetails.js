// src/pages/Manutencoes/ManutencaoDetails.js - CRIE ESTE ARQUIVO
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { manutencoesService } from '../../services/api';
import { Loading } from '../../components/UI';
import { LABELS, STATUS_MANUTENCAO_CONFIG, MANUTENCOES_CONFIG } from '../../utils/constants';
import './ManutencaoDetails.css';
const ManutencaoDetails = () => {
  const { id } = useParams();
  const [manutencao, setManutencao] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarManutencao = async () => {
      try {
        const response = await manutencoesService.getById(id);
        if (response.data.success) {
          setManutencao(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar manutenção:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarManutencao();
  }, [id]);

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loading size="large" text="Carregando detalhes da manutenção..." />
      </div>
    );
  }

  if (!manutencao) {
    return (
      <div className="not-found">
        <h1>Manutenção não encontrada</h1>
        <p>A manutenção solicitada não existe.</p>
        <Link to="/manutencoes" className="btn btn--primary">
          Voltar à Lista
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* 🎯 CABEÇALHO */}
      <header className="page-header">
        <div className="header-content">
          <h1>🔧 Detalhes da Manutenção</h1>
          <p>Informações completas da manutenção #{manutencao.id}</p>
        </div>
        
        <div className="header-actions">
          <Link to="/manutencoes" className="btn btn--secondary">
            ← Voltar à Lista
          </Link>
          <Link to={`/manutencoes/editar/${manutencao.id}`} className="btn btn--primary">
            ✏️ Editar
          </Link>
        </div>
      </header>

      {/* 📋 DETALHES DA MANUTENÇÃO */}
      <div className="details-grid">
        {/* STATUS E TIPO */}
        <div className="detail-card">
          <h3>Status e Tipo</h3>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className={`badge badge--${manutencao.status === 'aberta' ? 'danger' : 
                                         manutencao.status === 'em_andamento' ? 'warning' : 
                                         manutencao.status === 'concluida' ? 'success' : 'secondary'}`}>
              {STATUS_MANUTENCAO_CONFIG[manutencao.status]?.icone} 
              {LABELS[manutencao.status]}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Tipo:</span>
            <span className={`badge badge--${manutencao.tipo_manutencao === 'preventiva' ? 'success' : 
                                         manutencao.tipo_manutencao === 'corretiva' ? 'danger' : 'primary'}`}>
              {MANUTENCOES_CONFIG[manutencao.tipo_manutencao]?.icone}
              {LABELS[manutencao.tipo_manutencao]}
            </span>
          </div>
        </div>

        {/* INFORMAÇÕES DO ITEM */}
        <div className="detail-card">
          <h3>Item em Manutenção</h3>
          <div className="detail-row">
            <span className="label">Nome:</span>
            <span className="value">{manutencao.item?.nome}</span>
          </div>
          {manutencao.item?.patrimonio && (
            <div className="detail-row">
              <span className="label">Patrimônio:</span>
              <span className="value">{manutencao.item.patrimonio}</span>
            </div>
          )}
          {manutencao.item?.numero_serie && (
            <div className="detail-row">
              <span className="label">Nº Série:</span>
              <span className="value">{manutencao.item.numero_serie}</span>
            </div>
          )}
        </div>

        {/* DATAS */}
        <div className="detail-card">
          <h3>Datas</h3>
          <div className="detail-row">
            <span className="label">Data Abertura:</span>
            <span className="value">{formatarData(manutencao.data_abertura)}</span>
          </div>
          {manutencao.data_conclusao && (
            <div className="detail-row">
              <span className="label">Data Conclusão:</span>
              <span className="value">{formatarData(manutencao.data_conclusao)}</span>
            </div>
          )}
        </div>

        {/* TÉCNICO RESPONSÁVEL */}
        <div className="detail-card">
          <h3>Técnico Responsável</h3>
          <div className="detail-row">
            <span className="label">Nome:</span>
            <span className="value">{manutencao.tecnico?.nome}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{manutencao.tecnico?.email}</span>
          </div>
        </div>

        {/* DESCRIÇÃO DO PROBLEMA */}
        <div className="detail-card full-width">
          <h3>Descrição do Problema</h3>
          <div className="detail-content">
            <p>{manutencao.descricao_problema || 'Nenhuma descrição fornecida.'}</p>
          </div>
        </div>

        {/* SOLUÇÃO APLICADA */}
        {manutencao.descricao_solucao && (
          <div className="detail-card full-width">
            <h3>Solução Aplicada</h3>
            <div className="detail-content">
              <p>{manutencao.descricao_solucao}</p>
            </div>
          </div>
        )}

        {/* INFORMAÇÕES ADICIONAIS */}
        <div className="detail-card">
          <h3>Informações Adicionais</h3>
          {manutencao.custo_manutencao && (
            <div className="detail-row">
              <span className="label">Custo:</span>
              <span className="value">
                R$ {parseFloat(manutencao.custo_manutencao).toFixed(2)}
              </span>
            </div>
          )}
          {manutencao.fornecedor_manutencao && (
            <div className="detail-row">
              <span className="label">Fornecedor:</span>
              <span className="value">{manutencao.fornecedor_manutencao}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManutencaoDetails;