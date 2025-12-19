import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './AprovarSolicitacao.css';

const AprovarSolicitacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Removi podeRealizar se não existe
  
  const [solicitacao, setSolicitacao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('detalhes');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [modoRejeicao, setModoRejeicao] = useState(false);
  const [itens, setItens] = useState([]);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    carregarSolicitacaoCompleta();
  }, [id]);

  // 🎯 CARREGAR TODOS OS DADOS COMPLETOS
  const carregarSolicitacaoCompleta = async () => {
    try {
      setCarregando(true);
      
      // 1. Buscar dados básicos da solicitação
      const response = await api.get(`/solicitacoes/${id}`);
      
      if (response.data.success) {
        const dados = response.data.data;
        
        console.log('📋 Dados completos da solicitação:', {
          id: dados.id,
          codigo: dados.codigo_solicitacao,
          status: dados.status,
          nivel: dados.nivel_aprovacao_atual,
          usuario_id: dados.usuario_solicitante_id
        });
        
        // 🆕 VERIFICAÇÃO DO STATUS - CORRIGIDO
        const statusValidoParaAprovacao = ['pendente'].includes(dados.status); // CORREÇÃO AQUI
        
        if (!statusValidoParaAprovacao) {
          setErro(`Esta solicitação está no status: "${getStatusTexto(dados.status)}". Não pode mais ser aprovada.`);
        }
        
        setSolicitacao(dados);
        
        // 2. Buscar itens detalhados
        if (dados.itens && dados.itens.length > 0) {
          setItens(dados.itens);
        } else {
          const itensResponse = await api.get(`/solicitacoes/${id}/itens`);
          if (itensResponse.data.success) {
            setItens(itensResponse.data.data || []);
          }
        }
        
        // 3. Buscar histórico
        if (dados.historico && dados.historico.length > 0) {
          setHistorico(dados.historico);
        } else {
          const historicoResponse = await api.get(`/solicitacoes/${id}/historico`);
          if (historicoResponse.data.success) {
            setHistorico(historicoResponse.data.data || []);
          }
        }
        
      } else {
        throw new Error(response.data.error || 'Erro ao carregar solicitação');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar solicitação:', err);
      setErro('Erro ao carregar solicitação: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setCarregando(false);
    }
  };

  // 🎯 FUNÇÃO PARA APROVAR SOLICITAÇÃO (SIMPLIFICADA)
  const handleAprovar = async () => {
    if (!window.confirm('Deseja APROVAR esta solicitação e enviar para o estoque?')) {
      return;
    }

    try {
      setProcessando(true);
      
      // 🆕 VERIFICAÇÃO SIMPLES DE PERMISSÃO
      if (!podeAprovar()) {
        alert('❌ Você não tem permissão para aprovar solicitações');
        return;
      }
      
      const response = await api.put(`/solicitacoes/${id}/aprovar`, {
        observacoes: `Aprovado por ${user?.nome} (${user?.perfil})`
      });

      if (response.data.success) {
        alert('✅ Solicitação APROVADA com sucesso! Foi enviada para o estoque.');
        
        await carregarSolicitacaoCompleta();
        
        setTimeout(() => {
          navigate('/pendentes'); // CORREÇÃO AQUI
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      
      let mensagemErro = 'Erro ao aprovar solicitação';
      
      if (error.response?.data?.error) {
        mensagemErro = error.response.data.error;
      } else if (error.response?.status === 403) {
        mensagemErro = '❌ Acesso negado. Apenas coordenadores, gerentes e administradores podem aprovar.';
      } else if (error.response?.status === 400) {
        mensagemErro = '❌ Não é possível aprovar esta solicitação no status atual.';
      }
      
      alert(mensagemErro);
    } finally {
      setProcessando(false);
    }
  };

  // 🎯 FUNÇÃO PARA REJEITAR SOLICITAÇÃO (SIMPLIFICADA)
  const handleRejeitar = async () => {
    if (!motivoRejeicao || motivoRejeicao.trim() === '') {
      alert('❌ Motivo da rejeição é obrigatório!');
      return;
    }

    if (!window.confirm('Deseja REJEITAR esta solicitação?')) {
      return;
    }

    try {
      setProcessando(true);
      
      // 🆕 VERIFICAÇÃO SIMPLES DE PERMISSÃO
      if (!podeAprovar()) {
        alert('❌ Você não tem permissão para rejeitar solicitações');
        return;
      }
      
      const response = await api.put(`/solicitacoes/${id}/rejeitar`, {
        motivo_rejeicao: motivoRejeicao
      });

      if (response.data.success) {
        alert('❌ Solicitação REJEITADA com sucesso!');
        
        await carregarSolicitacaoCompleta();
        
        setTimeout(() => {
          navigate('/pendentes'); // CORREÇÃO AQUI
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      
      let mensagemErro = 'Erro ao rejeitar solicitação';
      
      if (error.response?.data?.error) {
        mensagemErro = error.response.data.error;
      } else if (error.response?.status === 403) {
        mensagemErro = '❌ Acesso negado. Apenas coordenadores, gerentes e administradores podem rejeitar.';
      } else if (error.response?.status === 400) {
        mensagemErro = '❌ Não é possível rejeitar esta solicitação no status atual.';
      }
      
      alert(mensagemErro);
    } finally {
      setProcessando(false);
    }
  };

  // 🎯 FORMATAR DATA
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
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

  // 🎯 FORMATAR VALOR
  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    const numero = parseFloat(valor);
    if (isNaN(numero)) return 'R$ 0,00';
    
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // 🎯 OBTER COR DA PRIORIDADE
  const getPrioridadeCor = (prioridade) => {
    switch (prioridade) {
      case 'urgente': return 'danger';
      case 'alta': return 'warning';
      case 'media': return 'info';
      case 'baixa': return 'secondary';
      default: return 'light';
    }
  };

  // 🎯 OBTER TEXTO DO STATUS (CORRIGIDO)
  const getStatusTexto = (status) => {
    switch (status) {
      case 'rascunho': return '📝 Rascunho';
      case 'pendente': return '⏳ Pendente Aprovação'; // CORREÇÃO AQUI
      case 'aprovada': return '✅ Aprovada';
      case 'rejeitada': return '❌ Rejeitada';
      case 'em_analise': return '🔍 Em Análise no Estoque';
      case 'entregue': return '📦 Entregue';
      case 'cancelada': return '🚫 Cancelada';
      default: return status;
    }
  };

  // 🎯 VERIFICAR SE PODE APROVAR (SIMPLIFICADO)
  const podeAprovar = () => {
    if (!user || !solicitacao) return false;
    
    // Verificar perfil do usuário
    const perfisPermitidos = ['coordenador', 'gerente', 'admin', 'admin_estoque'];
    const temPerfilPermitido = perfisPermitidos.includes(user.perfil);
    
    // Verificar status correto - CORRIGIDO
    const statusCorreto = ['pendente'].includes(solicitacao.status);
    
    return temPerfilPermitido && statusCorreto && !processando;
  };

  // 🆕 VERIFICAR LIMITES DA SOLICITAÇÃO
  const verificarLimitesSolicitacao = () => {
    if (!solicitacao) return { dentroDosLimites: true };
    
    const totalItens = itens.length;
    const valorTotal = solicitacao.valor_total || 
                      itens.reduce((total, item) => total + ((item.valor_unitario_estimado || 0) * (item.quantidade_solicitada || 1)), 0);
    
    const limiteItens = totalItens > 15;
    const limiteValor = valorTotal > 2000;
    
    return {
      dentroDosLimites: !limiteItens && !limiteValor,
      limiteItens,
      limiteValor,
      totalItens,
      valorTotal
    };
  };

  // 🆕 CALCULAR VALOR TOTAL DOS ITENS
  const calcularValorTotalItens = () => {
    return itens.reduce((total, item) => {
      const valor = parseFloat(item.valor_unitario_estimado) || 0;
      const quantidade = parseInt(item.quantidade_solicitada) || 1;
      return total + (valor * quantidade);
    }, 0);
  };

  if (carregando) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Carregando...</span>
          </div>
          <h4 className="mt-3">Carregando solicitação...</h4>
          <p className="text-muted">Por favor, aguarde</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="container mt-5">
        <div className="card">
          <div className="card-header bg-warning text-white">
            <h4 className="mb-0">⚠️ Solicitação Não Disponível</h4>
          </div>
          <div className="card-body">
            <div className="alert alert-warning">
              <h5 className="alert-heading">{erro}</h5>
              <p>Esta solicitação não pode ser aprovada/rejeitada no momento.</p>
              <hr />
              {solicitacao && (
                <div className="mt-3">
                  <p><strong>Código:</strong> {solicitacao.codigo_solicitacao}</p>
                  <p><strong>Status:</strong> {getStatusTexto(solicitacao.status)}</p>
                  <p><strong>Título:</strong> {solicitacao.titulo}</p>
                  <p><strong>Solicitante:</strong> {solicitacao.solicitante_nome} ({solicitacao.solicitante_perfil})</p>
                </div>
              )}
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/pendentes')} // CORREÇÃO AQUI
            >
              ← Voltar para Solicitações Pendentes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Solicitação não encontrada</h4>
          <p>A solicitação solicitada não existe ou você não tem permissão para acessá-la.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/solicitacoes')}
          >
            ← Voltar para a lista
          </button>
        </div>
      </div>
    );
  }

  // 🆕 INFORMAÇÕES DE LIMITES
  const limites = verificarLimitesSolicitacao();
  const valorTotalCalculado = calcularValorTotalItens();

  return (
    <div className="container mt-4">
      {/* CABEÇALHO PRINCIPAL */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">📋 Análise de Solicitação</h2>
              <p className="mb-0">
                <small>
                  Código: <strong>{solicitacao.codigo_solicitacao}</strong> | 
                  Status: <strong>{getStatusTexto(solicitacao.status)}</strong>
                </small>
              </p>
            </div>
            <div className="text-end">
              <div className="badge bg-light text-dark fs-6 mb-2">
                👤 {user?.perfil?.toUpperCase()}
              </div>
              <br />
              <Link to="/pendentes" className="text-white text-decoration-underline"> {/* CORREÇÃO AQUI */}
                ← Voltar para Pendentes
              </Link>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {/* TÍTULO E DESCRIÇÃO */}
          <div className="row mb-4">
            <div className="col-12">
              <h3 className="text-primary">{solicitacao.titulo}</h3>
              <p className="lead">{solicitacao.descricao}</p>
            </div>
          </div>

          {/* INFORMAÇÕES PRINCIPAIS EM CARDS */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card h-100">
                <div className="card-header bg-info text-white">
                  <h6 className="mb-0">👤 Solicitante</h6>
                </div>
                <div className="card-body">
                  <h5 className="card-title">{solicitacao.solicitante_nome}</h5>
                  <p className="card-text">
                    <strong>Perfil:</strong> {solicitacao.solicitante_perfil || 'N/A'}<br />
                    <strong>Departamento:</strong> {solicitacao.departamento || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="card h-100">
                <div className="card-header bg-warning text-white">
                  <h6 className="mb-0">⚡ Prioridade</h6>
                </div>
                <div className="card-body text-center">
                  <h1 className="display-4">
                    {solicitacao.prioridade === 'urgente' ? '🔴' :
                     solicitacao.prioridade === 'alta' ? '🟠' :
                     solicitacao.prioridade === 'media' ? '🟡' : '🟢'}
                  </h1>
                  <h4 className={`text-${getPrioridadeCor(solicitacao.prioridade)}`}>
                    {solicitacao.prioridade?.toUpperCase() || 'NORMAL'}
                  </h4>
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="card h-100">
                <div className="card-header bg-success text-white">
                  <h6 className="mb-0">📅 Datas</h6>
                </div>
                <div className="card-body">
                  <p><strong>Criada:</strong> {formatarData(solicitacao.data_solicitacao)}</p>
                  {solicitacao.data_aprovacao && (
                    <p><strong>Aprovada:</strong> {formatarData(solicitacao.data_aprovacao)}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="card h-100">
                <div className="card-header bg-secondary text-white">
                  <h6 className="mb-0">🔒 Permissões</h6>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Seu Perfil:</strong>{' '}
                    <span className={`badge bg-${podeAprovar() ? 'success' : 'warning'}`}>
                      {user?.perfil?.toUpperCase()}
                    </span>
                  </p>
                  <p>
                    <strong>Pode Aprovar:</strong>{' '}
                    <span className={`badge bg-${podeAprovar() ? 'success' : 'danger'}`}>
                      {podeAprovar() ? '✅ SIM' : '❌ NÃO'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ABASTABS DE NAVEGAÇÃO */}
          <div className="row mb-4">
            <div className="col-12">
              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${abaAtiva === 'detalhes' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('detalhes')}
                  >
                    📋 Detalhes
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${abaAtiva === 'itens' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('itens')}
                  >
                    📦 Itens ({itens.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${abaAtiva === 'historico' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('historico')}
                  >
                    📝 Histórico ({historico.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${abaAtiva === 'decisao' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('decisao')}
                  >
                    ✅ Decisão
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="row">
            <div className="col-12">
              {/* ABA: DETALHES */}
              {abaAtiva === 'detalhes' && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Informações Detalhadas</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Tipo de Solicitação:</strong> {solicitacao.tipo_solicitacao || 'Retirada de Estoque'}</p>
                        <p><strong>Urgência de Compra:</strong> {solicitacao.urgencia_compra || 'Média'}</p>
                        {solicitacao.fornecedor_sugerido && (
                          <p><strong>Fornecedor Sugerido:</strong> {solicitacao.fornecedor_sugerido}</p>
                        )}
                      </div>
                      <div className="col-md-6">
                        {solicitacao.data_devolucao_prevista && (
                          <p>
                            <strong>Devolução Prevista:</strong>{' '}
                            {formatarData(solicitacao.data_devolucao_prevista)}
                          </p>
                        )}
                        {solicitacao.motivo_rejeicao && (
                          <p className="text-danger">
                            <strong>Motivo Rejeição Anterior:</strong> {solicitacao.motivo_rejeicao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: ITENS */}
              {abaAtiva === 'itens' && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Itens Solicitados</h5>
                    
                    {itens.length === 0 ? (
                      <div className="alert alert-info">
                        Nenhum item encontrado nesta solicitação.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>#</th>
                              <th>Item</th>
                              <th className="text-center">Quantidade</th>
                              <th>Valor Unitário</th>
                              <th>Valor Total</th>
                              <th>Motivo</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {itens.map((item, index) => (
                              <tr key={item.id || index}>
                                <td>{index + 1}</td>
                                <td>
                                  <strong>{item.nome_item || item.item_estoque_nome}</strong>
                                </td>
                                <td className="text-center">
                                  <span className="badge bg-primary fs-6">
                                    {item.quantidade_solicitada}
                                  </span>
                                </td>
                                <td>
                                  {formatarValor(item.valor_unitario_estimado)}
                                </td>
                                <td>
                                  {formatarValor((item.valor_unitario_estimado || 0) * (item.quantidade_solicitada || 1))}
                                </td>
                                <td>
                                  <small>{item.motivo_uso || 'Não informado'}</small>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    item.status_item === 'aprovado' ? 'bg-success' :
                                    item.status_item === 'rejeitado' ? 'bg-danger' :
                                    'bg-warning'
                                  }`}>
                                    {item.status_item === 'aprovado' ? '✅ Aprovado' :
                                     item.status_item === 'rejeitado' ? '❌ Rejeitado' :
                                     '⏳ Pendente'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-dark">
                            <tr>
                              <td colSpan="4" className="text-end"><strong>Total:</strong></td>
                              <td><strong>{formatarValor(valorTotalCalculado)}</strong></td>
                              <td colSpan="2"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA: HISTÓRICO */}
              {abaAtiva === 'historico' && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Histórico de Alterações</h5>
                    
                    {historico.length === 0 ? (
                      <div className="alert alert-info">
                        Nenhum histórico encontrado para esta solicitação.
                      </div>
                    ) : (
                      <div className="timeline">
                        {historico.map((evento, index) => (
                          <div key={index} className="timeline-item mb-3">
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                              <h6 className="mb-1">
                                {evento.usuario_nome} ({evento.usuario_perfil})
                              </h6>
                              <p className="mb-1">{evento.descricao}</p>
                              <small className="text-muted">
                                {formatarData(evento.data_acao)}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA: DECISÃO */}
              {abaAtiva === 'decisao' && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">📝 Tomada de Decisão</h5>
                    
                    <div className="alert alert-info mb-4">
                      <h6>🔒 Informações de Permissão</h6>
                      <p>
                        <strong>Seu Perfil:</strong> {user?.perfil?.toUpperCase()} | 
                        <strong> Pode Aprovar:</strong> {podeAprovar() ? '✅ SIM' : '❌ NÃO'}
                      </p>
                    </div>

                    {/* DECISÃO */}
                    {!podeAprovar() ? (
                      <div className="alert alert-warning">
                        <h6>⚠️ Você não pode aprovar/rejeitar esta solicitação</h6>
                        <p>
                          <strong>Razão:</strong>{' '}
                          {solicitacao.status !== 'pendente' 
                            ? `Esta solicitação já está no status: "${getStatusTexto(solicitacao.status)}"`
                            : `Seu perfil (${user?.perfil?.toUpperCase()}) não tem permissão para aprovar solicitações.`}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* MODO NORMAL */}
                        {!modoRejeicao ? (
                          <div className="row">
                            <div className="col-md-8">
                              <div className="alert alert-success">
                                <h6>✅ Você pode APROVAR esta solicitação</h6>
                                <p>
                                  Ao aprovar, a solicitação será enviada automaticamente para o estoque 
                                  para processamento.
                                </p>
                              </div>
                            </div>
                            <div className="col-md-4 text-end">
                              <button
                                className="btn btn-danger btn-lg me-2"
                                onClick={() => setModoRejeicao(true)}
                                disabled={processando}
                              >
                                <span className="me-2">❌</span>
                                Rejeitar
                              </button>
                              <button
                                className="btn btn-success btn-lg"
                                onClick={handleAprovar}
                                disabled={processando}
                              >
                                {processando ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Aprovando...
                                  </>
                                ) : (
                                  <>
                                    <span className="me-2">✅</span>
                                    Aprovar
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* MODO REJEIÇÃO */
                          <div className="row">
                            <div className="col-md-8">
                              <div className="alert alert-danger">
                                <h6>❌ Você está rejeitando esta solicitação</h6>
                                <p>
                                  Ao rejeitar, a solicitação será marcada como "Rejeitada" 
                                  e não será enviada para o estoque.
                                </p>
                                
                                <div className="mt-3">
                                  <label className="form-label">
                                    <strong>Motivo da Rejeição *</strong>
                                  </label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    value={motivoRejeicao}
                                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                                    placeholder="Descreva o motivo da rejeição (obrigatório)..."
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-md-4 text-end">
                              <button
                                className="btn btn-secondary btn-lg me-2"
                                onClick={() => setModoRejeicao(false)}
                                disabled={processando}
                              >
                                ↩️ Voltar
                              </button>
                              <button
                                className="btn btn-danger btn-lg"
                                onClick={handleRejeitar}
                                disabled={processando || !motivoRejeicao.trim()}
                              >
                                {processando ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Rejeitando...
                                  </>
                                ) : (
                                  <>
                                    <span className="me-2">❌</span>
                                    Confirmar Rejeição
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AprovarSolicitacao;