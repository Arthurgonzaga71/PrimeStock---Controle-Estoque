import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSolicitacoes } from '../../contexts/SolicitacaoContext';
import { useAuth } from '../../contexts/AuthContext';
import HistoricoSolicitacao from '../../components/HistoricoSolicitacao';
import './DetalheSolicitacao.css';

const DetalheSolicitacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    fetchSolicitacaoById, 
    enviarParaAprovacao,
    aprovarSolicitacao,
    rejeitarSolicitacao,
    processarEstoque,
    registrarEntrega,
    cancelarSolicitacao,
    loading 
  } = useSolicitacoes();
  const { user } = useAuth();
  
  const [solicitacao, setSolicitacao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('detalhes');
  const [processando, setProcessando] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [modoRejeicao, setModoRejeicao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // 🔧 Carregar solicitação
  useEffect(() => {
    const carregarSolicitacao = async () => {
      try {
        setCarregando(true);
        setErro('');
        console.log('🔍 Carregando solicitação ID:', id);
        
        const dados = await fetchSolicitacaoById(id);
        
        if (!dados) {
          throw new Error('Solicitação não encontrada');
        }
        
        // Normalizar status se necessário
        if (!dados.status || dados.status.trim() === '') {
          dados.status = 'rascunho';
        }
        
        console.log('✅ Solicitação carregada:', {
          id: dados.id,
          status: dados.status,
          titulo: dados.titulo
        });
        
        setSolicitacao(dados);
      } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        setErro('Erro ao carregar solicitação: ' + (error.message || 'Erro desconhecido'));
      } finally {
        setCarregando(false);
      }
    };
    
    carregarSolicitacao();
  }, [id]);

  // ✅ FUNÇÃO PARA ENVIAR PARA APROVAÇÃO
  const handleEnviarAprovacao = async () => {
    if (!window.confirm('Tem certeza que deseja enviar esta solicitação para aprovação?')) {
      return;
    }

    try {
      setProcessando(true);
      setErro('');
      console.log('📤 Enviando solicitação ID:', id);
      
      // Usar função do contexto
      const resultado = await enviarParaAprovacao(id);
      
      console.log('✅ Resultado do envio:', resultado);
      
      if (resultado) {
        // Atualizar estado local
        setSolicitacao(prev => ({
          ...prev,
          status: 'pendente'
        }));
        
        setMensagemSucesso('✅ Solicitação enviada para aprovação com sucesso!');
        
        // Limpar mensagem após 5 segundos
        setTimeout(() => setMensagemSucesso(''), 5000);
        
        // Recarregar dados após 1 segundo
        setTimeout(async () => {
          try {
            const dados = await fetchSolicitacaoById(id);
            setSolicitacao(dados);
          } catch (error) {
            console.error('Erro ao recarregar:', error);
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao enviar para aprovação';
      setErro(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setProcessando(false);
    }
  };

  // ✅ FUNÇÃO PARA CANCELAR
  const handleCancelar = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar esta solicitação?')) {
      return;
    }

    try {
      setProcessando(true);
      await cancelarSolicitacao(id);
      navigate('/solicitacoes');
    } catch (error) {
      console.error('❌ Erro ao cancelar:', error);
      setErro('Erro ao cancelar: ' + error.message);
      alert(`❌ Erro ao cancelar: ${error.message}`);
    } finally {
      setProcessando(false);
    }
  };

  // ✅ FUNÇÃO PARA APROVAR (COORDENADOR/GERENTE)
  const handleAprovar = async () => {
    if (!window.confirm('Deseja APROVAR esta solicitação?')) {
      return;
    }

    try {
      setProcessando(true);
      const observacoes = prompt('Observações da aprovação (opcional):', '');
      
      console.log('✅ Aprovando solicitação ID:', id);
      const resultado = await aprovarSolicitacao(id, observacoes || '');
      
      console.log('✅ Resultado da aprovação:', resultado);
      
      if (resultado) {
        setSolicitacao(prev => ({
          ...prev,
          status: 'aprovada'
        }));
        
        setMensagemSucesso('✅ Solicitação APROVADA com sucesso!');
        setTimeout(() => setMensagemSucesso(''), 5000);
        
        setTimeout(async () => {
          const dados = await fetchSolicitacaoById(id);
          setSolicitacao(dados);
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Erro ao aprovar:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao aprovar';
      setErro(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setProcessando(false);
    }
  };

  // ✅ FUNÇÃO PARA REJEITAR (COORDENADOR/GERENTE)
  const handleRejeitar = async () => {
    let motivo = motivoRejeicao;
    
    if (!motivo || motivo.trim() === '') {
      motivo = prompt('Digite o motivo da REJEIÇÃO:');
      if (!motivo || motivo.trim() === '') {
        alert('Motivo da rejeição é obrigatório!');
        return;
      }
    }

    if (!window.confirm(`Deseja REJEITAR esta solicitação?\n\nMotivo: ${motivo}`)) {
      return;
    }

    try {
      setProcessando(true);
      console.log('❌ Rejeitando solicitação ID:', id);
      
      const resultado = await rejeitarSolicitacao(id, motivo);
      
      console.log('✅ Resultado da rejeição:', resultado);
      
      if (resultado) {
        setSolicitacao(prev => ({
          ...prev,
          status: 'rejeitada'
        }));
        
        setMensagemSucesso('❌ Solicitação REJEITADA com sucesso!');
        setTimeout(() => setMensagemSucesso(''), 5000);
        setMotivoRejeicao('');
        setModoRejeicao(false);
        
        setTimeout(async () => {
          const dados = await fetchSolicitacaoById(id);
          setSolicitacao(dados);
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Erro ao rejeitar:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao rejeitar';
      setErro(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setProcessando(false);
    }
  };

  // ✅ FUNÇÃO PARA ADMIN ESTOQUE PROCESSAR
  const handleProcessarEstoque = async (acao) => {
    const confirmMsg = acao === 'aceitar' 
      ? 'Deseja ACEITAR esta solicitação no estoque?'
      : 'Deseja REJEITAR esta solicitação no estoque?';
    
    if (!window.confirm(confirmMsg)) return;

    const observacoes = acao === 'rejeitar' 
      ? prompt('Digite o motivo da rejeição pelo estoque:', '')
      : '';

    if (acao === 'rejeitar' && !observacoes) return;

    try {
      setProcessando(true);
      console.log(`🏭 Processando no estoque: ${acao} ID:`, id);
      
      const resultado = await processarEstoque(id, acao, observacoes);
      
      console.log('✅ Resultado do processamento:', resultado);
      
      if (resultado) {
        const novoStatus = acao === 'aceitar' ? 'processando_estoque' : 'rejeitada_estoque';
        
        setSolicitacao(prev => ({
          ...prev,
          status: novoStatus
        }));
        
        setMensagemSucesso(`✅ Solicitação ${acao === 'aceitar' ? 'aceita' : 'rejeitada'} pelo estoque!`);
        setTimeout(() => setMensagemSucesso(''), 5000);
        
        setTimeout(async () => {
          const dados = await fetchSolicitacaoById(id);
          setSolicitacao(dados);
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar no estoque:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao processar';
      setErro(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setProcessando(false);
    }
  };

  // ✅ FUNÇÃO PARA FINALIZAR ENTREGA
  const handleFinalizarEntrega = async () => {
    if (!window.confirm('Deseja finalizar e marcar como entregue?')) {
      return;
    }

    try {
      setProcessando(true);
      console.log('📦 Finalizando entrega ID:', id);
      
      const resultado = await registrarEntrega(id);
      
      console.log('✅ Resultado da entrega:', resultado);
      
      if (resultado) {
        setSolicitacao(prev => ({
          ...prev,
          status: 'entregue'
        }));
        
        setMensagemSucesso('✅ Solicitação finalizada e marcada como entregue!');
        setTimeout(() => setMensagemSucesso(''), 5000);
        
        setTimeout(async () => {
          const dados = await fetchSolicitacaoById(id);
          setSolicitacao(dados);
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Erro ao finalizar entrega:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao entregar';
      setErro(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setProcessando(false);
    }
  };

  // ✅ FUNÇÕES AUXILIARES
  const getStatusClass = (status) => {
    const statusNormalizado = status?.toLowerCase() || 'rascunho';
    switch (statusNormalizado) {
      case 'rascunho': return 'status-badge-rascunho';
      case 'pendente': return 'status-badge-pendente';
      case 'aprovada': return 'status-badge-aprovada';
      case 'rejeitada': return 'status-badge-rejeitada';
      case 'processando_estoque': return 'status-badge-processando';
      case 'entregue': return 'status-badge-entregue';
      case 'rejeitada_estoque': return 'status-badge-rejeitada';
      case 'cancelada': return 'status-badge-cancelada';
      default: return 'status-badge-rascunho';
    }
  };

  const getStatusIcon = (status) => {
    const statusNormalizado = status?.toLowerCase() || 'rascunho';
    switch (statusNormalizado) {
      case 'rascunho': return '📝';
      case 'pendente': return '⏳';
      case 'aprovada': return '✅';
      case 'rejeitada': return '❌';
      case 'processando_estoque': return '🔧';
      case 'entregue': return '📦';
      case 'rejeitada_estoque': return '❌';
      case 'cancelada': return '🚫';
      default: return '❓';
    }
  };

  const getStatusTexto = (status) => {
    const statusNormalizado = status?.toLowerCase() || 'rascunho';
    switch (statusNormalizado) {
      case 'rascunho': return 'Rascunho';
      case 'pendente': return 'Pendente Aprovação';
      case 'aprovada': return 'Aprovada';
      case 'rejeitada': return 'Rejeitada';
      case 'processando_estoque': return 'Em Processamento';
      case 'entregue': return 'Entregue';
      case 'rejeitada_estoque': return 'Rejeitada pelo Estoque';
      case 'cancelada': return 'Cancelada';
      default: return statusNormalizado || 'Desconhecido';
    }
  };

  const getPrioridadeIcon = (prioridade) => {
    if (!prioridade) return '⚪';
    switch (prioridade.toLowerCase()) {
      case 'urgente': return '🔴';
      case 'alta': return '🟠';
      case 'media': return '🟡';
      case 'baixa': return '🟢';
      default: return '⚪';
    }
  };

  const getPrioridadeTexto = (prioridade) => {
    if (!prioridade) return 'Não definida';
    switch (prioridade.toLowerCase()) {
      case 'urgente': return 'Urgente';
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return 'Não definida';
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    try {
      return new Date(dataString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // ✅ VERIFICAÇÕES DE PERMISSÃO
  const podeEditar = () => {
    if (!solicitacao || !user) return false;
    return solicitacao.status === 'rascunho' && 
           solicitacao.usuario_solicitante_id === user.id;
  };

  const podeCancelar = () => {
    if (!solicitacao || !user) return false;
    const statusPermitidos = ['rascunho', 'pendente'];
    return statusPermitidos.includes(solicitacao.status) && 
           solicitacao.usuario_solicitante_id === user.id;
  };

  const podeEnviar = () => {
    if (!solicitacao || !user) return false;
    const podeEnviarStatus = solicitacao.status === 'rascunho';
    const ehSolicitante = solicitacao.usuario_solicitante_id === user.id;
    return podeEnviarStatus && ehSolicitante;
  };

  const podeAprovarComoCoordenador = () => {
    if (!solicitacao || !user) return false;
    
    const isCoordenadorOuGerente = ['coordenador', 'gerente', 'admin'].includes(user.perfil);
    if (!isCoordenadorOuGerente) return false;
    
    const isPendente = solicitacao.status === 'pendente';
    if (!isPendente) return false;
    
    const naoSouSolicitante = solicitacao.usuario_solicitante_id !== user.id;
    if (!naoSouSolicitante) return false;
    
    if (processando) return false;
    
    return true;
  };

  const podeProcessarEstoque = () => {
    if (!solicitacao || !user) return false;
    
    const isAdminEstoque = ['admin_estoque', 'admin'].includes(user.perfil);
    if (!isAdminEstoque) return false;
    
    const isAprovada = solicitacao.status === 'aprovada';
    if (!isAprovada) return false;
    
    if (processando) return false;
    
    return true;
  };

  const podeEntregar = () => {
    if (!solicitacao || !user) return false;
    
    const isAdminEstoque = ['admin_estoque', 'admin'].includes(user.perfil);
    if (!isAdminEstoque) return false;
    
    const isEmProcesso = solicitacao.status === 'processando_estoque';
    if (!isEmProcesso) return false;
    
    if (processando) return false;
    
    return true;
  };

  const mostraSecaoAprovacao = () => {
    return podeAprovarComoCoordenador() || podeProcessarEstoque() || podeEntregar();
  };

  if (carregando) {
    return (
      <div className="detalhe-solicitacao-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando solicitação...</p>
        </div>
      </div>
    );
  }

  if (erro && !solicitacao) {
    return (
      <div className="detalhe-solicitacao-page">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>Erro ao carregar solicitação</h3>
          <p>{erro}</p>
          <Link to="/solicitacoes" className="btn-primary">
            ← Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className="detalhe-solicitacao-page">
        <div className="error-state">
          <div className="error-icon">❓</div>
          <h3>Solicitação não encontrada</h3>
          <p>A solicitação com ID {id} não foi encontrada.</p>
          <Link to="/solicitacoes" className="btn-primary">
            ← Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }

  const statusTexto = getStatusTexto(solicitacao.status);
  const statusIcon = getStatusIcon(solicitacao.status);
  const statusClass = getStatusClass(solicitacao.status);

  return (
    <div className="detalhe-solicitacao-page">
      {/* MENSAGEM DE SUCESSO */}
      {mensagemSucesso && (
        <div className="success-message">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <span className="success-text">{mensagemSucesso}</span>
            <button className="success-close" onClick={() => setMensagemSucesso('')}>×</button>
          </div>
        </div>
      )}

      {/* MENSAGEM DE ERRO */}
      {erro && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">❌</span>
            <span className="error-text">{erro}</span>
            <button className="error-close" onClick={() => setErro('')}>×</button>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="detalhe-header">
        <Link to="/solicitacoes" className="detalhe-back-link">
          ← Voltar para pendentes
        </Link>
        
        <div className="detalhe-header-main">
          <div className="detalhe-title-section">
            <div className="detalhe-title">
              {solicitacao.titulo}
              <span className={`detalhe-status-badge ${statusClass}`}>
                {statusIcon} {statusTexto}
              </span>
              <span className="detalhe-prioridade-icon" title={`Prioridade: ${getPrioridadeTexto(solicitacao.prioridade)}`}>
                {getPrioridadeIcon(solicitacao.prioridade)}
              </span>
            </div>
            <p className="detalhe-description">{solicitacao.descricao || 'Sem descrição'}</p>
            <div className="detalhe-meta-info">
              <span><strong>Código:</strong> {solicitacao.codigo_solicitacao}</span>
              <span>•</span>
              <span><strong>Criada em:</strong> {formatarData(solicitacao.data_solicitacao)}</span>
              <span>•</span>
              <span><strong>Por:</strong> {solicitacao.solicitante_nome || 'Usuário'}</span>
            </div>
          </div>

          {/* AÇÕES BÁSICAS */}
          <div className="detalhe-actions">
            {podeEnviar() && (
              <button
                onClick={handleEnviarAprovacao}
                disabled={processando || loading}
                className="detalhe-action-btn btn-success"
                title="Enviar para aprovação"
              >
                <span className="action-icon">📤</span>
                {processando ? 'Enviando...' : 'Enviar para Aprovação'}
              </button>
            )}
            
            {podeCancelar() && (
              <button
                onClick={handleCancelar}
                disabled={processando}
                className="detalhe-action-btn btn-danger"
                title="Cancelar solicitação"
              >
                <span className="action-icon">❌</span>
                {processando ? 'Cancelando...' : 'Cancelar'}
              </button>
            )}
            
            {podeEditar() && (
              <button
                onClick={() => navigate(`/solicitacoes/editar/${id}`)}
                className="detalhe-action-btn btn-primary"
                title="Editar solicitação"
              >
                <span className="action-icon">✏️</span>
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* INFORMAÇÃO DE PERMISSÃO */}
      {podeAprovarComoCoordenador() && (
        <div className="perm-alert perm-info">
          <strong>👑 Você está como {user?.perfil?.toUpperCase()}</strong> - 
          Você pode APROVAR ou REJEITAR esta solicitação.
          <br />
          <small>
            Status: <strong>{statusTexto}</strong> | 
            Solicitante: <strong>{solicitacao.solicitante_nome}</strong>
          </small>
        </div>
      )}
      
      {podeProcessarEstoque() && (
        <div className="perm-alert perm-warning">
          <strong>📦 Você está como {user?.perfil}</strong> - 
          Você pode ACEITAR esta solicitação no estoque ou REJEITAR.
        </div>
      )}

      {podeEntregar() && (
        <div className="perm-alert perm-success">
          <strong>✅ Você está como {user?.perfil}</strong> - 
          Você pode FINALIZAR e marcar como entregue.
        </div>
      )}

      {/* Abas */}
      <div className="detalhe-tabs">
        <nav className="detalhe-tabs-nav">
          <button
            onClick={() => setAbaAtiva('detalhes')}
            className={`detalhe-tab-btn ${abaAtiva === 'detalhes' ? 'active' : ''}`}
          >
            📊 Detalhes
          </button>
          <button
            onClick={() => setAbaAtiva('itens')}
            className={`detalhe-tab-btn ${abaAtiva === 'itens' ? 'active' : ''}`}
          >
            📦 Itens ({solicitacao.itens?.length || 0})
          </button>
          <button
            onClick={() => setAbaAtiva('historico')}
            className={`detalhe-tab-btn ${abaAtiva === 'historico' ? 'active' : ''}`}
          >
            📝 Histórico ({solicitacao.historico?.length || 0})
          </button>
          
          {mostraSecaoAprovacao() && (
            <button
              onClick={() => setAbaAtiva('aprovacao')}
              className={`detalhe-tab-btn ${abaAtiva === 'aprovacao' ? 'active' : ''}`}
            >
              ✅ Aprovação
            </button>
          )}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {abaAtiva === 'detalhes' && (
        <div className="detalhe-grid">
          <div className="detalhe-card">
            <h3>📋 Informações da Solicitação</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`info-value ${statusClass}`}>
                  {statusIcon} {statusTexto}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Prioridade:</span>
                <span className="info-value">
                  {getPrioridadeIcon(solicitacao.prioridade)} {getPrioridadeTexto(solicitacao.prioridade)}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Tipo:</span>
                <span className="info-value capitalize">{solicitacao.tipo || 'Não informado'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Departamento:</span>
                <span className="info-value">{solicitacao.departamento || 'Não informado'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Tipo de Solicitação:</span>
                <span className="info-value">{solicitacao.tipo_solicitacao || 'Não informado'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Orçamento Estimado:</span>
                <span className="info-value">
                  {solicitacao.orcamento_estimado 
                    ? `R$ ${parseFloat(solicitacao.orcamento_estimado).toFixed(2)}`
                    : 'Não informado'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="detalhe-card">
            <h3>📅 Datas e Prazos</h3>
            <div className="datas-grid">
              <div className="data-item">
                <span className="data-label">Criação:</span>
                <span className="data-value">{formatarData(solicitacao.data_solicitacao)}</span>
              </div>
              
              {solicitacao.data_aprovacao && (
                <div className="data-item data-success">
                  <span className="data-label">Aprovação:</span>
                  <span className="data-value">{formatarData(solicitacao.data_aprovacao)}</span>
                </div>
              )}
              
              {solicitacao.data_entrega && (
                <div className="data-item data-info">
                  <span className="data-label">Entrega:</span>
                  <span className="data-value">{formatarData(solicitacao.data_entrega)}</span>
                </div>
              )}
              
              {solicitacao.data_devolucao_prevista && (
                <div className="data-item data-warning">
                  <span className="data-label">Devolução Prevista:</span>
                  <span className="data-value">{formatarData(solicitacao.data_devolucao_prevista)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'itens' && (
        <div className="detalhe-card">
          <div className="detalhe-table-header">
            <h3>📦 Itens da Solicitação ({solicitacao.itens?.length || 0})</h3>
          </div>

          {!solicitacao.itens || solicitacao.itens.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h4>Nenhum item encontrado</h4>
              <p>Esta solicitação não contém itens.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="itens-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantidades</th>
                    <th>Status</th>
                    <th>Motivo do Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitacao.itens.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>
                        <div className="item-info">
                          <strong>{item.nome_item || 'Item sem nome'}</strong>
                          {item.especificacoes && (
                            <small className="item-specs">
                              {typeof item.especificacoes === 'string' 
                                ? item.especificacoes 
                                : JSON.stringify(item.especificacoes)}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="quantities">
                          <div className="quantity-row">
                            <span>Solicitada:</span>
                            <span className="qty-value">{item.quantidade_solicitada || 1}</span>
                          </div>
                          {item.quantidade_aprovada > 0 && (
                            <div className="quantity-row approved">
                              <span>Aprovada:</span>
                              <span className="qty-value">{item.quantidade_aprovada}</span>
                            </div>
                          )}
                          {item.quantidade_entregue > 0 && (
                            <div className="quantity-row delivered">
                              <span>Entregue:</span>
                              <span className="qty-value">{item.quantidade_entregue}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`item-status ${item.status_item || 'pendente'}`}>
                          {item.status_item === 'aprovado' ? '✅ Aprovado' :
                           item.status_item === 'rejeitado' ? '❌ Rejeitado' :
                           item.status_item === 'entregue' ? '📦 Entregue' :
                           '⏳ Pendente'}
                        </span>
                      </td>
                      <td>
                        <p className="item-motivo">{item.motivo_uso || 'Não informado'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'historico' && (
        <div className="detalhe-card">
          <div className="detalhe-table-header">
            <h3>📝 Histórico de Alterações ({solicitacao.historico?.length || 0})</h3>
          </div>

          {!solicitacao.historico || solicitacao.historico.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h4>Nenhum histórico encontrado</h4>
              <p>Não há registros de alterações para esta solicitação.</p>
            </div>
          ) : (
            <HistoricoSolicitacao 
              historico={solicitacao.historico}
              loading={false}
            />
          )}
        </div>
      )}

      {abaAtiva === 'aprovacao' && (
        <div className="detalhe-card">
          <div className="aprovacao-header">
            <h3>✅ Processamento da Solicitação</h3>
            <p>Status atual: <strong>{statusTexto}</strong></p>
          </div>

          <div className="aprovacao-sections">
            {/* SEÇÃO COORDENADOR/GERENTE */}
            {podeAprovarComoCoordenador() && (
              <div className="aprovacao-section">
                <div className="section-header bg-primary">
                  <h4>👑 Aprovação como {user?.perfil?.toUpperCase()}</h4>
                </div>
                <div className="section-body">
                  <div className="section-info">
                    <p>Ao aprovar, a solicitação será enviada para o estoque para processamento.</p>
                  </div>
                  
                  <div className="section-actions">
                    {!modoRejeicao ? (
                      <>
                        <button
                          className="btn btn-success btn-lg"
                          onClick={handleAprovar}
                          disabled={processando}
                        >
                          <span className="btn-icon">✅</span>
                          {processando ? 'Aprovando...' : 'Aprovar Solicitação'}
                        </button>
                        
                        <button
                          className="btn btn-outline-danger btn-lg"
                          onClick={() => setModoRejeicao(true)}
                          disabled={processando}
                        >
                          <span className="btn-icon">❌</span>
                          Rejeitar Solicitação
                        </button>
                      </>
                    ) : (
                      <div className="rejeicao-mode">
                        <div className="form-group">
                          <label><strong>Motivo da Rejeição *</strong></label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={motivoRejeicao}
                            onChange={(e) => setMotivoRejeicao(e.target.value)}
                            placeholder="Descreva o motivo da rejeição..."
                            required
                          />
                        </div>
                        
                        <div className="rejeicao-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setModoRejeicao(false);
                              setMotivoRejeicao('');
                            }}
                          >
                            ↩️ Voltar
                          </button>
                          
                          <button
                            className="btn btn-danger"
                            onClick={handleRejeitar}
                            disabled={processando || !motivoRejeicao.trim()}
                          >
                            <span className="btn-icon">❌</span>
                            Confirmar Rejeição
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO ADMIN ESTOQUE */}
            {podeProcessarEstoque() && (
              <div className="aprovacao-section">
                <div className="section-header bg-warning">
                  <h4>📦 Processamento no Estoque</h4>
                </div>
                <div className="section-body">
                  <div className="section-info">
                    <p>Aceitar: A solicitação será marcada como "Em Processamento" para preparação.</p>
                    <p>Rejeitar: A solicitação será marcada como "Rejeitada" e não será processada.</p>
                  </div>
                  
                  <div className="section-actions">
                    <button
                      className="btn btn-success btn-lg"
                      onClick={() => handleProcessarEstoque('aceitar')}
                      disabled={processando}
                    >
                      <span className="btn-icon">🏭</span>
                      {processando ? 'Processando...' : 'Aceitar no Estoque'}
                    </button>
                    
                    <button
                      className="btn btn-danger btn-lg"
                      onClick={() => handleProcessarEstoque('rejeitar')}
                      disabled={processando}
                    >
                      <span className="btn-icon">🚫</span>
                      Rejeitar no Estoque
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO ENTREGA */}
            {podeEntregar() && (
              <div className="aprovacao-section">
                <div className="section-header bg-success">
                  <h4>📦 Finalizar Entrega</h4>
                </div>
                <div className="section-body">
                  <div className="section-info">
                    <p>Ao finalizar, a solicitação será marcada como "Entregue" e o processo será concluído.</p>
                  </div>
                  
                  <div className="section-actions">
                    <button
                      className="btn btn-success btn-lg"
                      onClick={handleFinalizarEntrega}
                      disabled={processando}
                    >
                      <span className="btn-icon">✅</span>
                      {processando ? 'Finalizando...' : 'Finalizar e Entregar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SEM PERMISSÃO */}
            {!mostraSecaoAprovacao() && (
              <div className="no-permission">
                <div className="no-permission-icon">⚠️</div>
                <h5>Você não tem permissão para processar esta solicitação</h5>
                <p>
                  Status atual: <strong>{statusTexto}</strong><br />
                  Perfil necessário: Coordenador, Gerente ou Administrador do Estoque
                </p>
                <small>
                  Seu perfil: <strong>{user?.perfil}</strong>
                </small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalheSolicitacao;