import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './PendentesAprovacao.css';

const PendentesAprovacao = () => {
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAprovar, setModalAprovar] = useState(false);
  const [modalRejeitar, setModalRejeitar] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const carregarSolicitacoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/solicitacoes/pendentes');
      
      if (response.data.success) {
        setSolicitacoes(response.data.data);
      }
    } catch (err) {
      setError('Erro ao carregar solicitações pendentes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 FUNÇÃO SEGURA PARA FORMATAR VALOR
  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    
    const numero = parseFloat(valor);
    if (isNaN(numero)) return 'R$ 0,00';
    
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // 🔧 FUNÇÃO SEGURA PARA FORMATAR DATA
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return 'N/A';
      
      return data.toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  // 🔧 FUNÇÃO SEGURA PARA FORMATAR HORA
  const formatarHora = (dataString) => {
    if (!dataString) return '';
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return '';
      
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // 🆕 FORMATAR PERFIL PARA LEGÍVEL
  const formatarPerfil = (perfil) => {
    const perfis = {
      'admin': 'Administrador',
      'admin_estoque': 'Admin Estoque',
      'coordenador': 'Coordenador',
      'gerente': 'Gerente',
      'tecnico': 'Técnico',
      'analista': 'Analista',
      'estagiario': 'Estagiário',
      'aprendiz': 'Aprendiz'
    };
    return perfis[perfil] || perfil;
  };

  // 🆕 OBTER COR DA PRIORIDADE
  const getPrioridadeCor = (prioridade) => {
    switch (prioridade) {
      case 'urgente': return 'danger';
      case 'alta': return 'warning';
      case 'media': return 'info';
      case 'baixa': return 'secondary';
      default: return 'light';
    }
  };

  // 🆕 OBTER ÍCONE DA PRIORIDADE
  const getPrioridadeIcone = (prioridade) => {
    switch (prioridade) {
      case 'urgente': return '🔴';
      case 'alta': return '🟠';
      case 'media': return '🟡';
      case 'baixa': return '🟢';
      default: return '⚪';
    }
  };

  // 🆕 VERIFICAR SE USUÁRIO PODE ANALISAR
  const podeAnalisar = () => {
    return ['coordenador', 'gerente', 'admin', 'admin_estoque'].includes(user?.perfil);
  };

  // ✅ FUNÇÃO PARA APROVAR SOLICITAÇÃO
  const aprovarSolicitacao = async (id) => {
    try {
      // Confirmação simples com window.confirm
      const confirmar = window.confirm('Tem certeza que deseja aprovar esta solicitação?\n\n✅ A solicitação será enviada para o estoque.');
      
      if (!confirmar) return;

      // Enviar requisição
      const response = await api.put(`/solicitacoes/${id}/aprovar`, {
        observacoes: `Aprovado por ${user.nome} (${formatarPerfil(user.perfil)})`
      });

      if (response.data.success) {
        alert('✅ Solicitação aprovada com sucesso!');
        
        // Atualizar lista
        carregarSolicitacoes();
        setModalAprovar(false);
        setSolicitacaoSelecionada(null);
      }
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert(`❌ Erro ao aprovar solicitação: ${error.response?.data?.error || error.message}`);
    }
  };

  // ❌ FUNÇÃO PARA REJEITAR SOLICITAÇÃO
  const rejeitarSolicitacao = async (id, motivo) => {
    if (!motivo.trim()) {
      alert('⚠️ Informe o motivo da rejeição.');
      return;
    }

    try {
      // Confirmação
      const confirmar = window.confirm(`Tem certeza que deseja rejeitar esta solicitação?\n\nMotivo: ${motivo}`);
      
      if (!confirmar) return;

      // Enviar requisição
      const response = await api.put(`/solicitacoes/${id}/rejeitar`, {
        motivo_rejeicao: motivo
      });

      if (response.data.success) {
        alert('❌ Solicitação rejeitada com sucesso!');
        
        // Atualizar lista
        carregarSolicitacoes();
        setModalRejeitar(false);
        setSolicitacaoSelecionada(null);
        setMotivoRejeicao('');
      }
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert(`❌ Erro ao rejeitar solicitação: ${error.response?.data?.error || error.message}`);
    }
  };

  // 🆕 ABRIR MODAL DE APROVAÇÃO
  const abrirModalAprovar = (solicitacao) => {
    setSolicitacaoSelecionada(solicitacao);
    setModalAprovar(true);
  };

  // 🆕 ABRIR MODAL DE REJEIÇÃO
  const abrirModalRejeitar = (solicitacao) => {
    setSolicitacaoSelecionada(solicitacao);
    setModalRejeitar(true);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Carregando...</span>
      </div>
      <p className="mt-2">Carregando solicitações pendentes...</p>
    </div>
  );

  if (error) return (
    <div className="container mt-5">
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Erro!</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={carregarSolicitacoes}>
          Tentar novamente
        </button>
      </div>
    </div>
  );

  return (
    <div className="container">
      {/* MODAL DE APROVAÇÃO */}
      {modalAprovar && solicitacaoSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">✅ Confirmar Aprovação</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => {
                setModalAprovar(false);
                setSolicitacaoSelecionada(null);
              }}></button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Solicitação:</strong> {solicitacaoSelecionada.codigo_solicitacao}<br/>
                <strong>Título:</strong> {solicitacaoSelecionada.titulo}<br/>
                <strong>Solicitante:</strong> {solicitacaoSelecionada.solicitante_nome}
              </p>
              <p className="text-muted">
                Ao aprovar, a solicitação será enviada para o estoque.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => {
                setModalAprovar(false);
                setSolicitacaoSelecionada(null);
              }}>
                Cancelar
              </button>
              <button type="button" className="btn btn-success" onClick={() => aprovarSolicitacao(solicitacaoSelecionada.id)}>
                <span className="me-1">✅</span> Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REJEIÇÃO */}
      {modalRejeitar && solicitacaoSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">❌ Confirmar Rejeição</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => {
                setModalRejeitar(false);
                setSolicitacaoSelecionada(null);
              }}></button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Solicitação:</strong> {solicitacaoSelecionada.codigo_solicitacao}<br/>
                <strong>Título:</strong> {solicitacaoSelecionada.titulo}<br/>
                <strong>Solicitante:</strong> {solicitacaoSelecionada.solicitante_nome}
              </p>
              <div className="mb-3">
                <label htmlFor="motivoRejeicao" className="form-label">
                  <strong>Motivo da rejeição: *</strong>
                </label>
                <textarea
                  id="motivoRejeicao"
                  className="form-control"
                  rows="3"
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => {
                setModalRejeitar(false);
                setSolicitacaoSelecionada(null);
                setMotivoRejeicao('');
              }}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => rejeitarSolicitacao(solicitacaoSelecionada.id, motivoRejeicao)}
                disabled={!motivoRejeicao.trim()}
              >
                <span className="me-1">❌</span> Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-1">📋 Solicitações Pendentes de Aprovação</h1>
              <p className="text-muted mb-0">
                <strong>Seu perfil:</strong> {formatarPerfil(user?.perfil)} | 
                <strong> Total:</strong> {solicitacoes.length} solicitação(ões)
              </p>
            </div>
            <div>
              {podeAnalisar() ? (
                <div className="alert alert-success py-1 px-3 mb-0">
                  <small>✅ Você pode aprovar/rejeitar solicitações</small>
                </div>
              ) : (
                <div className="alert alert-warning py-1 px-3 mb-0">
                  <small>⚠️ Apenas coordenadores/gerentes podem aprovar</small>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {solicitacoes.length === 0 ? (
            <div className="text-center py-5">
              <div className="empty-state">
                <h3>🎉 Tudo em dia!</h3>
                <p className="text-muted">Não há solicitações pendentes de aprovação.</p>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th width="120">Código</th>
                    <th>Título</th>
                    <th width="180">Solicitante</th>
                    <th width="120">Prioridade</th>
                    <th width="100">Itens</th>
                    <th width="120">Valor Estimado</th>
                    <th width="150">Data</th>
                    <th width="180" className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitacoes.map((solic) => (
                    <tr key={solic.id} className={solic.prioridade === 'urgente' ? 'table-warning' : ''}>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className={`priority-dot bg-${getPrioridadeCor(solic.prioridade)} me-2`}></span>
                          <strong className="solic-codigo">{solic.codigo_solicitacao}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="solic-title">
                          <strong className="d-block mb-1">{solic.titulo}</strong>
                          {solic.descricao && (
                            <small className="text-muted d-block">
                              {solic.descricao.length > 80 
                                ? solic.descricao.substring(0, 80) + '...'
                                : solic.descricao}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong className="d-block">{solic.solicitante_nome}</strong>
                          <small className="text-muted d-block">{solic.departamento || 'N/A'}</small>
                          <small className="text-muted d-block">
                            {formatarPerfil(solic.solicitante_perfil || 'N/A')}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="me-1">{getPrioridadeIcone(solic.prioridade)}</span>
                          <span className={`badge bg-${getPrioridadeCor(solic.prioridade)}`}>
                            {solic.prioridade || 'normal'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-center">
                          <span className="badge bg-info px-3 py-2 fs-6">
                            {solic.total_itens || 0}
                          </span>
                          <small className="d-block text-muted mt-1">item(ns)</small>
                        </div>
                      </td>
                      <td>
                        <div className="text-center">
                          <div className="fw-bold text-success">
                            {formatarValor(solic.valor_total_estimado)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-center">
                          <div className="fw-bold">
                            {formatarData(solic.data_solicitacao)}
                          </div>
                          <small className="text-muted d-block">
                            {formatarHora(solic.data_solicitacao)}
                          </small>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column gap-2">
                          {/* BOTÕES PRINCIPAIS */}
                          {podeAnalisar() ? (
                            <>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-success btn-sm flex-fill"
                                  onClick={() => abrirModalAprovar(solic)}
                                  title="Aprovar esta solicitação"
                                >
                                  <span className="me-1">✅</span> Aprovar
                                </button>
                                <button
                                  className="btn btn-danger btn-sm flex-fill"
                                  onClick={() => abrirModalRejeitar(solic)}
                                  title="Rejeitar esta solicitação"
                                >
                                  <span className="me-1">❌</span> Rejeitar
                                </button>
                              </div>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => window.open(`/solicitacoes/${solic.id}`, '_blank')}
                                title="Ver detalhes completos"
                              >
                                <span className="me-1">📄</span> Detalhes
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-outline-info btn-sm"
                              onClick={() => window.open(`/solicitacoes/${solic.id}`, '_blank')}
                              title="Visualizar detalhes da solicitação"
                            >
                              <span className="me-1">👁</span> Visualizar
                            </button>
                          )}
                          
                          {/* 🆕 ESTATÍSTICAS RÁPIDAS */}
                          <div className="d-flex justify-content-around small text-muted">
                            <span title="Dias na fila">
                              ⏳ {Math.max(0, Math.floor((new Date() - new Date(solic.data_solicitacao)) / (1000 * 60 * 60 * 24)))}d
                            </span>
                            <span title="Prioridade">
                              {getPrioridadeIcone(solic.prioridade)}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="card-footer">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted">
                <strong>Perfis que podem aprovar:</strong> Coordenador, Gerente, Admin Estoque
              </span>
            </div>
            <div>
              <button className="btn btn-primary me-2" onClick={carregarSolicitacoes}>
                <span className="me-1">↻</span> Atualizar
              </button>
              <button className="btn btn-outline-secondary" onClick={() => window.history.back()}>
                ← Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendentesAprovacao;