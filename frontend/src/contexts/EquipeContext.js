// contexts/EquipeContext.js - VERSÃO COMPLETA CORRIGIDA
import React, { createContext, useState, useContext } from 'react';
import { usuariosService } from '../services/api';

const EquipeContext = createContext();

export const useEquipe = () => {
  const context = useContext(EquipeContext);
  if (!context) {
    throw new Error('useEquipe deve ser usado dentro de EquipeProvider');
  }
  return context;
};

export const EquipeProvider = ({ children }) => {
  const [minhaEquipe, setMinhaEquipe] = useState([]);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Buscar minha equipe
  const carregarMinhaEquipe = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [EquipeContext] Buscando minha equipe...');
      
      const response = await usuariosService.getMinhaEquipe();
      
      console.log('✅ [EquipeContext] Dados recebidos:', response.data);
      setMinhaEquipe(response.data.data || []);
    } catch (error) {
      console.error('❌ [EquipeContext] Erro ao carregar equipe:', error);
      setError('Erro ao carregar equipe: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuários disponíveis
  const carregarUsuariosDisponiveis = async () => {
    try {
      console.log('🔄 [EquipeContext] Buscando usuários disponíveis...');
      
      const response = await usuariosService.getUsuariosDisponiveis();
      
      console.log('✅ [EquipeContext] Usuários disponíveis:', response.data);
      setUsuariosDisponiveis(response.data.data || []);
    } catch (error) {
      console.error('❌ [EquipeContext] Erro ao carregar usuários disponíveis:', error);
      setError('Erro ao carregar usuários disponíveis: ' + (error.response?.data?.message || error.message));
    }
  };

  // 🆕 ATUALIZAR PERMISSÕES DO USUÁRIO (4 PERMISSÕES) - CORRIGIDO
  const atualizarPermissoesUsuario = async (usuarioId, permissoes = {}) => {
    try {
      console.log('🔄 [EquipeContext] Atualizando permissões do usuário:', usuarioId, permissoes);
      
      const response = await usuariosService.liberarUsuario(usuarioId, permissoes);
      
      // 🆕 ATUALIZAR ESTADO LOCAL COM AS NOVAS PERMISSÕES - CORRIGIDO
      setMinhaEquipe(prev => prev.map(user => 
        user.id === usuarioId ? { 
          ...user, 
          ...permissoes 
        } : user
      ));
      
      console.log('✅ [EquipeContext] Permissões atualizadas com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [EquipeContext] Erro ao atualizar permissões:', error);
      setError('Erro ao atualizar permissões: ' + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  // 🆕 ALTERNAR PERMISSÃO ESPECÍFICA - CORRIGIDO
  const togglePermissaoUsuario = async (usuarioId, permissao, valor) => {
    return await atualizarPermissoesUsuario(usuarioId, { [permissao]: valor });
  };

  // 🆕 ATUALIZAR LIMITES DE SOLICITAÇÃO
  const atualizarLimitesUsuario = async (usuarioId, limites = {}) => {
    try {
      console.log('🔄 [EquipeContext] Atualizando limites do usuário:', usuarioId, limites);
      
      const response = await usuariosService.liberarUsuario(usuarioId, limites);
      
      // Atualizar estado local
      setMinhaEquipe(prev => prev.map(user => 
        user.id === usuarioId ? { 
          ...user, 
          ...limites 
        } : user
      ));
      
      console.log('✅ [EquipeContext] Limites atualizados com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [EquipeContext] Erro ao atualizar limites:', error);
      setError('Erro ao atualizar limites: ' + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  // Adicionar usuário à equipe
  const adicionarUsuarioEquipe = async (usuarioId) => {
    try {
      console.log('🔄 [EquipeContext] Adicionando usuário à equipe:', usuarioId);
      
      const response = await usuariosService.adicionarUsuarioEquipe(usuarioId);
      
      await carregarMinhaEquipe();
      await carregarUsuariosDisponiveis();
      
      console.log('✅ [EquipeContext] Usuário adicionado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [EquipeContext] Erro ao adicionar usuário:', error);
      setError('Erro ao adicionar usuário: ' + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  // Remover usuário da equipe
  const removerUsuarioEquipe = async (usuarioId) => {
    try {
      console.log('🔄 [EquipeContext] Removendo usuário da equipe:', usuarioId);
      
      const response = await usuariosService.removerUsuarioEquipe(usuarioId);
      
      await carregarMinhaEquipe();
      await carregarUsuariosDisponiveis();
      
      console.log('✅ [EquipeContext] Usuário removido com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ [EquipeContext] Erro ao remover usuário:', error);
      setError('Erro ao remover usuário: ' + (error.response?.data?.message || error.message));
      throw error;
    }
  };

  // 🆕 VERIFICAR SE USUÁRIO TEM PERMISSÃO ESPECÍFICA - CORRIGIDO
  const usuarioTemPermissao = (usuarioId, permissao) => {
    const usuario = minhaEquipe.find(user => user.id === usuarioId);
    if (!usuario) return false;
    
    // 🆕 NOMES CORRIGIDOS
    const permissoes = {
      consultar: usuario.pode_consultar,        // 🆕 NOME CORRIGIDO
      solicitar: usuario.pode_solicitar,        // 🆕 NOME CORRIGIDO
      cadastrar: usuario.pode_cadastrar,        // 🆕 NOME CORRIGIDO
      editar: usuario.pode_editar               // 🆕 NOME CORRIGIDO
    };
    
    return permissoes[permissao] === true;
  };

  // 🆕 OBTER ESTATÍSTICAS DAS PERMISSÕES DA EQUIPE - CORRIGIDO
  const obterEstatisticasPermissoes = () => {
    const estatisticas = {
      total: minhaEquipe.length,
      pode_consultar: 0,
      pode_solicitar: 0,
      pode_cadastrar: 0,
      pode_editar: 0
    };

    minhaEquipe.forEach(usuario => {
      // 🆕 NOMES CORRIGIDOS
      if (usuario.pode_consultar) estatisticas.pode_consultar++;        // 🆕 NOME CORRIGIDO
      if (usuario.pode_solicitar) estatisticas.pode_solicitar++;        // 🆕 NOME CORRIGIDO
      if (usuario.pode_cadastrar) estatisticas.pode_cadastrar++;        // 🆕 NOME CORRIGIDO
      if (usuario.pode_editar) estatisticas.pode_editar++;              // 🆕 NOME CORRIGIDO
    });

    return estatisticas;
  };

  // 🆕 LIMPAR ERROS
  const limparErro = () => {
    setError(null);
  };

  const value = {
    // Estado
    minhaEquipe,
    usuariosDisponiveis,
    loading,
    error,
    
    // Carregamento de dados
    carregarMinhaEquipe,
    carregarUsuariosDisponiveis,
    
    // 🆕 Funções de permissões
    atualizarPermissoesUsuario,
    togglePermissaoUsuario,
    atualizarLimitesUsuario,
    usuarioTemPermissao,
    obterEstatisticasPermissoes,
    
    // Gerenciamento de equipe
    adicionarUsuarioEquipe,
    removerUsuarioEquipe,
    
    // 🆕 Limpar erro
    limparErro,
    
    // ⚠️ Função antiga (mantida para compatibilidade) - CORRIGIDA
    toggleLiberacaoUsuario: (usuarioId, pode_solicitar, configs = {}) => 
      atualizarPermissoesUsuario(usuarioId, { 
        pode_solicitar: pode_solicitar,        // 🆕 NOME CORRIGIDO
        ...configs 
      })
  };

  return (
    <EquipeContext.Provider value={value}>
      {children}
    </EquipeContext.Provider>
  );
};