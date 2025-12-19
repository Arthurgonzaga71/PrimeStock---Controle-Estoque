// src/pages/Itens/ItemView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itensService } from '../../services/api';
import { Button, Loading } from '../../components/UI';
import { ITEM_STATUS, ITEM_ESTADO, LABELS, STATUS_COLORS } from '../../utils/constants';
import './Itens.css';

const ItemView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userPermissions, permissoes, canUpdate, canDelete } = useAuth(); // ✅ Pegando múltiplas possibilidades
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('info');

  // 📋 CARREGAR ITEM
  useEffect(() => {
    const carregarItem = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await itensService.getById(id);
        
        if (response.data.success) {
          setItem(response.data.data);
        } else {
          throw new Error('Item não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar item:', error);
        setError(error.response?.data?.message || 'Erro ao carregar item');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      carregarItem();
    }
  }, [id]);

  // 🗑️ EXCLUIR ITEM
  const handleExcluir = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir o item "${item.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await itensService.delete(id);
      alert('Item excluído com sucesso!');
      navigate('/itens');
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Erro ao excluir item: ' + (error.response?.data?.message || error.message));
    }
  };

  // 💰 FORMATAR VALOR
  const formatarValor = (valor) => {
    if (!valor) return 'Não informado';
    return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // 📅 FORMATAR DATA
  const formatarData = (dataString) => {
    if (!dataString) return 'Não informada';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  // ✅ FUNÇÃO SEGURA PARA VERIFICAR PERMISSÕES
  const verificarPermissao = (tipo) => {
    // Tenta múltiplas formas de encontrar as permissões
    if (userPermissions && typeof userPermissions[tipo] === 'boolean') {
      return userPermissions[tipo];
    }
    
    if (permissoes && typeof permissoes[tipo] === 'boolean') {
      return permissoes[tipo];
    }
    
    if (tipo === 'canUpdate' && canUpdate !== undefined) {
      return canUpdate;
    }
    
    if (tipo === 'canDelete' && canDelete !== undefined) {
      return canDelete;
    }
    
    // Se não encontrar, verifica no usuário
    if (user?.permissoes && typeof user.permissoes[tipo] === 'boolean') {
      return user.permissoes[tipo];
    }
    
    // Se ainda não encontrar, verifica pelo perfil
    if (user?.perfil) {
      const perfisComPermissaoTotal = ['admin', 'admin_estoque', 'coordenador'];
      return perfisComPermissaoTotal.includes(user.perfil);
    }
    
    return false; // Padrão: sem permissão
  };

  // ✅ PERMISSÕES CALCULADAS
  const podeEditar = verificarPermissao('canUpdate') || verificarPermissao('update');
  const podeExcluir = verificarPermissao('canDelete') || verificarPermissao('delete');

  if (loading) {
    return (
      <div className="page-loading">
        <Loading size="large" text="Carregando item..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <div className="error-content">
          <h2>❌ Item Não Encontrado</h2>
          <p>{error}</p>
          <div className="error-actions">
            <Button onClick={() => navigate('/itens')} variant="primary">
              ← Voltar para Lista
            </Button>
            <Button onClick={() => window.location.reload()} variant="secondary">
              🔄 Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="error-page">
        <div className="error-content">
          <h2>📦 Item Não Encontrado</h2>
          <p>O item solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/itens')} variant="primary">
            ← Voltar para Lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="item-view-page">
      {/* 🎯 CABEÇALHO */}
      <header className="page-header">
        <div className="header-content">
          <h1>👁️ Visualizar Item</h1>
          <p>Detalhes completos do equipamento</p>
        </div>
        
        <div className="header-actions">
          <Link to="/itens" className="btn btn--secondary">
            ← Voltar
          </Link>
          
          {podeEditar && (
            <Link to={`/itens/editar/${item.id}`} className="btn btn--primary">
              ✏️ Editar
            </Link>
          )}
          
          {podeExcluir && (
            <button onClick={handleExcluir} className="btn btn--danger">
              🗑️ Excluir
            </button>
          )}
        </div>
      </header>

      {/* 📦 INFORMAÇÕES PRINCIPAIS */}
      <div className="item-header-card">
        <div className="item-header__main">
          <h2 className="item-title">{item.nome}</h2>
          <div className="item-badges">
            <span className={`status-badge status-badge--${item.status}`}>
              {LABELS[item.status]}
            </span>
            <span className={`status-badge status-badge--${item.estado}`}>
              {LABELS[item.estado]}
            </span>
            {item.categoria && (
              <span className="categoria-badge">
                {item.categoria.nome}
              </span>
            )}
          </div>
        </div>
        
        <div className="item-header__meta">
          <div className="meta-item">
            <span className="meta-label">Quantidade:</span>
            <span className="meta-value">{item.quantidade} un.</span>
          </div>
          {item.patrimonio && (
            <div className="meta-item">
              <span className="meta-label">Patrimônio:</span>
              <span className="meta-value">{item.patrimonio}</span>
            </div>
          )}
          {item.numero_serie && (
            <div className="meta-item">
              <span className="meta-label">Nº Série:</span>
              <span className="meta-value">{item.numero_serie}</span>
            </div>
          )}
        </div>
      </div>

      {/* 📊 ABAS */}
      <div className="abas-navegacao">
        <button 
          className={`aba ${abaAtiva === 'info' ? 'aba--ativa' : ''}`}
          onClick={() => setAbaAtiva('info')}
        >
          📋 Informações
        </button>
        <button 
          className={`aba ${abaAtiva === 'espec' ? 'aba--ativa' : ''}`}
          onClick={() => setAbaAtiva('espec')}
        >
          🔧 Especificações
        </button>
        <button 
          className={`aba ${abaAtiva === 'historico' ? 'aba--ativa' : ''}`}
          onClick={() => setAbaAtiva('historico')}
        >
          📊 Histórico
        </button>
      </div>

      {/* 📋 CONTEÚDO DAS ABAS */}
      <div className="aba-conteudo">
        
        {/* 📋 ABA INFORMAÇÕES */}
        {abaAtiva === 'info' && (
          <div className="info-grid">
            <div className="info-section">
              <h3>📝 Descrição</h3>
              <p className="info-text">{item.descricao || 'Nenhuma descrição fornecida.'}</p>
            </div>

            <div className="info-section">
              <h3>📍 Localização</h3>
              <p className="info-text">{item.localizacao || 'Localização não informada'}</p>
            </div>

            <div className="info-section">
              <h3>💰 Dados de Aquisição</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Data de Aquisição:</span>
                  <span className="info-value">{formatarData(item.data_aquisicao)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Valor de Compra:</span>
                  <span className="info-value">{formatarValor(item.valor_compra)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Fornecedor:</span>
                  <span className="info-value">{item.fornecedor || 'Não informado'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nota Fiscal:</span>
                  <span className="info-value">{item.nota_fiscal || 'Não informada'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>📊 Estoque</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Quantidade Atual:</span>
                  <span className="info-value">{item.quantidade} unidades</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Estoque Mínimo:</span>
                  <span className="info-value">{item.estoque_minimo} unidades</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Situação do Estoque:</span>
                  <span className={`info-value ${item.quantidade <= item.estoque_minimo ? 'texto-perigo' : 'texto-sucesso'}`}>
                    {item.quantidade <= item.estoque_minimo ? '⚠️ Abaixo do mínimo' : '✅ Normal'}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>👤 Informações do Sistema</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Cadastrado por:</span>
                  <span className="info-value">{item.criador?.nome || 'Sistema'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Data de Cadastro:</span>
                  <span className="info-value">{formatarData(item.criado_em)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Última Atualização:</span>
                  <span className="info-value">{formatarData(item.atualizado_em)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔧 ABA ESPECIFICAÇÕES */}
        {abaAtiva === 'espec' && (
          <div className="espec-grid">
            {item.especificacoes ? (
              <div className="info-section">
                <h3>🔧 Especificações Técnicas</h3>
                <div className="info-list">
                  {Object.entries(item.especificacoes).map(([chave, valor]) => (
                    valor && (
                      <div key={chave} className="info-item">
                        <span className="info-label">{LABELS[chave] || chave}:</span>
                        <span className="info-value">{valor}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">🔧</div>
                <h3>Nenhuma Especificação</h3>
                <p>Nenhuma especificação técnica foi cadastrada para este item.</p>
                {podeEditar && (
                  <Link to={`/itens/editar/${item.id}`} className="btn btn--primary">
                    ✏️ Adicionar Especificações
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* 📊 ABA HISTÓRICO */}
        {abaAtiva === 'historico' && (
          <div className="historico-grid">
            {/* 📥 MOVIMENTAÇÕES */}
            <div className="info-section">
              <h3>📥 Movimentações Recentes</h3>
              {item.movimentacoes && item.movimentacoes.length > 0 ? (
                <div className="historico-lista">
                  {item.movimentacoes.map(mov => (
                    <div key={mov.id} className="historico-item">
                      <div className="historico-icon">
                        {mov.tipo === 'entrada' ? '📥' : 
                         mov.tipo === 'saida' ? '📤' : 
                         mov.tipo === 'devolucao' ? '🔄' : '⚡'}
                      </div>
                      <div className="historico-content">
                        <div className="historico-title">
                          <span className={`badge badge--${mov.tipo}`}>
                            {LABELS[mov.tipo]}
                          </span>
                          <span className="historico-quantidade">
                            {mov.quantidade} un.
                          </span>
                        </div>
                        <div className="historico-details">
                          {mov.destinatario && (
                            <span className="historico-destinatario">
                              Para: {mov.destinatario}
                              {mov.departamento_destino && ` (${mov.departamento_destino})`}
                            </span>
                          )}
                          <span className="historico-usuario">
                            por {mov.usuario?.nome}
                          </span>
                        </div>
                        <div className="historico-time">
                          {formatarData(mov.data_movimentacao)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="info-text">Nenhuma movimentação registrada.</p>
              )}
            </div>

            {/* 🛠️ MANUTENÇÕES */}
            <div className="info-section">
              <h3>🛠️ Histórico de Manutenções</h3>
              {item.manutencoes && item.manutencoes.length > 0 ? (
                <div className="historico-lista">
                  {item.manutencoes.map(manut => (
                    <div key={manut.id} className="historico-item">
                      <div className="historico-icon">
                        {manut.status === 'aberta' ? '🔴' : 
                         manut.status === 'em_andamento' ? '🟡' : '🟢'}
                      </div>
                      <div className="historico-content">
                        <div className="historico-title">
                          <span className={`badge badge--${manut.status}`}>
                            {LABELS[manut.status]}
                          </span>
                          <span className="historico-tipo">
                            {LABELS[manut.tipo_manutencao]}
                          </span>
                        </div>
                        <div className="historico-details">
                          <span className="historico-problema">
                            {manut.descricao_problema}
                          </span>
                          <span className="historico-tecnico">
                            Técnico: {manut.tecnico?.nome}
                          </span>
                        </div>
                        <div className="historico-time">
                          Aberta em: {formatarData(manut.data_abertura)}
                          {manut.data_conclusao && ` • Concluída em: ${formatarData(manut.data_conclusao)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="info-text">Nenhuma manutenção registrada.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemView;