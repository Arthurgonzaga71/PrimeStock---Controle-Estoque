// frontend/src/pages/Solicitacao/ListaSolicitacoes.js - VERSÃO SEM LIMITES
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './ListaSolicitacoes.css';

const ListaSolicitacoes = () => {
  const { user, podeRealizar, flags } = useAuth();
  const navigate = useNavigate();
  
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPendentes, setLoadingPendentes] = useState(false);
  const [error, setError] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('minhas');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // 🔄 CARREGAR MINHAS SOLICITAÇÕES
  const fetchMinhasSolicitacoes = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // 🔥 REMOVIDO: Filtro obrigatório por perfil (mantendo a lógica original)
      let endpoint = '/solicitacoes';
      let params = { page, limit: 10 };
      
      if (['tecnico', 'analista'].includes(user?.perfil)) {
        endpoint = '/solicitacoes/minhas';
      }
      
      const response = await api.get(endpoint, { params });
      
      if (response.data.success) {
        const solicitacoesData = response.data.data.solicitacoes || response.data.data || [];
        
        // 🔥 REMOVIDO: Validação de limites excedidos
        setSolicitacoes(solicitacoesData);
        setPagination(response.data.data.pagination || response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: solicitacoesData.length,
          itemsPerPage: 10
        });
      } else {
        throw new Error(response.data.error || 'Erro ao buscar solicitações');
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('❌ Erro ao buscar minhas solicitações:', err);
      
      let errorMessage = 'Erro ao carregar suas solicitações';
      
      if (err.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
        navigate('/login');
      } else if (err.response?.status === 403) {
        errorMessage = '❌ Acesso negado. Você não tem permissão para ver estas solicitações.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSolicitacoes([]);
      setLoading(false);
    }
  };

  // 🔄 CARREGAR SOLICITAÇÕES PENDENTES
  const fetchSolicitacoesPendentes = async () => {
    // 🔥 MANTIDO: Restrição de perfil para ver pendentes
    if (['tecnico', 'analista'].includes(user?.perfil)) {
      setSolicitacoesPendentes([]);
      return;
    }
    
    const perfisPermitidos = ['coordenador', 'gerente', 'admin', 'admin_estoque'];
    if (!user?.perfil || !perfisPermitidos.includes(user.perfil)) {
      return;
    }
    
    try {
      setLoadingPendentes(true);
      
      const response = await api.get('/solicitacoes/pendentes');
      
      if (response.data.success) {
        const pendentesData = response.data.data || [];
        
        // 🔥 REMOVIDO: Validação de limites excedidos
        setSolicitacoesPendentes(pendentesData);
      } else {
        throw new Error(response.data.error || 'Erro ao buscar pendentes');
      }
      
      setLoadingPendentes(false);
      
    } catch (err) {
      console.error('❌ Erro ao buscar pendentes:', err);
      setSolicitacoesPendentes([]);
      setLoadingPendentes(false);
    }
  };

  // 🎯 FUNÇÃO SIMPLIFICADA: CALCULAR DADOS DA SOLICITAÇÃO
  const calcularDadosSolicitacao = (solicitacao) => {
    if (!solicitacao) return { 
      totalItens: 0,
      valorTotal: 0
    };
    
    try {
      const totalItens = Number(solicitacao.total_itens) || 
                        Number(solicitacao.itens?.length) || 
                        0;
      
      let valorTotal = 0;
      
      if (solicitacao.valor_total_estimado !== undefined && solicitacao.valor_total_estimado !== null) {
        valorTotal = Number(solicitacao.valor_total_estimado) || 0;
      } else if (solicitacao.orcamento_estimado !== undefined && solicitacao.orcamento_estimado !== null) {
        valorTotal = Number(solicitacao.orcamento_estimado) || 0;
      } else if (solicitacao.itens?.length > 0) {
        valorTotal = solicitacao.itens.reduce((total, item) => {
          const valor = Number(item.valor_unitario_estimado) || 0;
          const quantidade = Number(item.quantidade_solicitada) || 1;
          return total + (valor * quantidade);
        }, 0);
      }
      
      return {
        totalItens,
        valorTotal: Number(valorTotal) || 0
      };
    } catch (error) {
      console.error('❌ Erro ao calcular dados:', error);
      return { totalItens: 0, valorTotal: 0 };
    }
  };

  // 🎯 RENDER STATUS SIMPLES
  const renderStatus = (status) => {
    const getStatusInfo = (status) => {
      const statusMap = {
        'rascunho': { text: 'Rascunho', className: 'status-rascunho', icon: '📝' },
        'pendente_aprovacao': { text: 'Pendente', className: 'status-pendente', icon: '⏳' },
        'aprovada': { text: 'Aprovada', className: 'status-aprovada', icon: '✅' },
        'rejeitada_coordenador': { text: 'Rejeitada', className: 'status-rejeitada', icon: '❌' },
        'rejeitada_gerente': { text: 'Rejeitada Gerente', className: 'status-rejeitada', icon: '❌' },
        'em_processo_estoque': { text: 'Em Processo', className: 'status-processo', icon: '🔄' },
        'entregue': { text: 'Entregue', className: 'status-entregue', icon: '🎁' },
        'rejeitada_estoque': { text: 'Rejeitada Est.', className: 'status-rejeitada-estoque', icon: '🚫' },
        'cancelada': { text: 'Cancelada', className: 'status-cancelada', icon: '🗑️' }
      };
      
      return statusMap[status] || { text: status, className: 'status-default', icon: '⚪' };
    };

    const statusInfo = getStatusInfo(status);
    
    return (
      <div className="status-container">
        <span className={`status-badge-local ${statusInfo.className}`}>
          <span className="status-icon-local">{statusInfo.icon}</span>
          <span className="status-text-local">{statusInfo.text}</span>
        </span>
      </div>
    );
  };

  // 📊 FORMATADORES
  const formatarData = (dataString) => {
    if (!dataString) return 'Data não informada';
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return 'Data inválida';
      
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const formatarMoeda = (valor) => {
    const valorNumero = Number(valor) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumero);
  };

  // 🎛️ AÇÕES DISPONÍVEIS
  const getAcoesDisponiveis = (solicitacao) => {
    const acoes = [];
    const meuUsuarioId = user?.id;
    const isMinhaSolicitacao = solicitacao.usuario_solicitante_id === meuUsuarioId;
    
    const podeAprovarEstaSolicitacao = podeRealizar('aprovar', 'solicitacoes') && 
                                       solicitacao.status === 'pendente_aprovacao';
    
    if (isMinhaSolicitacao) {
      if (solicitacao.status === 'rascunho') {
        acoes.push(
          { label: '✏️ Editar', action: () => navigate(`/solicitacoes/${solicitacao.id}/editar`) },
          { label: '📤 Enviar para Aprovação', action: () => handleEnviarParaAprovacao(solicitacao.id), primary: true },
          { label: '🗑️ Cancelar', action: () => handleCancelarSolicitacao(solicitacao.id), danger: true }
        );
      }
      
      if (solicitacao.status === 'pendente_aprovacao') {
        acoes.push(
          { label: '👁️ Ver Detalhes', action: () => navigate(`/solicitacoes/${solicitacao.id}`) },
          { label: '🗑️ Cancelar', action: () => handleCancelarSolicitacao(solicitacao.id), danger: true }
        );
      }
      
      if (['aprovada', 'em_processo_estoque', 'entregue'].includes(solicitacao.status)) {
        acoes.push(
          { label: '👁️ Ver Detalhes', action: () => navigate(`/solicitacoes/${solicitacao.id}`) }
        );
      }
      
      if (solicitacao.status.includes('rejeitada') || solicitacao.status === 'cancelada') {
        acoes.push(
          { label: '👁️ Ver Detalhes', action: () => navigate(`/solicitacoes/${solicitacao.id}`) },
          { label: '📦 Criar Nova', action: () => navigate('/solicitacoes/nova') }
        );
      }
    } else if (podeAprovarEstaSolicitacao) {
      acoes.push(
        { label: '✅ Aprovar/Rejeitar', action: () => navigate(`/solicitacoes/${solicitacao.id}/aprovar`), primary: true }
      );
    } else {
      acoes.push(
        { label: '👁️ Ver Detalhes', action: () => navigate(`/solicitacoes/${solicitacao.id}`) }
      );
    }
    
    return acoes;
  };

  // ⚡ CARREGAR DADOS INICIAIS
  useEffect(() => {
    fetchMinhasSolicitacoes();
    fetchSolicitacoesPendentes();
  }, [user]);

  // ✅ COMPONENTE DE CABEÇALHO SIMPLIFICADO
  const HeaderSolicitacoes = () => (
    <div className="solicitacoes-header">
      <div className="header-info">
        <h1 className="solicitacoes-title">
          📋 Solicitações 
          <span className="perfil-badge">
            {user?.perfil?.toUpperCase()}
          </span>
        </h1>
        <p className="solicitacoes-subtitle">
          {abaAtiva === 'minhas' ? 'Gerencie suas solicitações' : 'Solicitações aguardando aprovação'}
        </p>
        
        {/* 🔥 REMOVIDO: Card de limites do usuário */}
      </div>
      
      <Link to="/solicitacoes/nova" className="btn-primary">
        <span>+</span> Nova Solicitação
      </Link>
    </div>
  );

  // ✅ COMPONENTE DE CARD SIMPLIFICADO
  const CardSolicitacao = ({ solicitacao }) => {
    const acoes = getAcoesDisponiveis(solicitacao);
    const dados = calcularDadosSolicitacao(solicitacao);
    
    return (
      <div className={`solicitacao-card ${solicitacao.status}`}>
        <div className="solicitacao-card-header">
          <div className="solicitacao-card-info">
            <div className="solicitacao-card-title">
              <span className="codigo">{solicitacao.codigo_solicitacao || `SOL-${solicitacao.id}`}</span>
              <h3>{solicitacao.titulo || 'Solicitação sem título'}</h3>
              <div className="status-wrapper">
                {renderStatus(solicitacao.status)}
                
                {/* 🔥 REMOVIDO: Badges de limites excedidos */}
                <div className="badges-dados">
                  <span className="badge-dado">
                    📦 {dados.totalItens} itens
                  </span>
                  <span className="badge-dado">
                    💰 {formatarMoeda(dados.valorTotal)}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="solicitacao-card-desc">
              {solicitacao.descricao || 'Sem descrição'}
            </p>
            
            <div className="solicitacao-card-meta">
              <span><strong>Solicitante:</strong> {solicitacao.solicitante_nome || solicitacao.usuario_solicitante_nome || user?.nome}</span>
              <span><strong>Perfil:</strong> {solicitacao.solicitante_perfil || solicitacao.usuario_solicitante_perfil || user?.perfil}</span>
              <span><strong>Prioridade:</strong> {solicitacao.prioridade || 'Normal'}</span>
              <span><strong>Criada em:</strong> {formatarData(solicitacao.data_solicitacao || solicitacao.created_at)}</span>
              
              {/* 🔥 REMOVIDO: Alerta de limites excedidos */}
            </div>
          </div>
          
          <div className="solicitacao-card-actions">
            <Link 
              to={`/solicitacoes/${solicitacao.id}`}
              className="btn-action btn-view"
            >
              👁️ Ver Detalhes
            </Link>
            
            {acoes.map((acao, index) => (
              <button
                key={index}
                onClick={acao.action}
                className={`btn-action ${acao.primary ? 'btn-primary' : ''} ${acao.danger ? 'btn-danger' : ''}`}
                disabled={acao.primary && ['tecnico', 'analista'].includes(user?.perfil)}
              >
                {acao.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 🔄 MUDAR PÁGINA
  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= pagination.totalPages) {
      fetchMinhasSolicitacoes(novaPagina);
    }
  };

  // 🗑️ CANCELAR SOLICITAÇÃO
  const handleCancelarSolicitacao = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta solicitação?')) return;
    
    try {
      const response = await api.delete(`/solicitacoes/${id}`, {
        data: { motivo: 'Cancelada pelo usuário' }
      });
      
      if (response.data.success) {
        setSolicitacoes(prev => prev.filter(s => s.id !== id));
        alert('Solicitação cancelada com sucesso!');
      } else {
        throw new Error(response.data.error);
      }
      
    } catch (err) {
      console.error('❌ Erro ao cancelar:', err);
      alert(`Erro ao cancelar solicitação: ${err.response?.data?.error || err.message}`);
    }
  };

  // 📤 ENVIAR PARA APROVAÇÃO
  const handleEnviarParaAprovacao = async (id) => {
    try {
      const response = await api.put(`/solicitacoes/${id}/enviar`);
      
      if (response.data.success) {
        setSolicitacoes(prev => prev.map(s => 
          s.id === id ? { ...s, status: 'pendente_aprovacao' } : s
        ));
        
        alert('Solicitação enviada para aprovação com sucesso!');
      } else {
        throw new Error(response.data.error);
      }
      
    } catch (err) {
      console.error('❌ Erro ao enviar para aprovação:', err);
      alert(`Erro ao enviar para aprovação: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="solicitacoes-page">
      <div className="content-wrapper">
        {/* ✅ CABEÇALHO SIMPLIFICADO */}
        <HeaderSolicitacoes />

        {/* ✅ ABAS */}
        <div className="solicitacoes-tabs">
          <button
            onClick={() => {
              setAbaAtiva('minhas');
              fetchMinhasSolicitacoes();
            }}
            className={`solicitacoes-tab ${abaAtiva === 'minhas' ? 'active' : ''}`}
          >
            Minhas Solicitações 
            <span className="tab-count">{pagination.totalItems}</span>
          </button>
          
          {user?.perfil && !['tecnico', 'analista'].includes(user.perfil) && (
            <button
              onClick={() => {
                setAbaAtiva('pendentes');
                fetchSolicitacoesPendentes();
              }}
              className={`solicitacoes-tab ${abaAtiva === 'pendentes' ? 'active' : ''}`}
            >
              Pendentes de Aprovação 
              <span className="tab-count">{solicitacoesPendentes.length}</span>
            </button>
          )}
        </div>

        {/* CONTEÚDO - MINHAS SOLICITAÇÕES */}
        {abaAtiva === 'minhas' && (
          <div>
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Carregando suas solicitações...</p>
              </div>
            ) : solicitacoes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>Nenhuma solicitação encontrada</h3>
                <p>Comece criando sua primeira solicitação.</p>
                <Link to="/solicitacoes/nova" className="btn-primary">
                  <span>+</span> Criar Primeira Solicitação
                </Link>
              </div>
            ) : (
              <>
                <div className="solicitacoes-list">
                  {solicitacoes.map((solicitacao) => (
                    <CardSolicitacao 
                      key={solicitacao.id} 
                      solicitacao={solicitacao} 
                    />
                  ))}
                </div>
                
                {/* PAGINAÇÃO */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => mudarPagina(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Anterior
                    </button>
                    
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => mudarPagina(i + 1)}
                        className={`pagination-btn ${pagination.currentPage === i + 1 ? 'active' : ''}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button 
                      onClick={() => mudarPagina(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="pagination-btn"
                    >
                      Próxima →
                    </button>
                    
                    <span className="pagination-info">
                      Página {pagination.currentPage} de {pagination.totalPages} 
                      • {pagination.totalItems} solicitações
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CONTEÚDO - PENDENTES DE APROVAÇÃO */}
        {abaAtiva === 'pendentes' && !['tecnico', 'analista'].includes(user?.perfil) && (
          <div>
            {loadingPendentes ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Carregando solicitações pendentes...</p>
              </div>
            ) : solicitacoesPendentes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3>Nenhuma solicitação pendente</h3>
                <p>Todas as solicitações foram processadas.</p>
              </div>
            ) : (
              <div className="solicitacoes-list">
                {solicitacoesPendentes.map((solicitacao) => (
                  <CardSolicitacao 
                    key={solicitacao.id} 
                    solicitacao={solicitacao} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MENSAGEM PARA TÉCNICO/ANALISTA TENTANDO ACESSAR PENDENTES */}
        {abaAtiva === 'pendentes' && ['tecnico', 'analista'].includes(user?.perfil) && (
          <div className="acesso-negado-card">
            <div className="acesso-negado-icon">🚫</div>
            <h3>Acesso Negado</h3>
            <p>
              <strong>❌ Técnicos e analistas NÃO PODEM aprovar solicitações.</strong>
            </p>
            <p className="acesso-negado-detalhes">
              Sua função é cadastrar itens e criar solicitações. 
              A aprovação é restrita a coordenadores, gerentes e administradores.
            </p>
            <button 
              onClick={() => setAbaAtiva('minhas')}
              className="btn-primary"
            >
              ← Voltar para Minhas Solicitações
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaSolicitacoes;