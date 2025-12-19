// 📁 frontend/src/pages/Usuarios/UsuariosList.js - VERSÃO COMPLETA CORRIGIDA
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usuariosService } from '../../services/api';
import './UsuariosList.css';

const UsuariosList = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ FUNÇÃO PARA VERIFICAR SE PODE GERENCIAR USUÁRIOS
  const podeGerenciarUsuarios = () => {
    console.log('🔍 Verificando permissões do usuário:', {
      perfil: user?.perfil,
      permissao_gerenciar_usuarios: user?.permissao_gerenciar_usuarios,
      pode_cadastrar: user?.pode_cadastrar
    });
    
    return user?.perfil === 'admin' || 
           user?.perfil === 'coordenador' || 
           user?.perfil === 'gerente' || 
           user?.permissao_gerenciar_usuarios === true;
  };

  // ✅ FUNÇÃO PARA VERIFICAR SE PODE EXCLUIR USUÁRIO (apenas admin)
  const podeExcluirUsuario = () => {
    return user?.perfil === 'admin';
  };

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Carregando usuários...');
      console.log('👤 Usuário logado:', {
        nome: user?.nome,
        perfil: user?.perfil,
        pode_gerenciar: podeGerenciarUsuarios()
      });
      
      const response = await usuariosService.getAll();
      console.log('✅ Resposta da API:', response);
      console.log('📦 Dados recebidos:', response.data);
      
      // ✅ CORREÇÃO: Acessar response.data.data
      const usuariosData = response.data.data || [];
      
      if (!Array.isArray(usuariosData)) {
        console.warn('⚠️ Dados não são um array:', usuariosData);
        setUsuarios([]);
        setError('Formato de dados inválido recebido do servidor');
        return;
      }
      
      console.log('👥 Usuários carregados:', usuariosData.length);
      setUsuarios(usuariosData);
      
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      setError('Erro ao carregar lista de usuários: ' + error.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      await usuariosService.delete(id);
      await loadUsuarios();
      alert('✅ Usuário excluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      alert('❌ Erro ao excluir usuário: ' + error.message);
    }
  };

  // Garantir que seja array
  const usuariosParaRender = Array.isArray(usuarios) ? usuarios : [];

  if (loading) {
    return (
      <div className="usuarios-loading">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }
  // No UsuariosList.js, adicione:
  return (
    
    <div className="usuarios-list">
      <div className="usuarios-header">
        <h1>👥 Gerenciar Usuários</h1>
        <p>Administre os usuários do sistema</p>
        
        <div className="user-info-logado">
          <small>👋 Logado como: <strong>{user?.nome}</strong> ({user?.perfil})</small>
          <small>🔑 Permissão de gerenciamento: {podeGerenciarUsuarios() ? '✅ SIM' : '❌ NÃO'}</small>
        </div>
        
        {/* ✅ BOTÃO NOVO USUÁRIO - APENAS PARA QUEM PODE GERENCIAR */}
        {podeGerenciarUsuarios() && (
          <Link to="/usuarios/novo" className="btn btn--primary">
            ➕ Novo Usuário
          </Link>
        )}
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <div className="usuarios-content">
        {usuariosParaRender.length === 0 ? (
          <div className="empty-state">
            <p>📭 Nenhum usuário encontrado</p>
            {!error && podeGerenciarUsuarios() && (
              <Link to="/usuarios/novo" className="btn btn--primary">
                👤 Criar Primeiro Usuário
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container">
            <div className="table-header-info">
              <span>📊 Total de usuários: {usuariosParaRender.length}</span>
              <span>👑 Seu perfil: {user?.perfil}</span>
              <span>🔧 Pode gerenciar: {podeGerenciarUsuarios() ? '✅ Sim' : '❌ Não'}</span>
            </div>
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Data Cadastro</th>
                  {podeGerenciarUsuarios() && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {usuariosParaRender.map(usuario => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="user-info">
                        <span className="user-avatar">
                          {usuario.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        <span className="user-name">{usuario.nome}</span>
                      </div>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <span className={`perfil-badge perfil-${usuario.perfil}`}>
                        {usuario.perfil === 'admin' ? '👑 Admin' : 
                         usuario.perfil === 'coordenador' ? '👔 Coordenador' :
                         usuario.perfil === 'gerente' ? '👨‍💼 Gerente' :
                         usuario.perfil === 'tecnico' ? '🔧 Técnico' : 
                         usuario.perfil === 'analista' ? '📊 Analista' :
                         usuario.perfil === 'estagiario' ? '🎓 Estagiário' : 
                         usuario.perfil === 'aprendiz' ? '👶 Aprendiz' : '❓ Desconhecido'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${usuario.ativo ? 'ativo' : 'inativo'}`}>
                        {usuario.ativo ? '✅ Ativo' : '❌ Inativo'}
                      </span>
                    </td>
                    <td>
                      {usuario.createdAt ? new Date(usuario.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                    {podeGerenciarUsuarios() && (
                      <td>
                        <div className="action-buttons">
                          <Link 
                            to={`/usuarios/editar/${usuario.id}`}
                            className="btn btn--small btn--secondary"
                          >
                            ✏️ Editar
                          </Link>
                          {/* ✅ EXCLUSÃO APENAS PARA ADMIN */}
                          {podeExcluirUsuario() && usuario.id !== user.id && (
                            <button
                              onClick={() => handleDelete(usuario.id)}
                              className="btn btn--small btn--danger"
                            >
                              🗑️ Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuariosList;