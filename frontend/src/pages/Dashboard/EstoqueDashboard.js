import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';


const EstoqueDashboard = () => {
  const { user, podeRealizar } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [abaAtiva, setAbaAtiva] = useState('pendentes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dados das abas
  const [solicitacoes, setSolicitacoes] = useState({
    pendentes: [],
    para_entrega: [],
    rejeitadas: [],
    todas: []
  });
  
  // Estatísticas
  const [estatisticas, setEstatisticas] = useState({
    pendentes: 0,
    para_entrega: 0,
    rejeitadas: 0,
    total_processadas: 0,
    hoje: 0,
    urgentes: 0
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // 1. Carregar estatísticas
      const statsResponse = await api.get('/estoque/estatisticas');
      if (statsResponse.data.success) {
        setEstatisticas(statsResponse.data.data);
      }
      
      // 2. Carregar todas as solicitações do estoque
      await Promise.all([
        carregarPendentes(),
        carregarParaEntrega(),
        carregarRejeitadas(),
        carregarHistorico()
      ]);
      
    } catch (err) {
      setError('Erro ao carregar dados do estoque');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const carregarPendentes = async () => {
    try {
      const response = await api.get('/solicitacoes/para-estoque');
      if (response.data.success) {
        setSolicitacoes(prev => ({ ...prev, pendentes: response.data.data }));
      }
    } catch (error) {
      console.error('Erro ao carregar pendentes:', error);
    }
  };

  const carregarParaEntrega = async () => {
    try {
      const response = await api.get('/solicitacoes/para-entrega');
      if (response.data.success) {
        setSolicitacoes(prev => ({ ...prev, para_entrega: response.data.data }));
      }
    } catch (error) {
      console.error('Erro ao carregar para entrega:', error);
    }
  };

  const carregarRejeitadas = async () => {
    try {
      const response = await api.get('/solicitacoes/rejeitadas-estoque');
      if (response.data.success) {
        setSolicitacoes(prev => ({ ...prev, rejeitadas: response.data.data }));
      }
    } catch (error) {
      console.error('Erro ao carregar rejeitadas:', error);
    }
  };

  const carregarHistorico = async () => {
    try {
      const response = await api.get('/estoque/historico');
      if (response.data.success) {
        setSolicitacoes(prev => ({ ...prev, todas: response.data.data }));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const processarEstoque = async (id, acao) => {
    // Verificar permissão
    if (!podeRealizar('criar', 'movimentacoes') && 
        !['admin_estoque', 'admin'].includes(user?.perfil)) {
      alert('❌ Você não tem permissão para processar solicitações no estoque');
      return;
    }

    const confirmMsg = acao === 'aceitar' 
      ? 'Deseja aceitar e processar esta solicitação no estoque?'
      : 'Deseja rejeitar esta solicitação?';
    
    if (!window.confirm(confirmMsg)) return;

    const observacoes = acao === 'aceitar' 
      ? '' 
      : prompt('Digite o motivo da rejeição:');
    
    if (acao === 'rejeitar' && !observacoes) return;

    try {
      const response = await api.put(`/solicitacoes/${id}/processar-estoque`, {
        acao: acao,
        observacoes_estoque: observacoes
      });

      if (response.data.success) {
        alert(`✅ Solicitação ${acao === 'aceitar' ? 'aceita' : 'rejeitada'} com sucesso!`);
        carregarDados(); // Recarregar tudo
      }
    } catch (err) {
      alert('❌ Erro ao processar solicitação');
      console.error(err);
    }
  };

  const finalizarEntrega = async (id) => {
    if (!window.confirm('Deseja finalizar e marcar como entregue?')) return;
    
    try {
      const response = await api.put(`/solicitacoes/${id}/finalizar`);
      
      if (response.data.success) {
        alert('✅ Solicitação finalizada e marcada como entregue!');
        carregarDados();
      }
    } catch (error) {
      alert('❌ Erro ao finalizar entrega');
      console.error(error);
    }
  };

  // Funções auxiliares
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrioridadeBadge = (prioridade) => {
    const classes = {
      urgente: 'badge-urgente',
      alta: 'badge-alta',
      media: 'badge-media',
      baixa: 'badge-baixa'
    };
    return classes[prioridade] || 'badge-media';
  };

  const getStatusBadge = (status) => {
    const classes = {
      aprovada: 'badge-aprovada',
      em_analise: 'badge-processando',
      entregue: 'badge-entregue',
      rejeitada_estoque: 'badge-rejeitada',
      rejeitada: 'badge-rejeitada',
      cancelada: 'badge-cancelada'
    };
    return classes[status] || 'badge-pendente';
  };

  if (loading) {
    return (
      <div className="estoque-loading">
        <div className="spinner"></div>
        <p>Carregando dashboard do estoque...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estoque-error">
        <div className="error-icon">❌</div>
        <h3>{error}</h3>
        <button onClick={carregarDados} className="btn-retry">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="estoque-dashboard">
      {/* CABEÇALHO */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📦 Dashboard do Estoque</h1>
          <p className="subtitle">
            <strong>Usuário:</strong> {user?.nome} | 
            <strong> Perfil:</strong> {user?.perfil} | 
            <strong> Departamento:</strong> {user?.departamento}
          </p>
        </div>
        <div className="header-right">
          <button className="btn-refresh" onClick={carregarDados}>
            🔄 Atualizar
          </button>
          <span className="last-update">
            Última atualização: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="stats-cards">
        <div className="stats-card card-pendentes" onClick={() => setAbaAtiva('pendentes')}>
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <h3>{estatisticas.pendentes}</h3>
            <p>Pendentes</p>
          </div>
        </div>

        <div className="stats-card card-entregas" onClick={() => setAbaAtiva('para_entrega')}>
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>{estatisticas.para_entrega}</h3>
            <p>Para Entrega</p>
          </div>
        </div>

        <div className="stats-card card-rejeitadas" onClick={() => setAbaAtiva('rejeitadas')}>
          <div className="card-icon">❌</div>
          <div className="card-content">
            <h3>{estatisticas.rejeitadas}</h3>
            <p>Rejeitadas</p>
          </div>
        </div>

        <div className="stats-card card-total" onClick={() => setAbaAtiva('todas')}>
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{estatisticas.total_processadas}</h3>
            <p>Total Processadas</p>
          </div>
        </div>
      </div>

      {/* MENU DE ABAS */}
      <div className="abas-menu">
        <button 
          className={`aba-btn ${abaAtiva === 'pendentes' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('pendentes')}
        >
          ⏳ Pendentes ({solicitacoes.pendentes.length})
        </button>
        <button 
          className={`aba-btn ${abaAtiva === 'para_entrega' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('para_entrega')}
        >
          📦 Para Entrega ({solicitacoes.para_entrega.length})
        </button>
        <button 
          className={`aba-btn ${abaAtiva === 'rejeitadas' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('rejeitadas')}
        >
          ❌ Rejeitadas ({solicitacoes.rejeitadas.length})
        </button>
        <button 
          className={`aba-btn ${abaAtiva === 'todas' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('todas')}
        >
          📊 Histórico ({solicitacoes.todas.length})
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="conteudo-abas">
        
        {/* ABA: PENDENTES */}
        {abaAtiva === 'pendentes' && (
          <div className="aba-conteudo">
            <div className="aba-header">
              <h2>⏳ Solicitações Pendentes</h2>
              <p>{solicitacoes.pendentes.length} solicitações aguardando processamento</p>
            </div>
            
            {solicitacoes.pendentes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>Nenhuma solicitação pendente</h3>
                <p>Todas as solicitações já foram processadas.</p>
              </div>
            ) : (
              <div className="solicitacoes-table">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Título</th>
                      <th>Solicitante</th>
                      <th>Data Envio</th>
                      <th>Prioridade</th>
                      <th>Itens</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitacoes.pendentes.map((solic) => (
                      <tr key={solic.id}>
                        <td><strong>{solic.codigo_solicitacao}</strong></td>
                        <td>
                          <div>
                            <strong>{solic.titulo}</strong>
                            <small>{solic.descricao?.substring(0, 60)}...</small>
                          </div>
                        </td>
                        <td>{solic.solicitante_nome}</td>
                        <td>{formatarData(solic.data_envio_estoque)}</td>
                        <td>
                          <span className={`prioridade-badge ${getPrioridadeBadge(solic.prioridade)}`}>
                            {solic.prioridade}
                          </span>
                        </td>
                        <td>{solic.total_itens || 0}</td>
                        <td>
                          <div className="acoes-botoes">
                            <button
                              className="btn-aceitar"
                              onClick={() => processarEstoque(solic.id, 'aceitar')}
                              title="Aceitar no estoque"
                            >
                              ✅ Aceitar
                            </button>
                            <button
                              className="btn-rejeitar"
                              onClick={() => processarEstoque(solic.id, 'rejeitar')}
                              title="Rejeitar"
                            >
                              ❌ Rejeitar
                            </button>
                            <button
                              className="btn-detalhes"
                              onClick={() => navigate(`/solicitacoes/${solic.id}`)}
                              title="Ver detalhes"
                            >
                              👁 Detalhes
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA: PARA ENTREGA */}
        {abaAtiva === 'para_entrega' && (
          <div className="aba-conteudo">
            <div className="aba-header">
              <h2>📦 Solicitações Prontas para Entrega</h2>
              <p>{solicitacoes.para_entrega.length} solicitações aceitas no estoque</p>
            </div>
            
            {solicitacoes.para_entrega.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>Nenhuma solicitação para entrega</h3>
                <p>Nenhuma solicitação foi processada e aceita no estoque ainda.</p>
              </div>
            ) : (
              <div className="solicitacoes-table">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Título</th>
                      <th>Solicitante</th>
                      <th>Data Processamento</th>
                      <th>Status</th>
                      <th>Itens</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitacoes.para_entrega.map((solic) => (
                      <tr key={solic.id}>
                        <td><strong>{solic.codigo_solicitacao}</strong></td>
                        <td>{solic.titulo}</td>
                        <td>{solic.solicitante_nome}</td>
                        <td>{formatarData(solic.data_processamento_estoque)}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadge(solic.status)}`}>
                            {solic.status}
                          </span>
                        </td>
                        <td>{solic.total_itens || 0}</td>
                        <td>
                          <div className="acoes-botoes">
                            <button
                              className="btn-entregar"
                              onClick={() => finalizarEntrega(solic.id)}
                              title="Finalizar entrega"
                            >
                              📦 Entregar
                            </button>
                            <button
                              className="btn-detalhes"
                              onClick={() => navigate(`/solicitacoes/${solic.id}`)}
                              title="Ver detalhes"
                            >
                              👁 Detalhes
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA: REJEITADAS */}
        {abaAtiva === 'rejeitadas' && (
          <div className="aba-conteudo">
            <div className="aba-header">
              <h2>❌ Solicitações Rejeitadas pelo Estoque</h2>
              <p>{solicitacoes.rejeitadas.length} solicitações rejeitadas</p>
            </div>
            
            {solicitacoes.rejeitadas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>Nenhuma solicitação rejeitada</h3>
                <p>Todas as solicitações foram aceitas no estoque.</p>
              </div>
            ) : (
              <div className="solicitacoes-table">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Título</th>
                      <th>Solicitante</th>
                      <th>Data Rejeição</th>
                      <th>Motivo</th>
                      <th>Itens</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitacoes.rejeitadas.map((solic) => (
                      <tr key={solic.id}>
                        <td><strong>{solic.codigo_solicitacao}</strong></td>
                        <td>{solic.titulo}</td>
                        <td>{solic.solicitante_nome}</td>
                        <td>{formatarData(solic.data_rejeicao_estoque)}</td>
                        <td>
                          <span className="motivo-rejeicao">
                            {solic.motivo_rejeicao_estoque || 'Sem motivo informado'}
                          </span>
                        </td>
                        <td>{solic.total_itens || 0}</td>
                        <td>
                          <button
                            className="btn-detalhes"
                            onClick={() => navigate(`/solicitacoes/${solic.id}`)}
                          >
                            👁 Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA: HISTÓRICO */}
        {abaAtiva === 'todas' && (
          <div className="aba-conteudo">
            <div className="aba-header">
              <h2>📊 Histórico Completo do Estoque</h2>
              <p>{solicitacoes.todas.length} solicitações processadas</p>
            </div>
            
            {solicitacoes.todas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>Nenhum registro no histórico</h3>
                <p>Nenhuma solicitação foi processada no estoque ainda.</p>
              </div>
            ) : (
              <div className="solicitacoes-table">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Título</th>
                      <th>Solicitante</th>
                      <th>Status</th>
                      <th>Data Processamento</th>
                      <th>Responsável</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitacoes.todas.map((solic) => (
                      <tr key={solic.id}>
                        <td><strong>{solic.codigo_solicitacao}</strong></td>
                        <td>{solic.titulo}</td>
                        <td>{solic.solicitante_nome}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadge(solic.status)}`}>
                            {solic.status}
                          </span>
                        </td>
                        <td>{formatarData(solic.data_processamento_estoque)}</td>
                        <td>{solic.responsavel_estoque || 'Sistema'}</td>
                        <td>
                          <button
                            className="btn-detalhes"
                            onClick={() => navigate(`/solicitacoes/${solic.id}`)}
                          >
                            👁 Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EstoqueDashboard;