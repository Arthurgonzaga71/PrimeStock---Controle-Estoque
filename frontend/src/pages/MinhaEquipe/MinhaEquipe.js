// pages/MinhaEquipe/MinhaEquipe.js - VERSÃO COMPLETA CORRIGIDA
import React, { useEffect, useState } from 'react';
import { useEquipe } from '../../contexts/EquipeContext';
import UsuarioCard from '../../components/UsuarioCard/UsuarioCard';
import ModalAdicionarUsuario from '../../components/ModalAdicionarUsuario/ModalAdicionarUsuario';
import './MinhaEquipe.css';

const MinhaEquipe = () => {
  const {
    minhaEquipe,
    usuariosDisponiveis,
    loading,
    error,
    carregarMinhaEquipe,
    carregarUsuariosDisponiveis,
    atualizarPermissoesUsuario,
    togglePermissaoUsuario,
    obterEstatisticasPermissoes,
    adicionarUsuarioEquipe,
    removerUsuarioEquipe,
    limparErro
  } = useEquipe();

  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    carregarMinhaEquipe();
    carregarUsuariosDisponiveis();
  }, []);

  // 🆕 FILTROS ATUALIZADOS PARA AS 4 PERMISSÕES - CORRIGIDOS
  const equipeFiltrada = minhaEquipe.filter(usuario => {
    const matchBusca = usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      usuario.email.toLowerCase().includes(busca.toLowerCase());
    
    if (filtro === 'todos') return matchBusca;
    // 🆕 NOMES CORRIGIDOS
    if (filtro === 'pode_consultar') return matchBusca && usuario.pode_consultar;        // 🆕 NOME CORRIGIDO
    if (filtro === 'pode_solicitar') return matchBusca && usuario.pode_solicitar;        // 🆕 NOME CORRIGIDO
    if (filtro === 'pode_cadastrar') return matchBusca && usuario.pode_cadastrar;        // 🆕 NOME CORRIGIDO
    if (filtro === 'pode_editar') return matchBusca && usuario.pode_editar;              // 🆕 NOME CORRIGIDO
    if (filtro === 'sem_permissoes') return matchBusca && 
      !usuario.pode_consultar &&         // 🆕 NOME CORRIGIDO
      !usuario.pode_solicitar &&         // 🆕 NOME CORRIGIDO
      !usuario.pode_cadastrar &&         // 🆕 NOME CORRIGIDO
      !usuario.pode_editar;              // 🆕 NOME CORRIGIDO
    if (filtro === 'coordenadores') return matchBusca && ['coordenador', 'gerente'].includes(usuario.perfil);
    return matchBusca;
  });

  // 🆕 ESTATÍSTICAS ATUALIZADAS COM AS 4 PERMISSÕES - CORRIGIDAS
  const estatisticas = obterEstatisticasPermissoes ? obterEstatisticasPermissoes() : {
    total: minhaEquipe.length,
    // 🆕 NOMES CORRIGIDOS
    pode_consultar: minhaEquipe.filter(u => u.pode_consultar).length,        // 🆕 NOME CORRIGIDO
    pode_solicitar: minhaEquipe.filter(u => u.pode_solicitar).length,        // 🆕 NOME CORRIGIDO
    pode_cadastrar: minhaEquipe.filter(u => u.pode_cadastrar).length,        // 🆕 NOME CORRIGIDO
    pode_editar: minhaEquipe.filter(u => u.pode_editar).length              // 🆕 NOME CORRIGIDO
  };

  // 🆕 FUNÇÃO PARA ATUALIZAR PERMISSÕES
  const handleTogglePermissao = async (usuarioId, permissoes) => {
    try {
      const result = await atualizarPermissoesUsuario(usuarioId, permissoes);
      setMensagem('Permissões atualizadas com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      setMensagem('Erro ao atualizar permissões');
      setTimeout(() => setMensagem(''), 3000);
    }
  };

  // 🆕 FUNÇÃO PARA ALTERNAR PERMISSÃO ESPECÍFICA - CORRIGIDA
  const handleTogglePermissaoEspecifica = async (usuarioId, permissao, valor) => {
    try {
      // 🆕 CORREÇÃO: Usar a função correta do contexto
      const result = await atualizarPermissoesUsuario(usuarioId, { [permissao]: valor });
      
      // 🆕 MENSAGEM DESCRITIVA
      const mensagensPermissoes = {
        pode_consultar: 'Consultar Itens',
        pode_solicitar: 'Fazer Solicitações', 
        pode_cadastrar: 'Cadastrar Itens',
        pode_editar: 'Editar Itens'
      };
      
      setMensagem(`Permissão "${mensagensPermissoes[permissao] || permissao}" ${valor ? 'ativada' : 'desativada'}!`);
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao alterar permissão:', error);
      setMensagem('Erro ao alterar permissão');
      setTimeout(() => setMensagem(''), 3000);
    }
  };

  const handleRemoverEquipe = async (usuarioId) => {
    if (window.confirm('Tem certeza que deseja remover este usuário da sua equipe?')) {
      try {
        const result = await removerUsuarioEquipe(usuarioId);
        setMensagem(result.message || 'Usuário removido da equipe com sucesso!');
        setTimeout(() => setMensagem(''), 3000);
      } catch (error) {
        console.error('Erro ao remover usuário:', error);
        setMensagem('Erro ao remover usuário da equipe');
        setTimeout(() => setMensagem(''), 3000);
      }
    }
  };

  const handleAdicionarUsuario = async (usuarioId) => {
    try {
      const result = await adicionarUsuarioEquipe(usuarioId);
      setMensagem(result.message || 'Usuário adicionado à equipe com sucesso!');
      setShowModal(false);
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      setMensagem('Erro ao adicionar usuário à equipe');
      setTimeout(() => setMensagem(''), 3000);
    }
  };

  // 🆕 LIMPAR ERRO QUANDO COMPONENTE MONTAR
  useEffect(() => {
    if (error && limparErro) {
      limparErro();
    }
  }, []);

  if (loading && minhaEquipe.length === 0) {
    return (
      <div className="minha-equipe-page">
        <div className="loading">
          <div className="loader-spinner"></div>
          <p>Carregando sua equipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="minha-equipe-page">
      {/* Header */}
      <div className="page-header">
        <h1>👥 Minha Equipe</h1>
        <p>Gerencie as permissões dos membros da sua equipe</p>
      </div>

      {/* Mensagens */}
      {mensagem && (
        <div className={`mensagem ${mensagem.includes('Erro') ? 'erro' : 'sucesso'}`}>
          {mensagem}
        </div>
      )}

      {/* 🆕 ESTATÍSTICAS ATUALIZADAS */}
      <div className="estatisticas-grid">
        <div className="estatistica-card">
          <div className="estatistica-valor">{estatisticas.total}</div>
          <div className="estatistica-label">Total na Equipe</div>
        </div>
        <div className="estatistica-card consultar">
          <div className="estatistica-valor">{estatisticas.pode_consultar}</div>
          <div className="estatistica-label">Podem Consultar</div>
        </div>
        <div className="estatistica-card solicitar">
          <div className="estatistica-valor">{estatisticas.pode_solicitar}</div>
          <div className="estatistica-label">Podem Solicitar</div>
        </div>
        <div className="estatistica-card cadastrar">
          <div className="estatistica-valor">{estatisticas.pode_cadastrar}</div>
          <div className="estatistica-label">Podem Cadastrar</div>
        </div>
        <div className="estatistica-card editar">
          <div className="estatistica-valor">{estatisticas.pode_editar}</div>
          <div className="estatistica-label">Podem Editar</div>
        </div>
      </div>

      {/* Controles */}
      <div className="controles-equipe">
        <div className="filtros-busca">
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="busca-input"
          />
          <select 
            value={filtro} 
            onChange={(e) => setFiltro(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos os membros</option>
            <option value="pode_consultar">Podem Consultar</option>
            <option value="pode_solicitar">Podem Solicitar</option>
            <option value="pode_cadastrar">Podem Cadastrar</option>
            <option value="pode_editar">Podem Editar</option>
            <option value="sem_permissoes">Sem Permissões</option>
            <option value="coordenadores">Coordenadores/Gerentes</option>
          </select>
        </div>
        <button 
          className="btn-adicionar"
          onClick={() => setShowModal(true)}
        >
          ➕ Adicionar à Equipe
        </button>
      </div>

      {/* Lista de Usuários */}
      <div className="equipe-grid">
        {equipeFiltrada.length === 0 ? (
          <div className="equipe-vazia">
            {minhaEquipe.length === 0 ? (
              <>
                <h3>🎯 Nenhum usuário na sua equipe</h3>
                <p>Adicione usuários para começar a gerenciar permissões</p>
                <button 
                  className="btn-adicionar"
                  onClick={() => setShowModal(true)}
                >
                  Adicionar Primeiro Usuário
                </button>
              </>
            ) : (
              <>
                <h3>🔍 Nenhum usuário encontrado</h3>
                <p>Tente alterar os filtros de busca</p>
              </>
            )}
          </div>
        ) : (
          equipeFiltrada.map(usuario => (
            <UsuarioCard
              key={usuario.id}
              usuario={usuario}
              onTogglePermissao={handleTogglePermissao}
              onRemoverEquipe={handleRemoverEquipe}
            />
          ))
        )}
      </div>

      {/* Modal Adicionar Usuário */}
      {showModal && (
        <ModalAdicionarUsuario
          usuariosDisponiveis={usuariosDisponiveis}
          onAdicionar={handleAdicionarUsuario}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* 🆕 MENSAGEM DE ERRO */}
      {error && (
        <div className="mensagem erro">
          {error}
          <button onClick={limparErro} className="btn-fechar-erro">✕</button>
        </div>
      )}
    </div>
  );
};

export default MinhaEquipe;