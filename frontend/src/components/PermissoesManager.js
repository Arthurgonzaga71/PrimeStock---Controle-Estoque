// frontend/src/components/PermissoesManager.js
import React, { useState } from 'react';

const PermissoesManager = ({ usuario, onSave }) => {
  const [permissoes, setPermissoes] = useState({
    pode_consultar: usuario.pode_consultar || false,
    pode_solicitar: usuario.pode_solicitar || false,
    pode_cadastrar: usuario.pode_cadastrar || false,
    pode_editar: usuario.pode_editar || false,
    permissao_aprovar_solicitacoes: usuario.permissao_aprovar_solicitacoes || false,
    permissao_gerenciar_usuarios: usuario.permissao_gerenciar_usuarios || false,
    max_itens_solicitacao: usuario.max_itens_solicitacao || 15,
    valor_max_solicitacao: usuario.valor_max_solicitacao || 2000.00,
    prazo_max_devolucao: usuario.prazo_max_devolucao || 45
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPermissoes(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="permissoes-manager">
      <h3>🔧 Gerenciar Permissões: {usuario.nome}</h3>
      
      <div className="permissoes-grid">
        {/* PERMISSÕES BÁSICAS */}
        <div className="permissoes-categoria">
          <h4>📋 Permissões Básicas</h4>
          <label><input type="checkbox" name="pode_consultar" checked={permissoes.pode_consultar} onChange={handleChange} /> Consultar</label>
          <label><input type="checkbox" name="pode_solicitar" checked={permissoes.pode_solicitar} onChange={handleChange} /> Solicitar</label>
          <label><input type="checkbox" name="pode_cadastrar" checked={permissoes.pode_cadastrar} onChange={handleChange} /> Cadastrar</label>
          <label><input type="checkbox" name="pode_editar" checked={permissoes.pode_editar} onChange={handleChange} /> Editar</label>
        </div>

        {/* PERMISSÕES AVANÇADAS */}
        <div className="permissoes-categoria">
          <h4>⚙️ Permissões Avançadas</h4>
          <label><input type="checkbox" name="permissao_aprovar_solicitacoes" checked={permissoes.permissao_aprovar_solicitacoes} onChange={handleChange} /> Aprovar Solicitações</label>
          <label><input type="checkbox" name="permissao_gerenciar_usuarios" checked={permissoes.permissao_gerenciar_usuarios} onChange={handleChange} /> Gerenciar Usuários</label>
        </div>

        {/* LIMITES */}
        <div className="permissoes-categoria">
          <h4>🎯 Limites Operacionais</h4>
          <label>Máx. Itens: <input type="number" name="max_itens_solicitacao" value={permissoes.max_itens_solicitacao} onChange={handleChange} min="1" max="999" /></label>
          <label>Valor Máx.: R$ <input type="number" name="valor_max_solicitacao" value={permissoes.valor_max_solicitacao} onChange={handleChange} min="0" step="0.01" /></label>
          <label>Prazo Máx.: <input type="number" name="prazo_max_devolucao" value={permissoes.prazo_max_devolucao} onChange={handleChange} min="1" max="365" /> dias</label>
        </div>
      </div>

      <button onClick={() => onSave(permissoes)}>💾 Salvar Permissões</button>
    </div>
  );
};