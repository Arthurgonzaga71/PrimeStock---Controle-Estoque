// components/UsuarioCard/UsuarioCard.js - VERSÃO COM DESATIVAR PERMISSÕES
import React, { useState } from 'react';
import './UsuarioCard.css';

const UsuarioCard = ({ usuario, onTogglePermissao, onRemoverEquipe }) => {
  const [showLimites, setShowLimites] = useState(false);

  const getPerfilColor = (perfil) => {
    const cores = {
      admin: '#dc3545',
      admin_estoque: '#fd7e14',
      coordenador: '#0d6efd',
      gerente: '#198754',
      tecnico: '#6f42c1',
      analista: '#20c997',
      estagiario: '#6c757d',
      aprendiz: '#ffc107'
    };
    return cores[perfil] || '#6c757d';
  };

  const getPerfilLabel = (perfil) => {
    const labels = {
      admin: 'Administrador',
      admin_estoque: 'Admin Estoque',
      coordenador: 'Coordenador',
      gerente: 'Gerente',
      tecnico: 'Técnico',
      analista: 'Analista',
      estagiario: 'Estagiário',
      aprendiz: 'Aprendiz'
    };
    return labels[perfil] || perfil;
  };

  const handleTogglePermissao = async (permissao, valor) => {
    await onTogglePermissao(usuario.id, { [permissao]: valor });
  };

  const handleLimiteChange = async (campo, valor) => {
    await onTogglePermissao(usuario.id, { [campo]: valor });
  };

  // 🆕 DESATIVAR TODAS AS PERMISSÕES
  const handleDesativarTodasPermissoes = async () => {
    await onTogglePermissao(usuario.id, {
      pode_consultar: false,
      pode_solicitar: false,
      pode_cadastrar: false,
      pode_editar: false
    });
  };

  // 🆕 ATIVAR TODAS AS PERMISSÕES
  const handleAtivarTodasPermissoes = async () => {
    await onTogglePermissao(usuario.id, {
      pode_consultar: true,
      pode_solicitar: true,
      pode_cadastrar: true,
      pode_editar: true
    });
  };

  const getStatusPermissoes = () => {
    if (usuario.perfil === 'admin' || usuario.perfil === 'coordenador') {
      return '🔓 Todas as permissões';
    }
    
    const permissoesAtivas = [];
    if (usuario.pode_consultar) permissoesAtivas.push('Consultar');
    if (usuario.pode_solicitar) permissoesAtivas.push('Solicitar');
    if (usuario.pode_cadastrar) permissoesAtivas.push('Cadastrar');
    if (usuario.pode_editar) permissoesAtivas.push('Editar');
    
    if (permissoesAtivas.length === 0) return '🔒 Sem permissões';
    if (permissoesAtivas.length === 4) return '🔓 Todas as permissões';
    
    return `🔓 ${permissoesAtivas.join(', ')}`;
  };

  const isAdminOuCoordenador = usuario.perfil === 'admin' || usuario.perfil === 'coordenador';
  
  // 🆕 VERIFICAR SE TEM ALGUMA PERMISSÃO ATIVA
  const temAlgumaPermissaoAtiva = 
    usuario.pode_consultar || 
    usuario.pode_solicitar || 
    usuario.pode_cadastrar || 
    usuario.pode_editar;

  return (
    <div className="usuario-card">
      {/* Header do Card */}
      <div className="usuario-header">
        <div 
          className="usuario-avatar"
          style={{ backgroundColor: getPerfilColor(usuario.perfil) }}
        >
          {usuario.nome.charAt(0).toUpperCase()}
        </div>
        <div className="usuario-info">
          <h3>{usuario.nome}</h3>
          <p className="usuario-email">{usuario.email}</p>
          <div className="usuario-metadata">
            <span 
              className="perfil-badge"
              style={{ backgroundColor: getPerfilColor(usuario.perfil) }}
            >
              {getPerfilLabel(usuario.perfil)}
            </span>
            <span className="departamento">{usuario.departamento}</span>
          </div>
        </div>
      </div>

      {/* Status Geral das Permissões */}
      <div className="usuario-status">
        <span className="status-geral">
          {getStatusPermissoes()}
        </span>
      </div>

      {/* 🆕 BOTÕES RÁPIDOS DE PERMISSÃO */}
      {!isAdminOuCoordenador && (
        <div className="permissoes-rapidas">
          <button 
            className="btn-rapido btn-desativar-todas"
            onClick={handleDesativarTodasPermissoes}
            disabled={!temAlgumaPermissaoAtiva}
          >
            🔒 Desativar Todas
          </button>
          <button 
            className="btn-rapido btn-ativar-todas"
            onClick={handleAtivarTodasPermissoes}
            disabled={temAlgumaPermissaoAtiva && 
              usuario.pode_consultar && 
              usuario.pode_solicitar && 
              usuario.pode_cadastrar && 
              usuario.pode_editar}
          >
            🔓 Ativar Todas
          </button>
        </div>
      )}

      {/* 🆕 GRID DE 4 PERMISSÕES - APENAS PARA NÃO ADMIN/COORDENADOR */}
      {!isAdminOuCoordenador && (
        <div className="permissoes-grid">
          {/* CONSULTAR */}
          <div className="permissao-item">
            <div className="permissao-info">
              <span className="permissao-icon">🔍</span>
              <div className="permissao-detalhes">
                <span className="permissao-label">Consultar Itens</span>
                <span className="permissao-descricao">Visualizar estoque</span>
              </div>
            </div>
            <label className="switch pequeno">
              <input 
                type="checkbox"
                checked={usuario.pode_consultar || false}
                onChange={(e) => handleTogglePermissao('pode_consultar', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* SOLICITAR */}
          <div className="permissao-item">
            <div className="permissao-info">
              <span className="permissao-icon">📝</span>
              <div className="permissao-detalhes">
                <span className="permissao-label">Fazer Solicitações</span>
                <span className="permissao-descricao">Pedir itens emprestados</span>
              </div>
            </div>
            <label className="switch pequeno">
              <input 
                type="checkbox"
                checked={usuario.pode_solicitar || false}
                onChange={(e) => handleTogglePermissao('pode_solicitar', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* CADASTRAR */}
          <div className="permissao-item">
            <div className="permissao-info">
              <span className="permissao-icon">➕</span>
              <div className="permissao-detalhes">
                <span className="permissao-label">Cadastrar Itens</span>
                <span className="permissao-descricao">Adicionar ao estoque</span>
              </div>
            </div>
            <label className="switch pequeno">
              <input 
                type="checkbox"
                checked={usuario.pode_cadastrar || false}
                onChange={(e) => handleTogglePermissao('pode_cadastrar', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* EDITAR */}
          <div className="permissao-item">
            <div className="permissao-info">
              <span className="permissao-icon">✏️</span>
              <div className="permissao-detalhes">
                <span className="permissao-label">Editar Itens</span>
                <span className="permissao-descricao">Modificar informações</span>
              </div>
            </div>
            <label className="switch pequeno">
              <input 
                type="checkbox"
                checked={usuario.pode_editar || false}
                onChange={(e) => handleTogglePermissao('pode_editar', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="usuario-controls">
        {!isAdminOuCoordenador && (
          <button 
            className="btn-limites"
            onClick={() => setShowLimites(!showLimites)}
          >
            {showLimites ? '▲ Ocultar Limites' : '▼ Limites de Solicitação'}
          </button>
        )}
        
        <button 
          className="btn-remover"
          onClick={() => onRemoverEquipe(usuario.id)}
          title="Remover da equipe"
        >
          🗑️ Remover
        </button>
      </div>

      {/* 🆕 CONFIGURAÇÕES DE LIMITE - APENAS PARA NÃO ADMIN/COORDENADOR */}
      {showLimites && !isAdminOuCoordenador && (
        <div className="limites-panel">
          <h4>⚙️ Limites de Solicitação</h4>
          <div className="limites-grid">
            <div className="limite-item">
              <label>Máx. Itens por Solicitação</label>
              <input 
                type="number"
                value={usuario.max_itens_solicitacao || 5}
                onChange={(e) => handleLimiteChange('max_itens_solicitacao', parseInt(e.target.value))}
                min="1"
                max="50"
              />
            </div>
            <div className="limite-item">
              <label>Valor Máx. (R$)</label>
              <input 
                type="number"
                value={usuario.valor_max_solicitacao || 1000}
                onChange={(e) => handleLimiteChange('valor_max_solicitacao', parseFloat(e.target.value))}
                min="0"
                step="100"
              />
            </div>
            <div className="limite-item">
              <label>Prazo Devolução (dias)</label>
              <input 
                type="number"
                value={usuario.prazo_max_devolucao || 30}
                onChange={(e) => handleLimiteChange('prazo_max_devolucao', parseInt(e.target.value))}
                min="1"
                max="365"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mensagem para Admin/Coordenador */}
      {isAdminOuCoordenador && (
        <div className="admin-notice">
          <p>💡 {getPerfilLabel(usuario.perfil)} tem permissões totais do sistema</p>
        </div>
      )}
    </div>
  );
};

export default UsuarioCard;