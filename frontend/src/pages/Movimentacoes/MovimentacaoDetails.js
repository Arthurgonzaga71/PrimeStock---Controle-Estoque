// src/pages/Movimentacoes/MovimentacaoDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { movimentacoesService } from '../../services/api';
// CORREÇÃO: Importe os componentes pelo caminho correto
import Button from '../../components/UI/Button/Button';
import Loading from '../../components/UI/Loading/Loading';
// Se não tem Modal, use um modal simples ou crie um
import { MOVIMENTACOES_CONFIG, LABELS } from '../../utils/constants';
import './MovimentacaoDetails.css';

// 🔥 Crie um Modal simples se não existir
const SimpleModal = ({ isOpen, onClose, children, title, size = 'md' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="simple-modal-overlay" onClick={onClose}>
      <div 
        className={`simple-modal simple-modal--${size}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="simple-modal-header">
          <h3>{title}</h3>
          <button className="simple-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="simple-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const MovimentacaoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [movimentacao, setMovimentacao] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 📋 CARREGAR DETALHES DA MOVIMENTAÇÃO
  useEffect(() => {
    const carregarMovimentacao = async () => {
      try {
        setLoading(true);
        const response = await movimentacoesService.getById(id);
        
        if (response.data.success) {
          setMovimentacao(response.data.data);
        } else {
          setError('Movimentação não encontrada');
        }
      } catch (error) {
        console.error('Erro ao carregar movimentação:', error);
        setError('Erro ao carregar dados da movimentação');
      } finally {
        setLoading(false);
      }
    };

    carregarMovimentacao();
  }, [id]);

  // 🗑️ FUNÇÃO PARA EXCLUIR MOVIMENTAÇÃO
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await movimentacoesService.delete(id);
      
      if (response.data.success) {
        // Mostrar mensagem de sucesso
        alert('Movimentação excluída com sucesso!');
        // Redirecionar para lista
        navigate('/movimentacoes');
      } else {
        setError(response.data.message || 'Erro ao excluir movimentação');
      }
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error);
      setError('Erro ao excluir movimentação. Tente novamente.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getIcone = (tipo) => {
    return MOVIMENTACOES_CONFIG[tipo]?.icone || '📋';
  };

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const formatarDataSimples = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  // Verificar se a devolução está atrasada
  const isDevolucaoAtrasada = () => {
    if (!movimentacao?.data_devolucao_prevista) return false;
    const hoje = new Date();
    const dataDevolucao = new Date(movimentacao.data_devolucao_prevista);
    return hoje > dataDevolucao && movimentacao.tipo === 'saida';
  };

  // 🔥 VERIFICAR SE PODE EXCLUIR (apenas movimentações recentes)
  const podeExcluir = () => {
    if (!movimentacao) return false;
    
    const dataMovimentacao = new Date(movimentacao.data_movimentacao);
    const hoje = new Date();
    const diferencaHoras = (hoje - dataMovimentacao) / (1000 * 60 * 60);
    
    // Permite exclusão apenas nas primeiras 24 horas
    return diferencaHoras <= 24;
  };

  if (loading) {
    return (
      <div className="movimentacao-details-page-loading">
        <Loading size="large" text="Carregando detalhes da movimentação..." />
      </div>
    );
  }

  if (error || !movimentacao) {
    return (
      <div className="movimentacao-details-container">
        <header className="movimentacao-details-header">
          <div className="movimentacao-details-header-content">
            <h1>❌ Erro</h1>
            <p>Não foi possível carregar a movimentação</p>
          </div>
          <Link to="/movimentacoes" className="movimentacao-details-btn movimentacao-details-btn--back">
            ← Voltar para Lista
          </Link>
        </header>
        
        <div className="movimentacao-details-alert">
          <div className="movimentacao-details-alert-content">
            <strong>Erro:</strong> {error || 'Movimentação não encontrada'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="movimentacao-details-container">
      {/* 🎯 CABEÇALHO */}
      <header className="movimentacao-details-header">
        <div className="movimentacao-details-header-content">
          <h1>
            {getIcone(movimentacao.tipo)} Detalhes da Movimentação
          </h1>
          <p>Informações completas sobre esta movimentação</p>
        </div>
        
        <div className="movimentacao-details-header-actions">
          <Link to="/movimentacoes" className="movimentacao-details-btn movimentacao-details-btn--back">
            ← Voltar para Lista
          </Link>
          
          {movimentacao.tipo === 'saida' && (
            <Link 
              to={`/movimentacoes/devolucao/${movimentacao.id}`}
              className="movimentacao-details-btn movimentacao-details-btn--success"
            >
              🔄 Registrar Devolução
            </Link>
          )}
        </div>
      </header>

      {/* 📋 DETALHES DA MOVIMENTAÇÃO */}
      <div className="movimentacao-details-content">
        <div className="movimentacao-details-grid">
          
          {/* 🎯 INFORMAÇÕES PRINCIPAIS */}
          <section className="movimentacao-details-section">
            <h3>🎯 Informações da Movimentação</h3>
            <div className="movimentacao-details-info-cards">
              <div className="movimentacao-details-info-card">
                <div className="movimentacao-details-info-icon">{getIcone(movimentacao.tipo)}</div>
                <div className="movimentacao-details-info-content">
                  <span className="movimentacao-details-info-label">Tipo</span>
                  <span className="movimentacao-details-info-value">
                    <span className={`movimentacao-details-badge movimentacao-details-badge--${movimentacao.tipo}`}>
                      {LABELS[movimentacao.tipo]}
                    </span>
                    {isDevolucaoAtrasada() && (
                      <span className="movimentacao-details-status atrasado">
                        ⚠️ Atrasada
                      </span>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="movimentacao-details-info-card">
                <div className="movimentacao-details-info-icon">📦</div>
                <div className="movimentacao-details-info-content">
                  <span className="movimentacao-details-info-label">Quantidade</span>
                  <span className="movimentacao-details-info-value movimentacao-details-quantidade">
                    {movimentacao.quantidade} unidades
                  </span>
                </div>
              </div>
              
              <div className="movimentacao-details-info-card">
                <div className="movimentacao-details-info-icon">📅</div>
                <div className="movimentacao-details-info-content">
                  <span className="movimentacao-details-info-label">Data/Hora</span>
                  <span className="movimentacao-details-info-value">
                    {formatarData(movimentacao.data_movimentacao)}
                    {!podeExcluir() && (
                      <span className="movimentacao-details-aviso-exclusao">
                        (Exclusão bloqueada - mais de 24h)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 📦 INFORMAÇÕES DO ITEM */}
          <section className="movimentacao-details-section">
            <h3>📦 Item Movimentado</h3>
            <div className="movimentacao-details-item-details-card">
              <div className="movimentacao-details-item-header">
                <h4>{movimentacao.item?.nome}</h4>
                {movimentacao.item?.patrimonio && (
                  <span className="movimentacao-details-patrimonio-badge">
                    {movimentacao.item.patrimonio}
                  </span>
                )}
              </div>
              
              <div className="movimentacao-details-item-details">
                <div className="movimentacao-details-detail-row">
                  <span className="movimentacao-details-detail-label">Categoria:</span>
                  <span className="movimentacao-details-detail-value">
                    {movimentacao.item?.categoria?.nome}
                  </span>
                </div>
                
                <div className="movimentacao-details-detail-row">
                  <span className="movimentacao-details-detail-label">Número de Série:</span>
                  <span className="movimentacao-details-detail-value">
                    {movimentacao.item?.numero_serie || 'Não informado'}
                  </span>
                </div>
                
                <div className="movimentacao-details-detail-row">
                  <span className="movimentacao-details-detail-label">Localização:</span>
                  <span className="movimentacao-details-detail-value">
                    {movimentacao.item?.localizacao || 'Não informada'}
                  </span>
                </div>

                <div className="movimentacao-details-detail-row">
                  <span className="movimentacao-details-detail-label">Status:</span>
                  <span className="movimentacao-details-detail-value">
                    {LABELS[movimentacao.item?.status]}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 👤 INFORMAÇÕES DO DESTINATÁRIO (SE APLICÁVEL) */}
          {(movimentacao.tipo === 'saida' || movimentacao.tipo === 'transferencia') && (
            <section className="movimentacao-details-section">
              <h3>👤 Destinatário</h3>
              <div className="movimentacao-details-destinatario-card">
                <div className="movimentacao-details-destinatario-info">
                  <div className="movimentacao-details-info-row">
                    <span className="movimentacao-details-info-label">Nome:</span>
                    <span className="movimentacao-details-info-value">
                      <strong>{movimentacao.destinatario}</strong>
                    </span>
                  </div>
                  
                  {movimentacao.departamento_destino && (
                    <div className="movimentacao-details-info-row">
                      <span className="movimentacao-details-info-label">Departamento:</span>
                      <span className="movimentacao-details-info-value">
                        {movimentacao.departamento_destino}
                      </span>
                    </div>
                  )}
                  
                  {movimentacao.data_devolucao_prevista && (
                    <div className="movimentacao-details-info-row">
                      <span className="movimentacao-details-info-label">Devolução Prevista:</span>
                      <span className="movimentacao-details-info-value movimentacao-details-data-destaque">
                        {formatarDataSimples(movimentacao.data_devolucao_prevista)}
                        {isDevolucaoAtrasada() && ' ⚠️'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 👤 USUÁRIO QUE REGISTROU */}
          <section className="movimentacao-details-section">
            <h3>👤 Registrado Por</h3>
            <div className="movimentacao-details-usuario-card">
              <div className="movimentacao-details-destinatario-info">
                <div className="movimentacao-details-info-row">
                  <span className="movimentacao-details-info-label">Nome:</span>
                  <span className="movimentacao-details-info-value">
                    <strong>{movimentacao.usuario?.nome}</strong>
                  </span>
                </div>
                
                <div className="movimentacao-details-info-row">
                  <span className="movimentacao-details-info-label">Email:</span>
                  <span className="movimentacao-details-info-value">
                    {movimentacao.usuario?.email}
                  </span>
                </div>
                
                <div className="movimentacao-details-info-row">
                  <span className="movimentacao-details-info-label">Perfil:</span>
                  <span className="movimentacao-details-info-value">
                    {LABELS[movimentacao.usuario?.perfil]}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 📝 OBSERVAÇÕES */}
          {movimentacao.observacao && (
            <section className="movimentacao-details-section">
              <h3>📝 Observações</h3>
              <div className="movimentacao-details-observacoes-card">
                <div className="movimentacao-details-observacoes-content">
                  {movimentacao.observacao}
                </div>
              </div>
            </section>
          )}

          {/* 📋 TIMELINE (Histórico) */}
          <section className="movimentacao-details-section movimentacao-details-timeline">
            <h3>📋 Histórico</h3>
            <div className="movimentacao-details-timeline-item">
              <div className="movimentacao-details-timeline-icon">
                {getIcone(movimentacao.tipo)}
              </div>
              <div className="movimentacao-details-timeline-content">
                <div className="movimentacao-details-timeline-title">
                  Movimentação registrada
                </div>
                <div className="movimentacao-details-timeline-description">
                  {LABELS[movimentacao.tipo]} de {movimentacao.quantidade} unidades
                </div>
                <div className="movimentacao-details-timeline-time">
                  {formatarData(movimentacao.data_movimentacao)}
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* 🔧 AÇÕES */}
        <div className="movimentacao-details-actions">
          <Link to="/movimentacoes" className="movimentacao-details-btn movimentacao-details-btn--secondary">
            ← Voltar para Lista
          </Link>
          
          <div className="movimentacao-details-actions-right">
            <Link 
              to={`/movimentacoes/editar/${movimentacao.id}`}
              className="movimentacao-details-btn movimentacao-details-btn--primary"
            >
              ✏️ Editar Movimentação
            </Link>
            
            {movimentacao.tipo === 'saida' && (
              <Link 
                to={`/movimentacoes/devolucao/${movimentacao.id}`}
                className="movimentacao-details-btn movimentacao-details-btn--success"
              >
                🔄 Registrar Devolução
              </Link>
            )}
            
            {/* 🗑️ BOTÃO EXCLUIR - Use Button component */}
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="movimentacao-details-btn movimentacao-details-btn--danger"
              disabled={!podeExcluir()}
              title={!podeExcluir() ? "Só é possível excluir movimentações nas primeiras 24 horas" : "Excluir movimentação"}
            >
              🗑️ Excluir Movimentação
            </Button>
          </div>
        </div>
      </div>

      {/* 🗑️ MODAL DE CONFIRMAÇÃO DE EXCLUSÃO - Use SimpleModal */}
      {showDeleteModal && (
        <SimpleModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirmar Exclusão"
          size="md"
        >
          <div className="modal-delete-content">
            <div className="modal-delete-icon">
              ⚠️
            </div>
            <div className="modal-delete-text">
              <h3>Tem certeza que deseja excluir esta movimentação?</h3>
              <p>
                Esta ação <strong>não pode ser desfeita</strong>. A movimentação será permanentemente removida do sistema.
              </p>
              
              <div className="modal-delete-details">
                <p><strong>Detalhes da movimentação:</strong></p>
                <ul>
                  <li>Item: <strong>{movimentacao.item?.nome}</strong></li>
                  <li>Tipo: <strong>{LABELS[movimentacao.tipo]}</strong></li>
                  <li>Quantidade: <strong>{movimentacao.quantidade} unidades</strong></li>
                  <li>Destinatário: <strong>{movimentacao.destinatario || 'Não informado'}</strong></li>
                </ul>
              </div>
              
              <div className="modal-delete-warning">
                <strong>Atenção:</strong> Esta ação também ajustará o estoque do item.
              </div>
            </div>
            
            <div className="modal-delete-actions">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="modal-btn modal-btn--secondary"
                disabled={deleteLoading}
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleDelete}
                className="modal-btn modal-btn--danger"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </div>
          </div>
        </SimpleModal>
      )}
    </div>
  );
};

export default MovimentacaoDetails;