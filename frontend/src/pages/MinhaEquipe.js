// pages/MinhaEquipe.js
import React, { useEffect, useState } from 'react';
import { useEquipe } from '../contexts/EquipeContext';
import UsuarioCard from '../components/UsuarioCard/UsuarioCard';
import ModalAdicionarUsuario from '../components/ModalAdicionarUsuario';
import './MinhaEquipe.css';

const MinhaEquipe = () => {
  const {
    minhaEquipe,
    usuariosDisponiveis,
    loading,
    error,
    carregarMinhaEquipe,
    carregarUsuariosDisponiveis,
    toggleLiberacaoUsuario,
    adicionarUsuarioEquipe,
    removerUsuarioEquipe
  } = useEquipe();

  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    carregarMinhaEquipe();
    carregarUsuariosDisponiveis();
  }, []);

  // Filtros
  const equipeFiltrada = minhaEquipe.filter(usuario => {
    const matchBusca = usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      usuario.email.toLowerCase().includes(busca.toLowerCase());
    
    if (filtro === 'todos') return matchBusca;
    if (filtro === 'liberados') return matchBusca && usuario.permissao_criar_solicitacao;
    if (filtro === 'bloqueados') return matchBusca && !usuario.permissao_criar_solicitacao;
    if (filtro === 'coordenadores') return matchBusca && ['coordenador', 'gerente'].includes(usuario.perfil);
    return matchBusca;
  });

  // Estatísticas
  const estatisticas = {
    total: minhaEquipe.length,
    liberados: minhaEquipe.filter(u => u.permissao_criar_solicitacao).length,
    bloqueados: minhaEquipe.filter(u => !u.permissao_criar_solicitacao).length,
    coordenadores: minhaEquipe.filter(u => ['coordenador', 'gerente'].includes(u.perfil)).length
  };

  const handleToggleLiberacao = async (usuarioId, liberado, configs) => {
    try {
      const result = await toggleLiberacaoUsuario(usuarioId, liberado, configs);
      setMensagem(result.message);
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      setMensagem('Erro ao alterar permissão');
    }
  };

  const handleRemoverEquipe = async (usuarioId) => {
    if (window.confirm('Tem certeza que deseja remover este usuário da sua equipe?')) {
      try {
        const result = await removerUsuarioEquipe(usuarioId);
        setMensagem(result.message);
        setTimeout(() => setMensagem(''), 3000);
      } catch (error) {
        setMensagem('Erro ao remover usuário');
      }
    }
  };

  const handleAdicionarUsuario = async (usuarioId) => {
    try {
      const result = await adicionarUsuarioEquipe(usuarioId);
      setMensagem(result.message);
      setShowModal(false);
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      setMensagem('Erro ao adicionar usuário');
    }
  };

  if (loading && minhaEquipe.length === 0) {
    return (
      <div className="minha-equipe-page">
        <div className="loading">Carregando equipe...</div>
      </div>
    );
  }

  return (
    <div className="minha-equipe-page">
      {/* Header */}
      <div className="page-header">
        <h1>👥 Minha Equipe</h1>
        <p>Gerencie os membros da sua equipe e suas permissões</p>
      </div>

      {/* Mensagens */}
      {mensagem && (
        <div className={`mensagem ${mensagem.includes('Erro') ? 'erro' : 'sucesso'}`}>
          {mensagem}
        </div>
      )}

      {/* Estatísticas */}
      <div className="estatisticas-grid">
        <div className="estatistica-card">
          <div className="estatistica-valor">{estatisticas.total}</div>
          <div className="estatistica-label">Total na Equipe</div>
        </div>
        <div className="estatistica-card liberados">
          <div className="estatistica-valor">{estatisticas.liberados}</div>
          <div className="estatistica-label">Liberados</div>
        </div>
        <div className="estatistica-card bloqueados">
          <div className="estatistica-valor">{estatisticas.bloqueados}</div>
          <div className="estatistica-label">Bloqueados</div>
        </div>
        <div className="estatistica-card coordenadores">
          <div className="estatistica-valor">{estatisticas.coordenadores}</div>
          <div className="estatistica-label">Coordenadores</div>
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
            <option value="todos">Todos</option>
            <option value="liberados">Liberados</option>
            <option value="bloqueados">Bloqueados</option>
            <option value="coordenadores">Coordenadores</option>
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
                <h3>Nenhum usuário na sua equipe</h3>
                <p>Adicione usuários para começar a gerenciar sua equipe</p>
                <button 
                  className="btn-adicionar"
                  onClick={() => setShowModal(true)}
                >
                  Adicionar Primeiro Usuário
                </button>
              </>
            ) : (
              <p>Nenhum usuário encontrado com os filtros aplicados</p>
            )}
          </div>
        ) : (
          equipeFiltrada.map(usuario => (
            <UsuarioCard
              key={usuario.id}
              usuario={usuario}
              onToggleLiberacao={handleToggleLiberacao}
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
    </div>
  );
};

export default MinhaEquipe;