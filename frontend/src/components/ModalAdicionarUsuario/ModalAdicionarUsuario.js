// components/ModalAdicionarUsuario/ModalAdicionarUsuario.js - CORRIGIDO
import React, { useState } from 'react';
import './ModalAdicionarUsuario.css';

const ModalAdicionarUsuario = ({ usuariosDisponiveis, onAdicionar, onClose }) => {
  const [busca, setBusca] = useState('');
  const [adicionando, setAdicionando] = useState(null);
  const [mensagem, setMensagem] = useState('');

  const usuariosFiltrados = usuariosDisponiveis.filter(usuario =>
    usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busca.toLowerCase())
  );

  // 🆕 FUNÇÃO MELHORADA PARA ADICIONAR USUÁRIO
  const handleAdicionarUsuario = async (usuarioId, usuarioNome) => {
    try {
      setAdicionando(usuarioId);
      setMensagem('');
      
      console.log('🔄 [Modal] Tentando adicionar usuário:', usuarioId, usuarioNome);
      
      // 🆕 ADICIONAR TIMEOUT PARA EVITAR CONGELAMENTO
      await Promise.race([
        onAdicionar(usuarioId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao adicionar usuário')), 10000)
        )
      ]);
      
      console.log('✅ [Modal] Usuário adicionado com sucesso');
      setMensagem(`✅ ${usuarioNome} adicionado à equipe!`);
      
      // 🆕 FECHAR MODAL APÓS SUCESSO
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ [Modal] Erro ao adicionar usuário:', error);
      setMensagem(`❌ Erro: ${error.response?.data?.message || error.message || 'Falha ao adicionar usuário'}`);
    } finally {
      setAdicionando(null);
    }
  };

  // 🆕 FUNÇÃO PARA OBTER LABEL DO PERFIL
  const getPerfilLabel = (perfil) => {
    const labels = {
      admin: '👑 Admin',
      admin_estoque: '📦 Admin Estoque',
      coordenador: '👔 Coordenador',
      gerente: '💼 Gerente',
      tecnico: '🔧 Técnico',
      analista: '📊 Analista',
      estagiario: '🎓 Estagiário',
      aprendiz: '👶 Aprendiz'
    };
    return labels[perfil] || perfil;
  };

  // 🆕 VERIFICAR SE USUÁRIO JÁ TEM PERMISSÕES
  const usuarioTemPermissoes = (usuario) => {
    return usuario.pode_consultar || 
           usuario.pode_solicitar || 
           usuario.pode_cadastrar || 
           usuario.pode_editar;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Adicionar Usuário à Equipe</h2>
          <button className="btn-fechar" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 🆕 MENSAGEM DE STATUS */}
          {mensagem && (
            <div className={`mensagem-modal ${mensagem.includes('❌') ? 'erro' : 'sucesso'}`}>
              {mensagem}
            </div>
          )}

          <input
            type="text"
            placeholder="🔍 Buscar por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="busca-modal"
          />

          <div className="usuarios-info">
            <small>
              {usuariosDisponiveis.length} usuário(s) disponível(is) • {usuariosFiltrados.length} encontrado(s)
            </small>
          </div>

          <div className="usuarios-lista">
            {usuariosFiltrados.length === 0 ? (
              <div className="lista-vazia">
                {usuariosDisponiveis.length === 0 ? 
                  '📭 Nenhum usuário disponível para adicionar' : 
                  '🔍 Nenhum usuário encontrado com esse nome/email'
                }
              </div>
            ) : (
              usuariosFiltrados.map(usuario => (
                <div key={usuario.id} className="usuario-item">
                  <div className="usuario-info">
                    <div className="usuario-header">
                      <strong>{usuario.nome}</strong>
                      <span className="usuario-email">{usuario.email}</span>
                    </div>
                    <div className="usuario-detalhes">
                      <span className="perfil-badge">
                        {getPerfilLabel(usuario.perfil)}
                      </span>
                      <span className="departamento">{usuario.departamento}</span>
                      {usuario.usuario_superior_id && (
                        <span className="ja-na-equipe">✓ Já na equipe</span>
                      )}
                    </div>
                    
                    {/* 🆕 STATUS DAS PERMISSÕES */}
                    {usuarioTemPermissoes(usuario) && (
                      <div className="permissoes-status">
                        <small>Permissões: 
                          {usuario.pode_consultar && ' 👁️'}
                          {usuario.pode_solicitar && ' 📝'} 
                          {usuario.pode_cadastrar && ' ➕'}
                          {usuario.pode_editar && ' ✏️'}
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <button
                    className={`btn-adicionar-item ${adicionando === usuario.id ? 'carregando' : ''}`}
                    onClick={() => handleAdicionarUsuario(usuario.id, usuario.nome)}
                    disabled={adicionando !== null}
                    title={usuario.usuario_superior_id ? "Reassociar usuário à equipe" : "Adicionar à equipe"}
                  >
                    {adicionando === usuario.id ? (
                      <>
                        <div className="spinner-mini"></div>
                        Adicionando...
                      </>
                    ) : usuario.usuario_superior_id ? (
                      '↻ Reassociar'
                    ) : (
                      '➕ Adicionar'
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 🆕 LEGENDA */}
          <div className="modal-legenda">
            <small>
              <strong>Legenda:</strong> 
              👁️ Consultar • 📝 Solicitar • ➕ Cadastrar • ✏️ Editar
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAdicionarUsuario;