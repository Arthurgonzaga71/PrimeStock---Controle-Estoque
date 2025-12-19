// frontend/src/contexts/SolicitacaoContext.js - VERSÃO FINAL CORRIGIDA
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import useWebSocket from '../hooks/useWebSocket';
import { solicitacoesService } from '../services/api';

const SolicitacaoContext = createContext();

export const useSolicitacoes = () => {
  const context = useContext(SolicitacaoContext);
  if (!context) {
    throw new Error('useSolicitacoes deve ser usado dentro de SolicitacaoProvider');
  }
  return context;
};

export const SolicitacaoProvider = ({ children }) => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const { user } = useAuth();

  // 🆕 FUNÇÃO PARA VERIFICAR SE USUÁRIO PODE APROVAR
  const usuarioPodeAprovar = useCallback(() => {
    if (!user) return false;
    
    // 🎯 CORRIGIDO: Verifica perfil real do banco, não campo inexistente
    const perfisAprovadores = ['coordenador', 'gerente', 'admin', 'admin_estoque'];
    return perfisAprovadores.includes(user.perfil);
  }, [user]);

  // 🆕 FUNÇÃO PARA VERIFICAR SE É ADMIN ESTOQUE
  const usuarioPodeProcessarEstoque = useCallback(() => {
    if (!user) return false;
    
    const perfisEstoque = ['admin_estoque', 'admin'];
    return perfisEstoque.includes(user.perfil);
  }, [user]);

  // WebSocket para notificações de solicitações
  const { send, isConnected, notifications, clearNotification } = useWebSocket({
    onMessage: (data) => {
      console.log('📨 Mensagem WebSocket no Context:', data.type);
      
      switch(data.type) {
        case 'nova_solicitacao':
          console.log('🆕 Nova solicitação via WebSocket');
          if (usuarioPodeAprovar()) {
            fetchSolicitacoesPendentes();
          }
          break;
          
        case 'solicitacao_aprovada':
        case 'solicitacao_rejeitada':
        case 'solicitacao_entregue':
          console.log('🔄 Atualização de solicitação via WebSocket');
          fetchMinhasSolicitacoes();
          fetchSolicitacoesPendentes();
          break;
          
        default:
          break;
      }
    },
    
    onConnected: () => {
      console.log('🔌 WebSocket conectado no Context de Solicitações');
    },
    
    getUser: () => user
  });

  // 🔥 BUSCAR MINHAS SOLICITAÇÕES
  const fetchMinhasSolicitacoes = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [Context] Buscando minhas solicitações...', params);
      
      const response = await solicitacoesService.getMinhas(params);
      
      console.log('✅ [Context] Resposta completa da API:', response.data);
      
      let dadosSolicitacoes = [];
      let paginacaoInfo = {};
      
      if (response.data && response.data.success) {
        if (response.data.data && response.data.data.solicitacoes) {
          dadosSolicitacoes = Array.isArray(response.data.data.solicitacoes) 
            ? response.data.data.solicitacoes 
            : [];
          paginacaoInfo = response.data.data.pagination || {};
        } else if (Array.isArray(response.data.data)) {
          dadosSolicitacoes = response.data.data;
          paginacaoInfo = {
            currentPage: 1,
            totalPages: 1,
            totalItems: response.data.data.length,
            itemsPerPage: response.data.data.length
          };
        } else if (Array.isArray(response.data)) {
          dadosSolicitacoes = response.data;
          paginacaoInfo = {
            currentPage: 1,
            totalPages: 1,
            totalItems: response.data.length,
            itemsPerPage: response.data.length
          };
        }
      }
      
      console.log('🎯 [Context] Solicitações processadas:', dadosSolicitacoes.length);
      console.log('📊 [Context] Paginação:', paginacaoInfo);
      
      setSolicitacoes(dadosSolicitacoes);
      setPagination(paginacaoInfo);
      
    } catch (error) {
      console.error('❌ [Context] Erro ao buscar solicitações:', error);
      setError('Erro ao carregar solicitações: ' + (error.message || 'Erro desconhecido'));
      setSolicitacoes([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 BUSCAR SOLICITAÇÕES PENDENTES
  const fetchSolicitacoesPendentes = useCallback(async (params = {}) => {
    // 🎯 CORRIGIDO: Verifica usando função corrigida
    if (!usuarioPodeAprovar()) {
      console.log('⚠️ [Context] Usuário não pode ver pendentes');
      setSolicitacoesPendentes([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [Context] Buscando solicitações pendentes...', params);
      
      const response = await solicitacoesService.getPendentes(params);
      
      console.log('✅ [Context] Resposta pendentes:', response.data);
      
      let dadosPendentes = [];
      
      if (response.data && response.data.success) {
        if (response.data.data && Array.isArray(response.data.data)) {
          dadosPendentes = response.data.data;
        } else if (Array.isArray(response.data.data)) {
          dadosPendentes = response.data.data;
        } else if (Array.isArray(response.data)) {
          dadosPendentes = response.data;
        }
      } else if (Array.isArray(response.data)) {
        dadosPendentes = response.data;
      }
      
      console.log('🎯 [Context] Pendentes processadas:', dadosPendentes.length);
      setSolicitacoesPendentes(dadosPendentes);
      
    } catch (error) {
      console.error('❌ [Context] Erro ao buscar solicitações pendentes:', error);
      setError('Erro ao carregar solicitações pendentes');
      setSolicitacoesPendentes([]);
    } finally {
      setLoading(false);
    }
  }, [user, usuarioPodeAprovar]);

  // 🔥 PESQUISA AVANÇADA
  const pesquisarSolicitacoes = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [Context] Executando pesquisa avançada:', filtros);
      
      const response = await solicitacoesService.getAll(filtros);
      
      console.log('✅ [Context] Resultados da pesquisa:', response.data);
      
      let resultados = [];
      let paginacaoInfo = {};
      
      if (response.data && response.data.success && response.data.data) {
        resultados = Array.isArray(response.data.data.solicitacoes) 
          ? response.data.data.solicitacoes 
          : [];
        paginacaoInfo = response.data.data.pagination || {};
      }
      
      console.log('🎯 [Context] Resultados da pesquisa:', resultados.length);
      
      setSolicitacoes(resultados);
      setPagination(paginacaoInfo);
      
      return {
        solicitacoes: resultados,
        pagination: paginacaoInfo
      };
      
    } catch (error) {
      console.error('❌ [Context] Erro na pesquisa avançada:', error);
      setError('Erro na pesquisa: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 BUSCAR DETALHES DE UMA SOLICITAÇÃO
  const fetchSolicitacaoById = async (id) => {
    try {
      setLoading(true);
      console.log(`🔍 [Context] Buscando solicitação ID: ${id}`);
      
      const response = await solicitacoesService.getById(id);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro ao buscar solicitação');
      }
      
      const solicitacao = response.data.data;
      
      if (!solicitacao) {
        throw new Error('Solicitação não encontrada');
      }
      
      console.log('✅ [Context] Solicitação encontrada:', {
        id: solicitacao.id,
        codigo: solicitacao.codigo_solicitacao,
        status: solicitacao.status,
        solicitante_id: solicitacao.usuario_solicitante_id,
        meu_id: user?.id,
        meu_perfil: user?.perfil
      });
      
      return solicitacao;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao buscar solicitação:', error);
      setError('Erro ao carregar solicitação: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 BUSCAR HISTÓRICO COMPLETO
  const fetchHistoricoSolicitacao = async (solicitacaoId) => {
    try {
      console.log(`📜 [Context] Buscando histórico da solicitação: ${solicitacaoId}`);
      
      const response = await solicitacoesService.getHistorico(solicitacaoId);
      
      const dados = response.data && response.data.success 
        ? response.data.data 
        : null;
      
      if (!dados) {
        throw new Error('Histórico não encontrado');
      }
      
      console.log('✅ [Context] Histórico carregado:', {
        solicitacao: dados.codigo_solicitacao,
        itens: dados.itens?.length,
        historico: dados.historico?.length
      });
      
      return dados;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao buscar histórico:', error);
      throw error;
    }
  };

  // 🔥 CRIAR NOVA SOLICITAÇÃO
  const criarSolicitacao = async (dadosSolicitacao) => {
    try {
      setLoading(true);
      setError(null);
      console.log('📝 [Context] Criando nova solicitação...', dadosSolicitacao);
      
      const response = await solicitacoesService.create(dadosSolicitacao);
      
      console.log('✅ [Context] Solicitação criada com sucesso:', response.data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro ao criar solicitação');
      }
      
      const novaSolicitacao = response.data.data;
      
      await fetchMinhasSolicitacoes();
      
      if (isConnected && send) {
        send({
          type: 'solicitacao_criada',
          data: {
            id: novaSolicitacao.id,
            titulo: novaSolicitacao.titulo,
            solicitante: user?.nome
          }
        });
      }
      
      return novaSolicitacao;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao criar solicitação:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      setError('Erro ao criar solicitação: ' + errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ENVIAR PARA APROVAÇÃO - CORRIGIDO
  const enviarParaAprovacao = async (id) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📤 [Context] Enviando solicitação ${id} para aprovação...`);
      
      const response = await solicitacoesService.enviarParaAprovacao(id);
      
      console.log('✅ [Context] Resposta do envio para aprovação:', response.data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro ao enviar para aprovação');
      }
      
      await Promise.all([
        fetchMinhasSolicitacoes(),
        fetchSolicitacoesPendentes()
      ]);
      
      if (isConnected && send) {
        send({
          type: 'solicitacao_enviada',
          data: { id }
        });
      }
      
      console.log('✅ [Context] Solicitação enviada para aprovação');
      return response.data.data;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao enviar solicitação para aprovação:', error);
      setError('Erro ao enviar solicitação para aprovação: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 APROVAR SOLICITAÇÃO - ATUALIZADO
  const aprovarSolicitacao = async (id, observacoes = '') => {
    try {
      setLoading(true);
      setError(null);
      console.log(`✅ [Context] Aprovando solicitação ${id}...`);
      
      // 🎯 CORRIGIDO: Endpoint simplificado conforme backend
      const response = await solicitacoesService.aprovar(id, { 
        observacoes 
      });
      
      console.log('✅ [Context] Resposta da aprovação:', response.data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro ao aprovar solicitação');
      }
      
      await Promise.all([
        fetchSolicitacoesPendentes(),
        fetchMinhasSolicitacoes()
      ]);
      
      if (isConnected && send) {
        send({
          type: 'solicitacao_aprovada',
          data: { 
            id, 
            aprovador: user?.nome,
            perfil: user?.perfil 
          }
        });
      }
      
      console.log('✅ [Context] Solicitação aprovada com sucesso');
      return response.data.data;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao aprovar solicitação:', error);
      setError('Erro ao aprovar solicitação: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REJEITAR SOLICITAÇÃO - ATUALIZADO
  const rejeitarSolicitacao = async (id, motivo) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`❌ [Context] Rejeitando solicitação ${id}...`);
      
      const response = await solicitacoesService.rejeitar(id, { 
        motivo_rejeicao: motivo 
      });
      
      console.log('✅ [Context] Resposta da rejeição:', response.data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro ao rejeitar solicitação');
      }
      
      await Promise.all([
        fetchSolicitacoesPendentes(),
        fetchMinhasSolicitacoes()
      ]);
      
      if (isConnected && send) {
        send({
          type: 'solicitacao_rejeitada',
          data: { 
            id, 
            rejeitador: user?.nome,
            perfil: user?.perfil,
            motivo 
          }
        });
      }
      
      console.log('✅ [Context] Solicitação rejeitada com sucesso');
      return response.data.data;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao rejeitar solicitação:', error);
      setError('Erro ao rejeitar solicitação: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 PROCESSAR NO ESTOQUE - NOVA FUNÇÃO
  const processarEstoque = async (id, acao, observacoes = '') => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🏭 [Context] Processando solicitação ${id} no estoque...`, { acao, observacoes });
      
      // 🎯 CHAMA O ENDPOINT CORRETO
      const response = await solicitacoesService.processarEstoque(id, { 
        acao,
        observacoes_estoque: observacoes
      });
      
      console.log('✅ [Context] Resposta do processamento no estoque:', response.data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro ao processar no estoque');
      }
      
      await Promise.all([
        fetchMinhasSolicitacoes(),
        fetchSolicitacoesPendentes()
      ]);
      
      if (isConnected && send) {
        send({
          type: acao === 'aceitar' ? 'solicitacao_processada_estoque' : 'solicitacao_rejeitada_estoque',
          data: { 
            id, 
            usuario: user?.nome,
            perfil: user?.perfil,
            observacoes 
          }
        });
      }
      
      console.log('✅ [Context] Solicitação processada no estoque com sucesso');
      return response.data.data;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao processar no estoque:', error);
      setError('Erro ao processar no estoque: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REGISTRAR ENTREGA - ATUALIZADO
  const registrarEntrega = async (id) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📦 [Context] Registrando entrega da solicitação ${id}...`);
      
      const response = await solicitacoesService.finalizarEntrega(id);
      
      console.log('✅ [Context] Resposta do registro de entrega:', response.data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro ao registrar entrega');
      }
      
      await Promise.all([
        fetchSolicitacoesPendentes(),
        fetchMinhasSolicitacoes()
      ]);
      
      if (isConnected && send) {
        send({
          type: 'solicitacao_entregue',
          data: { 
            id, 
            entregue_por: user?.nome,
            perfil: user?.perfil 
          }
        });
      }
      
      console.log('✅ [Context] Entrega registrada com sucesso');
      return response.data.data;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao registrar entrega:', error);
      setError('Erro ao registrar entrega: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CANCELAR SOLICITAÇÃO
  const cancelarSolicitacao = async (id) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🗑️ [Context] Cancelando solicitação ${id}...`);
      
      const response = await solicitacoesService.cancelar(id, 'Cancelada pelo usuário');
      
      console.log('✅ [Context] Resposta do cancelamento:', response.data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Erro ao cancelar solicitação');
      }
      
      await fetchMinhasSolicitacoes();
      
      if (isConnected && send) {
        send({
          type: 'solicitacao_cancelada',
          data: { 
            id, 
            usuario: user?.nome,
            perfil: user?.perfil 
          }
        });
      }
      
      console.log('✅ [Context] Solicitação cancelada com sucesso');
      return response.data.data;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao cancelar solicitação:', error);
      setError('Erro ao cancelar solicitação: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 BUSCAR ESTATÍSTICAS
  const fetchEstatisticasSolicitacoes = async () => {
    try {
      console.log('📊 [Context] Buscando estatísticas de solicitações...');
      
      const response = await solicitacoesService.getEstatisticas();
      
      return response.data && response.data.success 
        ? response.data.data 
        : {};
        
    } catch (error) {
      console.error('❌ [Context] Erro ao buscar estatísticas:', error);
      throw error;
    }
  };

  // 🔥 RECARREGAR TODAS AS SOLICITAÇÕES
  const recarregarSolicitacoes = async () => {
    console.log('🔄 [Context] Recarregando todas as solicitações...');
    await Promise.all([
      fetchMinhasSolicitacoes(),
      fetchSolicitacoesPendentes()
    ]);
  };

  // Filtrar notificações de solicitações
  const notificacoesSolicitacoes = notifications.filter(notif => 
    notif.type === 'nova_solicitacao' || 
    notif.type === 'solicitacao_aprovada' ||
    notif.type === 'solicitacao_rejeitada' ||
    notif.type === 'solicitacao_entregue'
  );

  // Limpar erro
  const clearError = () => setError(null);

  // Limpar notificação específica
  const clearNotificacaoSolicitacao = (id) => {
    clearNotification(id);
  };

  // 🔥 EFFECT PRINCIPAL
  useEffect(() => {
    if (user && user.id) {
      console.log('👤 [Context] Usuário autenticado, carregando solicitações...', {
        id: user.id,
        perfil: user.perfil,
        podeAprovar: usuarioPodeAprovar(),
        podeProcessarEstoque: usuarioPodeProcessarEstoque()
      });
      recarregarSolicitacoes();
    } else {
      console.log('👤 [Context] Usuário não autenticado, limpando solicitações...');
      setSolicitacoes([]);
      setSolicitacoesPendentes([]);
    }
  }, [user, usuarioPodeAprovar, usuarioPodeProcessarEstoque]);

  const value = {
    // Estado
    solicitacoes,
    solicitacoesPendentes,
    loading,
    error,
    pagination,
    notificacoesSolicitacoes,
    isWebSocketConnected: isConnected,
    
    // 🆕 FUNÇÕES DE PERMISSÃO EXPORTADAS
    usuarioPodeAprovar,
    usuarioPodeProcessarEstoque,
    
    // Ações
    fetchMinhasSolicitacoes,
    fetchSolicitacoesPendentes,
    pesquisarSolicitacoes,
    fetchSolicitacaoById,
    fetchHistoricoSolicitacao,
    fetchEstatisticasSolicitacoes,
    criarSolicitacao,
    enviarParaAprovacao,
    aprovarSolicitacao,
    rejeitarSolicitacao,
    processarEstoque, // 🆕 NOVA FUNÇÃO
    registrarEntrega,
    cancelarSolicitacao,
    recarregarSolicitacoes,
    clearError,
    clearNotificacao: clearNotificacaoSolicitacao
  };

  return (
    <SolicitacaoContext.Provider value={value}>
      {children}
    </SolicitacaoContext.Provider>
  );
};