// src/pages/Itens/ItensList.js - VERSÃO COMPLETAMENTE CORRIGIDA
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itensService, categoriasService } from '../../services/api';
import { Button, Input, Loading } from '../../components/UI';
import { ITEM_STATUS, ITEM_ESTADO, LABELS } from '../../utils/constants';
import './Itens.css';

const ItensList = () => {
  const { user } = useAuth();
  
  // 🔥 VERIFICAÇÃO DIRETA E SIMPLIFICADA
  const podeCadastrar = user?.pode_cadastrar || 
                       (user?.permissoes && user.permissoes.pode_cadastrar) ||
                       ['admin', 'admin_estoque', 'tecnico', 'analista'].includes(user?.perfil);

  const podeEditar = user?.pode_editar || 
                     (user?.permissoes && user.permissoes.pode_editar) ||
                     ['admin', 'admin_estoque', 'tecnico', 'analista'].includes(user?.perfil);

  const podeDeletar = user?.permissao_gerenciar_usuarios || 
                      (user?.permissoes && user.permissoes.permissao_gerenciar_usuarios) ||
                      user?.perfil === 'admin';

  console.log('🔍 Permissões ItensList:', {
    perfil: user?.perfil,
    podeCadastrar,
    podeEditar,
    podeDeletar,
    userData: user
  });
  
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros e busca
  const [filtros, setFiltros] = useState({
    search: '',
    categoria: '',
    status: ''
  });
  const [paginacao, setPaginacao] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // 📋 CARREGAR ITENS
  const carregarItens = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page,
        limit: paginacao.limit,
        ...filtros
      };

      // Remover filtros vazios
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await itensService.getAll(params);
      
      if (response.data.success) {
        setItens(response.data.data);
        setPaginacao(prev => ({
          ...prev,
          page,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      setError('Erro ao carregar lista de itens');
    } finally {
      setLoading(false);
    }
  };

  // 📋 CARREGAR CATEGORIAS
  const carregarCategorias = async () => {
    try {
      const response = await categoriasService.getAll();
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  // 🗑️ EXCLUIR ITEM
  const handleExcluirItem = async (id, nome) => {
    // 🔥 CORREÇÃO: Verificar permissão antes
    if (!podeDeletar) {
      alert('❌ Você não tem permissão para excluir itens');
      return;
    }
    
    if (!window.confirm(`Tem certeza que deseja excluir o item "${nome}"?`)) {
      return;
    }

    try {
      await itensService.delete(id);
      carregarItens(paginacao.page);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item: ' + (error.response?.data?.message || error.message));
    }
  };

  // 🔄 USEEFFECT
  useEffect(() => {
    carregarItens();
    carregarCategorias();
  }, []);

  // 🔍 APLICAR FILTROS
  useEffect(() => {
    carregarItens(1);
  }, [filtros]);

  // 🎯 COMPONENTE DE ITEM
  const ItemCard = ({ item }) => (
    <div className="item-card">
      <div className="item-card__header">
        <h3 className="item-card__title">{item.nome}</h3>
        <span className={`status-badge status-badge--${item.status}`}>
          {LABELS[item.status] || item.status}
        </span>
      </div>
      
      <div className="item-card__content">
        <div className="item-info">
          {item.patrimonio && (
            <div className="info-line">
              <span className="info-label">Patrimônio:</span>
              <span className="info-value">{item.patrimonio}</span>
            </div>
          )}
          {item.numero_serie && (
            <div className="info-line">
              <span className="info-label">Nº Série:</span>
              <span className="info-value">{item.numero_serie}</span>
            </div>
          )}
          <div className="info-line">
            <span className="info-label">Categoria:</span>
            <span className="info-value">{item.categoria?.nome || 'Sem categoria'}</span>
          </div>
          <div className="info-line">
            <span className="info-label">Quantidade:</span>
            <span className="info-value">{item.quantidade} un.</span>
          </div>
          {item.valor_compra && (
            <div className="info-line">
              <span className="info-label">Valor:</span>
              <span className="info-value">
                R$ {parseFloat(item.valor_compra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
        
        {item.descricao && (
          <p className="item-card__description">{item.descricao}</p>
        )}
      </div>
      
      <div className="item-card__actions">
        <Link to={`/itens/visualizar/${item.id}`} className="btn btn--visualizar">
          👁️ Visualizar
        </Link>
        
        {podeEditar && (
          <Link to={`/itens/editar/${item.id}`} className="btn btn--editar">
            ✏️ Editar
          </Link>
        )}
        
        {podeDeletar && (
          <button 
            onClick={() => handleExcluirItem(item.id, item.nome)}
            className="btn btn--excluir"
          >
            🗑️ Excluir
          </button>
        )}
      </div>
    </div>
  );

  if (loading && itens.length === 0) {
    return (
      <div className="page-loading">
        <Loading size="large" text="Carregando itens..." />
      </div>
    );
  }

  return (
    <div className="itens-page">
      {/* 🎯 CABEÇALHO COM BADGE DE PERFIL */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1>📦 Gerenciar Itens</h1>
            <div className="profile-badge">
              <span className={`badge ${user?.perfil === 'admin' ? 'badge-admin' : 
                                          user?.perfil === 'admin_estoque' ? 'badge-estoque' : 
                                          user?.perfil === 'tecnico' ? 'badge-tecnico' : 
                                          user?.perfil === 'analista' ? 'badge-analista' : 
                                          user?.perfil === 'coordenador' ? 'badge-coordenador' : 
                                          user?.perfil === 'gerente' ? 'badge-gerente' : 'badge-default'}`}>
                👤 {user?.perfil?.toUpperCase() || 'USUÁRIO'}
              </span>
            </div>
          </div>
          <p>Controle de equipamentos e patrimônio</p>
        </div>
        
        {podeCadastrar && (
          <Link to="/itens/novo" className="btn btn--success">
            ➕ Novo Item
          </Link>
        )}
      </header>

      {/* 🎯 CARD DE PERMISSÕES VISÍVEL */}
     

      {/* ❌ ERRO */}
      {error && (
        <div className="alert alert--error">
          <div className="alert__icon">❌</div>
          <div className="alert__content">
            <strong>Erro:</strong> {error}
          </div>
          <button onClick={() => carregarItens()} className="alert__action">
            Tentar Novamente
          </button>
        </div>
      )}

      {/* 🔍 FILTROS */}
      <div className="filtros-section">
        <div className="filtros-grid">
          <div className="form-group">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nome, patrimônio, descrição..."
              value={filtros.search}
              onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          
          <div className="form-group">
            <label>Categoria</label>
            <select 
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
            >
              <option value="">Todas as categorias</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Status</label>
            <select 
              value={filtros.status}
              onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Todos os status</option>
              {Object.entries(ITEM_STATUS).map(([key, value]) => (
                <option key={key} value={key}>
                  {LABELS[key] || key}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 📊 ESTATÍSTICAS */}
      <div className="estatisticas-bar">
        <div className="estatistica">
          <span className="estatistica__valor">{paginacao.total}</span>
          <span className="estatistica__label">Itens no total</span>
        </div>
        <div className="estatistica">
          <span className="estatistica__valor">
            {itens.filter(item => item.status === 'disponivel').length}
          </span>
          <span className="estatistica__label">Disponíveis</span>
        </div>
        <div className="estatistica">
          <span className="estatistica__valor">
            {itens.filter(item => item.status === 'em_uso').length}
          </span>
          <span className="estatistica__label">Em uso</span>
        </div>
      </div>

      {/* 📦 LISTA DE ITENS */}
      <div className="itens-grid">
        {itens.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📦</div>
            <h3>Nenhum item encontrado</h3>
            <p>
              {Object.values(filtros).some(f => f) 
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece cadastrando o primeiro item'
              }
            </p>
            {podeCadastrar && !Object.values(filtros).some(f => f) && (
              <Link to="/itens/novo" className="btn btn--success">
                ➕ Cadastrar Primeiro Item
              </Link>
            )}
          </div>
        ) : (
          <>
            {itens.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </>
        )}
      </div>

      {/* 📄 PAGINAÇÃO */}
      {paginacao.pages > 1 && (
        <div className="paginacao">
          <button 
            onClick={() => carregarItens(paginacao.page - 1)}
            disabled={paginacao.page === 1}
            className="paginacao__btn"
          >
            ← Anterior
          </button>
          
          <span className="paginacao__info">
            Página {paginacao.page} de {paginacao.pages}
          </span>
          
          <button 
            onClick={() => carregarItens(paginacao.page + 1)}
            disabled={paginacao.page === paginacao.pages}
            className="paginacao__btn"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
};

export default ItensList;