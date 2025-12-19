// SolicitacoesParaEstoque.js - VERSÃO COMPLETAMENTE CORRIGIDA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './SolicitacoesParaEstoque.css';

const SolicitacoesParaEstoque = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('para_processar');
  const [processandoIds, setProcessandoIds] = useState(new Set());
  const [historicoVisivel, setHistoricoVisivel] = useState(true);
  const [atualizarLista, setAtualizarLista] = useState(0);

  useEffect(() => {
    verificarPermissaoECarregar();
  }, [user, atualizarLista]);

  const verificarPermissaoECarregar = async () => {
    if (!user) return;
    
    const temPermissao = ['admin_estoque', 'admin'].includes(user.perfil);
    
    if (!temPermissao) {
      setError('❌ Seu perfil não tem permissão para acessar esta página');
      setLoading(false);
      return;
    }
    
    await carregarSolicitacoes();
  };

  const carregarSolicitacoes = async () => {
    try {
      setLoading(true);
      console.log('🔄 [ESTOQUE] Carregando todas as solicitações...');
      
      // Carrega TODAS as solicitações do estoque, não apenas aprovadas
      const response = await api.get('/solicitacoes/para-estoque');
      
      if (response.data.success) {
        const dados = response.data.data || [];
        console.log('📦 Solicitações carregadas:', dados.length);
        console.log('📊 Status encontrados:', [...new Set(dados.map(s => s.status))]);
        
        setSolicitacoes(dados);
        setError(null);
      } else {
        setError('Erro ao carregar solicitações: ' + (response.data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      setError(`Falha ao carregar solicitações: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessar = async (id, acao, statusAtual) => {
    if (!['admin_estoque', 'admin'].includes(user?.perfil)) {
      alert('❌ Sem permissão');
      return;
    }

    if (processandoIds.has(id)) {
      alert('⚠️ Esta solicitação já está sendo processada');
      return;
    }

    let confirmMessage;
    let dadosEnvio = { acao };

    // ============ FLUXO CORRIGIDO ============
    
    // ESTÁGIO 1: ACEITAR NO ESTOQUE (de 'aprovada' para 'processando_estoque')
    if (acao === 'aceitar' && statusAtual === 'aprovada') {
      confirmMessage = `✅ ACEITAR solicitação no estoque?\n\nA solicitação ficará como:\n🔍 "EM PROCESSAMENTO" para preparação da entrega`;
      
      const observacoes = prompt('Observações (opcional):', `Aceita por ${user.nome} - Em preparação`);
      if (observacoes === null) return;
      
      dadosEnvio.observacoes_estoque = observacoes;

    // ESTÁGIO 2: ENTREGAR (de 'processando_estoque' para 'entregue')
    } else if (acao === 'entregar' && statusAtual === 'processando_estoque') {
      confirmMessage = `📦 FINALIZAR ENTREGA?\n\nEsta ação marcará a solicitação como ENTREGUE.\n\nA solicitação permanecerá no HISTÓRICO.`;
      
      // Pedir quantidade entregue
      const quantidade = prompt('Quantidade efetivamente entregue:', '1');
      if (quantidade === null || !quantidade.trim()) {
        alert('❌ Quantidade é obrigatória');
        return;
      }
      
      if (isNaN(quantidade) || parseInt(quantidade) <= 0) {
        alert('❌ Quantidade inválida');
        return;
      }
      
      dadosEnvio.quantidade_entregue = parseInt(quantidade);
      
      const observacoes = prompt('Observações da entrega (opcional):', `Entregue por ${user.nome}`);
      if (observacoes === null) return;
      dadosEnvio.observacoes_estoque = observacoes;

    // ESTÁGIO 3: REJEITAR (em qualquer ponto para 'rejeitada_estoque')
    } else if (acao === 'rejeitar') {
      const motivo = prompt('❌ MOTIVO DA REJEIÇÃO (obrigatório):', '');
      if (motivo === null || !motivo.trim()) {
        alert('❌ Motivo da rejeição é obrigatório');
        return;
      }
      
      const statusRejeicao = statusAtual === 'aprovada' || statusAtual === 'processando_estoque' 
        ? 'rejeitada_estoque' 
        : 'rejeitada';
      
      confirmMessage = `❌ REJEITAR solicitação no estoque?\n\nMotivo: ${motivo}\n\nStatus final: ${statusRejeicao}\n\nA solicitação permanecerá no HISTÓRICO.`;
      dadosEnvio.observacoes_estoque = motivo;
      
    } else {
      alert(`❌ Ação "${acao}" não disponível para status "${statusAtual}"`);
      return;
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      setProcessandoIds(prev => new Set(prev).add(id));
      
      console.log('📤 Processando:', { id, ...dadosEnvio });
      
      const response = await api.put(`/solicitacoes/${id}/processar-estoque`, dadosEnvio);

      if (response.data.success) {
        const resultado = response.data.data;
        
        // Mensagem personalizada
        let mensagemSucesso = '';
        
        if (acao === 'aceitar') {
          mensagemSucesso = `✅ Solicitação aceita no estoque!\n\n📋 Agora está como "EM PROCESSAMENTO" para preparação.\n\n📍 Vá para aba "EM PROCESSAMENTO" para finalizar entrega.`;
        } else if (acao === 'entregar') {
          mensagemSucesso = `📦 ENTREGA REGISTRADA COM SUCESSO!\n\n✅ Solicitação marcada como ENTREGUE.\n📊 Quantidade: ${dadosEnvio.quantidade_entregue}\n\n📍 Vá para aba "HISTÓRICO" para visualizar.`;
        } else if (acao === 'rejeitar') {
          mensagemSucesso = `❌ SOLICITAÇÃO REJEITADA!\n\n📍 Vá para aba "HISTÓRICO" para visualizar.`;
        }
        
        alert(mensagemSucesso);
        
        // Forçar atualização da lista
        setAtualizarLista(prev => prev + 1);
      } else {
        alert('❌ Erro no processamento: ' + (response.data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      
      let errorMessage = 'Erro ao processar solicitação';
      if (err.response?.status === 404) {
        errorMessage = '❌ Rota não encontrada no servidor';
      } else if (err.response?.data?.error) {
        errorMessage = `❌ ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setProcessandoIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // ============ FILTROS CORRIGIDOS ============
  const paraProcessar = solicitacoes.filter(s => 
    s.status === 'aprovada'
  );
  
  const emProcessamento = solicitacoes.filter(s => 
    s.status === 'processando_estoque'
  );

  const historico = solicitacoes.filter(s => 
    ['entregue', 'rejeitada_estoque', 'rejeitada'].includes(s.status)
  );

  const todasSolicitacoes = solicitacoes;

  const solicitacoesAtuais = () => {
    switch(abaAtiva) {
      case 'todas': return todasSolicitacoes;
      case 'para_processar': return paraProcessar;
      case 'em_processamento': return emProcessamento;
      case 'historico': return historico;
      default: return paraProcessar;
    }
  };

  // ============ FUNÇÕES AUXILIARES CORRIGIDAS ============
  const traduzirStatus = (status) => {
    const statusMap = {
      'aprovada': '✅ APROVADA',
      'pendente': '⏳ PENDENTE',
      'processando_estoque': '🔧 EM PROCESSAMENTO',
      'entregue': '🚚 ENTREGUE',
      'rejeitada_estoque': '❌ REJEITADA (ESTOQUE)',
      'rejeitada': '❌ REJEITADA (COORDENADOR)',
      'rascunho': '📝 RASCUNHO',
      'cancelada': '🚫 CANCELADA'
    };
    
    return statusMap[status] || status;
  };

  const getAcaoDisponivel = (status) => {
    if (status === 'aprovada') {
      return {
        texto: '✅ Aceitar no Estoque',
        classe: 'btn--success',
        acao: 'aceitar'
      };
    } else if (status === 'processando_estoque') {
      return {
        texto: '📦 Finalizar Entrega',
        classe: 'btn--primary',
        acao: 'entregar'
      };
    }
    return null;
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'Não informado';
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
      return dataString;
    }
  };

  const handleRefresh = () => {
    carregarSolicitacoes();
  };

  // ============ RENDERIZAÇÃO ============
  if (loading && solicitacoes.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando solicitações...</p>
      </div>
    );
  }

  if (error && solicitacoes.length === 0) {
    return (
      <div className="error-container">
        <h3>❌ Erro</h3>
        <p>{error}</p>
        <div className="botoes-erro">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn--secondary"
          >
            Voltar ao Dashboard
          </button>
          <button 
            onClick={handleRefresh}
            className="btn btn--primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const solicitacoesFiltradas = solicitacoesAtuais();

  return (
    <div className="solicitacoes-estoque-container">
      {/* CABEÇALHO */}
      <div className="page-header">
        <h1>📦 Gestão de Estoque - Solicitações</h1>
        <p>Controle completo do fluxo de solicitações no estoque</p>
        
        <div className="abas-estoque">
          <button 
            className={`aba-btn ${abaAtiva === 'todas' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('todas')}
            disabled={loading}
            title="Ver todas as solicitações"
          >
            📋 Todas ({solicitacoes.length})
          </button>
          <button 
            className={`aba-btn ${abaAtiva === 'para_processar' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('para_processar')}
            disabled={loading}
            title="Solicitações aprovadas para processar"
          >
            ✅ Para Processar ({paraProcessar.length})
          </button>
          <button 
            className={`aba-btn ${abaAtiva === 'em_processamento' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('em_processamento')}
            disabled={loading}
            title="Solicitações em preparação/entrega"
          >
            🔧 Em Processamento ({emProcessamento.length})
          </button>
          <button 
            className={`aba-btn ${abaAtiva === 'historico' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('historico')}
            disabled={loading}
            title="Solicitações finalizadas (histórico)"
          >
            📜 Histórico ({historico.length})
          </button>
        </div>
      </div>

      {/* CONTROLES SUPERIORES */}
      <div className="acoes-superiores">
        <div className="controles-esquerda">
          <button 
            onClick={handleRefresh} 
            className="btn btn--secondary"
            disabled={loading}
          >
            {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
          </button>
          <button 
            onClick={() => setHistoricoVisivel(!historicoVisivel)}
            className="btn btn--outline"
          >
            {historicoVisivel ? '👁️‍🗨️ Ocultar Resumo' : '📊 Mostrar Resumo'}
          </button>
        </div>
        
        <div className="info-usuario">
          <span className="tag-perfil">{user?.perfil}</span>
          <span>{user?.nome}</span>
          <span className="contador">Total: {solicitacoes.length}</span>
        </div>
      </div>

      {/* RESUMO RÁPIDO */}
      {historicoVisivel && (
        <div className="resumo-rapido">
          <div className="card-resumo">
            <span className="numero">{paraProcessar.length}</span>
            <span className="label">Para Processar</span>
            <span className="status aprovar">Aguardando aceite</span>
          </div>
          <div className="card-resumo">
            <span className="numero">{emProcessamento.length}</span>
            <span className="label">Em Processamento</span>
            <span className="status entregar">Preparando entrega</span>
          </div>
          <div className="card-resumo">
            <span className="numero">{historico.length}</span>
            <span className="label">Histórico</span>
            <span className="status finalizado">Finalizadas</span>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && solicitacoes.length > 0 && (
        <div className="loading-overlay">
          <div className="spinner small"></div>
          <p>Atualizando lista...</p>
        </div>
      )}

      {/* LISTA VAZIA */}
      {solicitacoesFiltradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {abaAtiva === 'todas' ? '📋' : 
             abaAtiva === 'para_processar' ? '📭' : 
             abaAtiva === 'em_processamento' ? '🔧' : '📜'}
          </div>
          <h3>Nenhuma solicitação encontrada</h3>
          <p>
            {abaAtiva === 'todas' 
              ? 'Não há solicitações disponíveis para o estoque.'
              : abaAtiva === 'para_processar' 
              ? 'Não há solicitações aprovadas para processar no estoque.'
              : abaAtiva === 'em_processamento'
              ? 'Não há itens em processamento no estoque.'
              : 'Nenhum histórico encontrado.'}
          </p>
          <div className="empty-actions">
            <button 
              onClick={handleRefresh}
              className="btn btn--secondary"
            >
              Recarregar Lista
            </button>
            <button 
              onClick={() => setAbaAtiva('todas')}
              className="btn btn--outline"
            >
              Ver Todas
            </button>
          </div>
        </div>
      ) : (
        /* LISTA DE SOLICITAÇÕES */
        <div className="cards-grid">
          {solicitacoesFiltradas.map(solicitacao => {
            const estaProcessando = processandoIds.has(solicitacao.id);
            const acao = getAcaoDisponivel(solicitacao.status);
            
            return (
              <div 
                key={solicitacao.id} 
                className={`solicitacao-card ${estaProcessando ? 'processing' : ''} 
                           ${solicitacao.status === 'entregue' ? 'entregue' : ''}
                           ${['rejeitada_estoque', 'rejeitada'].includes(solicitacao.status) ? 'rejeitada' : ''}`}
              >
                {estaProcessando && (
                  <div className="processing-overlay">
                    <div className="spinner small"></div>
                    <p>Processando...</p>
                  </div>
                )}
                
                {/* CABEÇALHO DO CARD */}
                <div className="card-header">
                  <div className="codigo-container">
                    <span className="codigo">{solicitacao.codigo_solicitacao}</span>
                    <span className="data">
                      {formatarData(solicitacao.data_solicitacao)}
                    </span>
                  </div>
                  <span 
                    className="status-badge" 
                    data-status={solicitacao.status}
                    title={`Status: ${solicitacao.status}`}
                  >
                    {traduzirStatus(solicitacao.status)}
                  </span>
                </div>
                
                {/* TÍTULO */}
                <h3 title={solicitacao.titulo}>
                  {solicitacao.titulo}
                  {solicitacao.prioridade === 'alta' && <span className="tag-prioridade alta">ALTA</span>}
                  {solicitacao.prioridade === 'urgente' && <span className="tag-prioridade urgente">URGENTE</span>}
                </h3>
                
                {/* INFORMAÇÕES */}
                <div className="card-info">
                  <div className="info-row">
                    <span className="info-label">👤 Solicitante:</span>
                    <span className="info-value">{solicitacao.solicitante_nome}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">🏢 Departamento:</span>
                    <span className="info-value">{solicitacao.departamento}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📦 Itens:</span>
                    <span className="info-value">{solicitacao.total_itens || 0}</span>
                  </div>
                  
                  {solicitacao.data_aprovacao && (
                    <div className="info-row">
                      <span className="info-label">✅ Aprovada em:</span>
                      <span className="info-value">{formatarData(solicitacao.data_aprovacao)}</span>
                    </div>
                  )}
                  
                  {solicitacao.aprovador_nome && (
                    <div className="info-row">
                      <span className="info-label">👑 Aprovador:</span>
                      <span className="info-value">{solicitacao.aprovador_nome}</span>
                    </div>
                  )}
                  
                  {solicitacao.data_entrega && solicitacao.status === 'entregue' && (
                    <div className="info-row">
                      <span className="info-label">🚚 Entregue em:</span>
                      <span className="info-value">{formatarData(solicitacao.data_entrega)}</span>
                    </div>
                  )}
                  
                  {solicitacao.quantidade_entregue && (
                    <div className="info-row">
                      <span className="info-label">📊 Entregue:</span>
                      <span className="info-value">{solicitacao.quantidade_entregue} item(s)</span>
                    </div>
                  )}
                </div>
                
                {/* AÇÕES */}
                <div className="card-actions">
                  <button 
                    className="btn btn--secondary btn-detalhes"
                    onClick={() => navigate(`/solicitacoes/${solicitacao.id}`)}
                    disabled={estaProcessando}
                    title="Ver detalhes completos"
                  >
                    👁️ Detalhes
                  </button>
                  
                  <div className="botoes-acao">
                    {acao ? (
                      <>
                        <button 
                          className={`btn ${acao.classe}`}
                          onClick={() => handleProcessar(solicitacao.id, acao.acao, solicitacao.status)}
                          disabled={estaProcessando}
                        >
                          {estaProcessando ? '⏳ Processando...' : acao.texto}
                        </button>
                        
                        <button 
                          className="btn btn--danger"
                          onClick={() => handleProcessar(solicitacao.id, 'rejeitar', solicitacao.status)}
                          disabled={estaProcessando}
                        >
                          ❌ Rejeitar
                        </button>
                      </>
                    ) : (
                      <div className="status-final-container">
                        <span className={`status-final ${solicitacao.status === 'entregue' ? 'entregue' : 'rejeitada'}`}>
                          {solicitacao.status === 'entregue' ? '✅ ENTREGUE' : '❌ REJEITADA'}
                        </span>
                        <small className="data-finalizacao">
                          {solicitacao.status === 'entregue' 
                            ? 'Entrega finalizada' 
                            : solicitacao.status === 'rejeitada_estoque'
                            ? 'Rejeitada pelo estoque'
                            : 'Rejeitada pelo coordenador'}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* OBSERVAÇÕES */}
                {(solicitacao.observacoes_entrega || solicitacao.motivo_rejeicao) && (
                  <div className="card-observacoes">
                    <div className="observacoes-header">
                      <span className="observacoes-icon">📝</span>
                      <strong>Observações:</strong>
                    </div>
                    <p className="observacoes-texto">
                      {solicitacao.observacoes_entrega || solicitacao.motivo_rejeicao}
                    </p>
                  </div>
                )}
                
                {/* INFO ADICIONAL PARA HISTÓRICO */}
                {(solicitacao.status === 'entregue' || solicitacao.status.includes('rejeitada')) && (
                  <div className="info-historico">
                    <div className="historico-item">
                      <span className="historico-label">📋 Status:</span>
                      <span className="historico-valor">
                        {solicitacao.status === 'entregue' 
                          ? '✅ Entregue com sucesso' 
                          : solicitacao.status === 'rejeitada_estoque'
                          ? '❌ Rejeitada pelo estoque'
                          : '❌ Rejeitada pelo coordenador'}
                      </span>
                    </div>
                    {solicitacao.data_entrega && (
                      <div className="historico-item">
                        <span className="historico-label">📅 Data finalização:</span>
                        <span className="historico-valor">{formatarData(solicitacao.data_entrega)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* LEGENDA */}
      <div className="legenda-status">
        <div className="legenda-item">
          <span className="legenda-cor status-aprovada"></span>
          <span>✅ Aprovada - Aguardando aceite no estoque</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor status-processamento"></span>
          <span>🔧 Em Processamento - Preparando entrega</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor status-entregue"></span>
          <span>🚚 Entregue - Concluída (histórico)</span>
        </div>
        <div className="legenda-item">
          <span className="legenda-cor status-rejeitada"></span>
          <span>❌ Rejeitada - Cancelada (histórico)</span>
        </div>
      </div>
    </div>
  );
};

export default SolicitacoesParaEstoque;