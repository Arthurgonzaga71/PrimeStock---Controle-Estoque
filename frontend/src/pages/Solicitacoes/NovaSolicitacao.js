// frontend/src/pages/Solicitacoes/NovaSolicitacao.js - VERSÃO SEM LIMITES
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './NovaSolicitacao.css';

const NovaSolicitacao = () => {
  const { user } = useAuth(); // Removido: verificarLimiteSolicitacao
  const navigate = useNavigate();
  
  const [modo, setModo] = useState('retirada'); // 'retirada' ou 'compra'
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  
  // 🔥 REMOVIDO: Limites do usuário (não existem no backend)
  // const limitesUsuario = permissoes?.limites || {...} - REMOVIDO
  
  // Formulário principal
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    tipo: 'equipamento',
    tipo_solicitacao: 'retirada_estoque',
    orcamento_estimado: '',
    fornecedor_sugerido: '',
    link_referencia: '',
    urgencia_compra: 'media',
    data_devolucao_prevista: ''
  });
  
  // Itens da solicitação
  const [itens, setItens] = useState([]);
  
  // Para busca de itens no estoque
  const [estoqueDisponivel, setEstoqueDisponivel] = useState([]);
  const [buscaEstoque, setBuscaEstoque] = useState('');
  const [carregandoEstoque, setCarregandoEstoque] = useState(false);
  const [mostrarBuscaEstoque, setMostrarBuscaEstoque] = useState(false);

  // 🎯 INICIALIZAR - Removida verificação de limites
  useEffect(() => {
    console.log('👤 Perfil:', user?.perfil);
  }, [user]);

  // 🎯 CALCULAR VALOR TOTAL DA SOLICITAÇÃO
  const calcularValorTotal = () => {
    return itens.reduce((total, item) => {
      const valor = parseFloat(item.valor_unitario_estimado) || 0;
      const quantidade = parseInt(item.quantidade_solicitada) || 0;
      return total + (valor * quantidade);
    }, 0);
  };

  // 🎯 BUSCAR ITENS DO ESTOQUE
  const buscarItensEstoque = async (termo = '') => {
    try {
      setCarregandoEstoque(true);
      setErro('');
      
      let endpoint = '/itens';
      let params = {
        disponivel: true,
        search: termo,
        limit: 50 // Aumentado para mostrar mais itens
      };
      
      console.log('🔍 Buscando itens do estoque:', endpoint, params);
      
      const response = await api.get(endpoint, { params });
      
      if (response.data.success) {
        const itensData = response.data.data?.itens || response.data.data || response.data.itens || [];
        console.log('✅ Itens encontrados:', itensData.length);
        setEstoqueDisponivel(itensData);
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível buscar itens do estoque:', error.message);
      // Fallback desativado por enquanto
      setEstoqueDisponivel([]);
    } finally {
      setCarregandoEstoque(false);
    }
  };

  // 🎯 ALTERNAR VISÃO DA BUSCA DE ESTOQUE
  useEffect(() => {
    if (modo === 'retirada' && mostrarBuscaEstoque && estoqueDisponivel.length === 0) {
      buscarItensEstoque();
    }
  }, [modo, mostrarBuscaEstoque]);

  // 🎯 ADICIONAR NOVO ITEM - SEM LIMITE DE ITENS
  const adicionarItem = () => {
    const novoItem = {
      id: Date.now() + Math.random(),
      nome_item: '',
      quantidade_solicitada: 1,
      tipo_item: modo === 'retirada' ? 'estoque' : 'novo',
      valor_unitario_estimado: '',
      fornecedor: '',
      link_produto: '',
      motivo_uso: '',
      urgencia: 'normal',
      categoria_sugerida: '',
      especificacoes_tecnicas: {}
    };
    
    if (modo === 'retirada') {
      novoItem.item_id = null;
    }
    
    setItens([...itens, novoItem]);
    setErro('');
    setMostrarBuscaEstoque(false);
  };

  // 🎯 REMOVER ITEM
  const removerItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  // 🎯 ATUALIZAR ITEM
  const atualizarItem = (id, campo, valor) => {
    setItens(itens.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  // 🎯 ADICIONAR ITEM DO ESTOQUE - SEM LIMITE DE ITENS
  const adicionarItemEstoque = (itemEstoque) => {
    const itemExistente = itens.find(item => item.item_id === itemEstoque.id);
    if (itemExistente) {
      atualizarItem(itemExistente.id, 'quantidade_solicitada', 
        parseInt(itemExistente.quantidade_solicitada) + 1);
      return;
    }
    
    const novoItem = {
      id: Date.now() + Math.random(),
      item_id: itemEstoque.id,
      modelo_equipamento_id: itemEstoque.modelo_equipamento_id,
      nome_item: itemEstoque.nome || itemEstoque.titulo || 'Item do estoque',
      quantidade_solicitada: 1,
      tipo_item: 'estoque',
      valor_unitario_estimado: itemEstoque.valor_unitario || itemEstoque.valor || 0,
      motivo_uso: '',
      urgencia: 'normal',
      especificacoes_tecnicas: itemEstoque.especificacoes || itemEstoque.descricao || {}
    };
    
    setItens([...itens, novoItem]);
    setBuscaEstoque('');
    setMostrarBuscaEstoque(false);
  };

  // 🎯 EXEMPLO DE ITENS DO ESTOQUE (fallback)
  const itensEstoqueExemplo = [
    {
      id: 1,
      nome: 'Notebook Dell Latitude 5420',
      codigo: 'NB-DELL-001',
      quantidade_disponivel: 5,
      localizacao: 'Almoxarifado A',
      valor_unitario: 4500.00,
      modelo_equipamento_id: 1
    },
    {
      id: 2,
      nome: 'Monitor Dell 24" UltraSharp',
      codigo: 'MON-DELL-001',
      quantidade_disponivel: 3,
      localizacao: 'Almoxarifado B',
      valor_unitario: 1800.00,
      modelo_equipamento_id: 2
    }
  ];

  // 🎯 CALCULAR ORÇAMENTO TOTAL (só para modo compra)
  useEffect(() => {
    if (modo === 'compra') {
      const total = calcularValorTotal();
      
      setFormData(prev => ({
        ...prev,
        orcamento_estimado: total > 0 ? total : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        orcamento_estimado: ''
      }));
    }
  }, [itens, modo]);

  // 🎯 MUDAR MODO (retirada/compra)
  const handleMudarModo = (novoModo) => {
    setModo(novoModo);
    setFormData(prev => ({
      ...prev,
      tipo_solicitacao: novoModo === 'retirada' ? 'retirada_estoque' : 'compra_novo'
    }));
    setItens([]);
    setErro('');
    setMostrarBuscaEstoque(false);
  };

  // 🎯 VALIDAR FORMULÁRIO - REMOVIDAS VALIDAÇÕES DE LIMITE
  const validarFormulario = () => {
    if (!formData.titulo.trim()) {
      setErro('❌ Título da solicitação é obrigatório');
      return false;
    }

    if (itens.length === 0) {
      setErro('❌ Adicione pelo menos um item à solicitação');
      return false;
    }

    // ❌ REMOVIDO: Validação de limite de itens (15 máximo)
    // ❌ REMOVIDO: Validação de valor total (R$ 2.000 máximo)
    // ❌ REMOVIDO: Validação de prazo de devolução (45 dias máximo)

    // Validar cada item
    for (const item of itens) {
      if (!item.nome_item.trim()) {
        setErro('❌ Nome do item é obrigatório');
        return false;
      }
      
      if (!item.motivo_uso?.trim() && modo === 'retirada') {
        setErro('❌ Motivo da retirada é obrigatório para cada item');
        return false;
      }
      
      if (item.quantidade_solicitada < 1) {
        setErro('❌ Quantidade deve ser maior que zero');
        return false;
      }
      
      if (modo === 'compra' && item.tipo_item === 'novo' && !item.motivo_uso?.trim()) {
        setErro('❌ Motivo da compra é obrigatório para cada item');
        return false;
      }
    }

    return true;
  };

  // 🎯 ENVIAR SOLICITAÇÃO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    
    // ✅ VALIDAR FORMULÁRIO SEM LIMITES
    if (!validarFormulario()) return;
    
    try {
      setLoading(true);
      
      // ❌ REMOVIDO: Verificação de limites usando Auth Context
      const solicitacaoData = {
        ...formData,
        orcamento_estimado: formData.orcamento_estimado ? 
          parseFloat(formData.orcamento_estimado) : null,
        fornecedor_sugerido: formData.fornecedor_sugerido || '',
        link_referencia: formData.link_referencia || '',
        urgencia_compra: modo === 'compra' ? formData.urgencia_compra : 'media',
        data_devolucao_prevista: formData.data_devolucao_prevista || null,
        itens: itens.map(item => ({
          nome_item: item.nome_item,
          quantidade_solicitada: parseInt(item.quantidade_solicitada),
          tipo_item: item.tipo_item,
          valor_unitario_estimado: parseFloat(item.valor_unitario_estimado) || null,
          fornecedor: item.fornecedor || '',
          link_produto: item.link_produto || '',
          motivo_uso: item.motivo_uso || '',
          urgencia: item.urgencia,
          item_id: item.item_id || null,
          modelo_equipamento_id: item.modelo_equipamento_id || null,
          especificacoes_tecnicas: item.especificacoes_tecnicas || {},
          especificacoes: {
            categoria_sugerida: item.categoria_sugerida || ''
          }
        }))
      };
      
      console.log('📤 Enviando solicitação:', solicitacaoData);
      
      const response = await api.post('/solicitacoes', solicitacaoData);
      
      if (response.data.success) {
        setSucesso(`✅ Solicitação criada com sucesso! Código: ${response.data.data.codigo_solicitacao}`);
        
        // Limpar formulário
        setFormData({
          titulo: '',
          descricao: '',
          prioridade: 'media',
          tipo: 'equipamento',
          tipo_solicitacao: modo === 'retirada' ? 'retirada_estoque' : 'compra_novo',
          orcamento_estimado: '',
          fornecedor_sugerido: '',
          link_referencia: '',
          urgencia_compra: 'media',
          data_devolucao_prevista: ''
        });
        setItens([]);
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate(`/solicitacoes/${response.data.data.id}`);
        }, 3000);
      } else {
        throw new Error(response.data.error || 'Erro ao criar solicitação');
      }
    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error);
      
      // Mensagem de erro mais específica
      if (error.response?.status === 404) {
        setErro('❌ Rota não encontrada. Verifique se o backend está rodando.');
      } else if (error.response?.data?.error) {
        setErro(`❌ ${error.response.data.error}`);
      } else if (error.message.includes('Network Error')) {
        setErro('❌ Não foi possível conectar ao servidor.');
      } else {
        setErro(error.message || '❌ Erro ao criar solicitação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🎯 FORMATAR MOEDA
  const formatarMoeda = (valor) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // 🎯 GERAR OPÇÕES DE PRAZO (até 365 dias - sem limite específico)
  const gerarOpcoesPrazo = () => {
    const opcoes = [];
    // 🔥 ALTERADO: Até 365 dias em vez de 45
    for (let i = 1; i <= 365; i++) {
      opcoes.push({
        value: i,
        label: `${i} dia${i > 1 ? 's' : ''}`
      });
    }
    return opcoes;
  };

  // 🎯 CALCULAR VALOR TOTAL
  const valorTotal = calcularValorTotal();

  return (
    <div className="nova-solicitacao-page">
      {/* Cabeçalho */}
      <div className="nova-solicitacao-header">
        <h1 className="nova-solicitacao-title">
          {modo === 'retirada' ? '📦 Nova Retirada do Estoque' : '🛒 Nova Solicitação de Compra'}
        </h1>
        <p className="nova-solicitacao-subtitle">
          {modo === 'retirada' 
            ? 'Solicite a retirada de itens disponíveis no estoque' 
            : 'Solicite a compra de novos itens'}
        </p>
        
        {/* 🔥 REMOVIDO: INFO DE LIMITES (painel com 15 itens, R$ 2.000, 45 dias) */}
        {/* <div className="limites-info">...</div> */}
      </div>

      {/* Seletor de Modo */}
      <div className="modo-selecao">
        <button
          type="button"
          onClick={() => handleMudarModo('retirada')}
          className={`modo-btn ${modo === 'retirada' ? 'active' : ''}`}
        >
          📦 Retirada do Estoque
          <span className="modo-desc">Itens disponíveis no estoque</span>
        </button>
        
        <button
          type="button"
          onClick={() => handleMudarModo('compra')}
          className={`modo-btn ${modo === 'compra' ? 'active' : ''}`}
        >
          🛒 Solicitar Compra
          <span className="modo-desc">Novos itens para aquisição</span>
        </button>
      </div>

      {/* 🔥 REMOVIDO: PAINEL DE LIMITES COMPLETO
      <div className="limites-panel">
        ...
      </div> */}

      {/* Informações do Usuário */}
      <div className="user-info-panel">
        <div className="user-info-title">👤 Informações do Solicitante</div>
        <div className="user-info-details">
          <div className="user-info-item">
            <span className="user-info-label">Nome:</span>
            <span className="user-info-value">{user?.nome}</span>
          </div>
          <div className="user-info-item">
            <span className="user-info-label">Departamento:</span>
            <span className="user-info-value">{user?.departamento}</span>
          </div>
          <div className="user-info-item">
            <span className="user-info-label">Perfil:</span>
            <span className={`user-info-value perfil-${user?.perfil}`}>
              {user?.perfil?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div className="error-message">
          ❌ {erro}
        </div>
      )}
      
      {sucesso && (
        <div className="success-message">
          ✅ {sucesso}
          <div className="success-redirect">
            Redirecionando para os detalhes...
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="solicitacao-form">
        {/* Dados da Solicitação */}
        <div className="form-section">
          <h3 className="form-section-title">📋 Dados da Solicitação</h3>
          
          <div className="form-grid">
            <div className="form-group form-group-full">
              <label className="form-label form-label-required">
                Título da Solicitação
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                className="form-input"
                placeholder={
                  modo === 'retirada' 
                    ? 'Ex: Retirada de equipamentos para novo projeto' 
                    : 'Ex: Compra de novos equipamentos para expansão'
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({...formData, prioridade: e.target.value})}
                className="form-select"
                required
              >
                <option value="baixa">🟢 Baixa</option>
                <option value="media">🟡 Média</option>
                <option value="alta">🟠 Alta</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">
                Tipo
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                className="form-select"
                required
              >
                <option value="equipamento">💻 Equipamento</option>
                <option value="material">📦 Material</option>
                <option value="software">🖥️ Software</option>
                <option value="manutencao">🔧 Manutenção</option>
              </select>
            </div>

            {modo === 'compra' && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    Urgência da Compra
                  </label>
                  <select
                    value={formData.urgencia_compra}
                    onChange={(e) => setFormData({...formData, urgencia_compra: e.target.value})}
                    className="form-select"
                  >
                    <option value="baixa">🟢 Baixa (30+ dias)</option>
                    <option value="media">🟡 Média (15-30 dias)</option>
                    <option value="alta">🟠 Alta (7-14 dias)</option>
                    <option value="imediata">🔴 Imediata (1-7 dias)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Prazo de Devolução
                  </label>
                  <select
                    value={formData.data_devolucao_prevista}
                    onChange={(e) => setFormData({...formData, data_devolucao_prevista: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Não se aplica</option>
                    {gerarOpcoesPrazo().map(opcao => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">
              Descrição / Justificativa
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              rows="3"
              className="form-textarea"
              placeholder={
                modo === 'retirada'
                  ? 'Descreva o motivo da retirada, projeto relacionado, tempo estimado de uso...'
                  : 'Justifique a necessidade desta compra, benefícios esperados, impacto no trabalho...'
              }
            />
          </div>

          {modo === 'compra' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Orçamento Estimado
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.orcamento_estimado}
                    onChange={(e) => setFormData({...formData, orcamento_estimado: e.target.value})}
                    className="form-input"
                    placeholder="0,00"
                    readOnly
                  />
                </div>
                <small className="text-muted">Calculado automaticamente com base nos itens</small>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Fornecedor Sugerido
                </label>
                <input
                  type="text"
                  value={formData.fornecedor_sugerido}
                  onChange={(e) => setFormData({...formData, fornecedor_sugerido: e.target.value})}
                  className="form-input"
                  placeholder="Ex: Dell, Amazon, Kabum"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Link de Referência
                </label>
                <input
                  type="url"
                  value={formData.link_referencia}
                  onChange={(e) => setFormData({...formData, link_referencia: e.target.value})}
                  className="form-input"
                  placeholder="https://exemplo.com/produto"
                />
              </div>
            </div>
          )}
        </div>

        {/* 🎯 SEÇÃO DE ITENS - SEM LIMITES */}
        <div className="form-section">
          <h3 className="form-section-title">
            {modo === 'retirada' ? '📦 Itens do Estoque' : '🛍️ Itens para Compra'}
          </h3>
          
          {/* Para modo retirada: opção de buscar estoque ou adicionar manual */}
          {modo === 'retirada' && (
            <div className="estoque-opcoes">
              <div className="estoque-opcoes-botoes">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarBuscaEstoque(!mostrarBuscaEstoque);
                    if (!mostrarBuscaEstoque) {
                      buscarItensEstoque();
                    }
                  }}
                  className={`btn-estoque-opcao ${mostrarBuscaEstoque ? 'active' : ''}`}
                >
                  🔍 Buscar no Estoque
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarBuscaEstoque(false);
                    adicionarItem();
                  }}
                  className="btn-estoque-opcao"
                >
                  ✍️ Adicionar Manualmente
                </button>
              </div>
              
              {mostrarBuscaEstoque && (
                <div className="estoque-busca">
                  <div className="estoque-busca-header">
                    <h4>🔍 Buscar itens disponíveis no estoque</h4>
                    <div className="estoque-busca-info">
                      <span className="estoque-disponivel">
                        {estoqueDisponivel.length} itens disponíveis
                      </span>
                      <span className="estoque-selecionados">
                        {itens.filter(item => item.tipo_item === 'estoque').length} itens selecionados
                      </span>
                    </div>
                  </div>
                  
                  <div className="estoque-busca-input">
                    <input
                      type="text"
                      value={buscaEstoque}
                      onChange={(e) => {
                        setBuscaEstoque(e.target.value);
                        buscarItensEstoque(e.target.value);
                      }}
                      placeholder="Buscar por nome, código, modelo..."
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => buscarItensEstoque(buscaEstoque)}
                      className="btn-buscar"
                    >
                      🔍 Buscar
                    </button>
                  </div>
                  
                  {carregandoEstoque ? (
                    <div className="estoque-carregando">
                      <div className="spinner"></div>
                      <p>Carregando itens do estoque...</p>
                    </div>
                  ) : (
                    <div className="estoque-lista">
                      {estoqueDisponivel.slice(0, 12).map(item => (
                        <div key={item.id} className="estoque-item">
                          <div className="estoque-item-info">
                            <div className="estoque-item-nome">
                              <strong>{item.nome}</strong>
                              {item.numero_serie && (
                                <span className="estoque-item-serie">S/N: {item.numero_serie}</span>
                              )}
                            </div>
                            <div className="estoque-item-detalhes">
                              <span>Código: {item.codigo}</span>
                              <span>Disponível: {item.quantidade_disponivel}</span>
                              {item.localizacao && (
                                <span>Local: {item.localizacao}</span>
                              )}
                              {item.valor_unitario && (
                                <span>Valor: {formatarMoeda(item.valor_unitario)}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => adicionarItemEstoque(item)}
                            className="btn-adicionar-estoque"
                            disabled={(item.quantidade_disponivel || 0) < 1}
                          >
                            {(item.quantidade_disponivel || 0) < 1 ? 'Indisponível' : '+ Adicionar'}
                          </button>
                        </div>
                      ))}
                      
                      {estoqueDisponivel.length === 0 && (
                        <div className="estoque-vazio">
                          <p>Nenhum item encontrado no estoque</p>
                          <small className="text-muted">
                            Você pode adicionar itens manualmente
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* 🎯 LISTA DE ITENS ADICIONADOS - SEM LIMITE DE QUANTIDADE */}
          <div className="itens-adicionados">
            <div className="itens-header">
              <div className="itens-header-titulo">
                <h4>📋 Itens Adicionados ({itens.length})</h4>
                {modo === 'compra' && (
                  <span className="orcamento-total">
                    Valor Total: <strong>{formatarMoeda(valorTotal)}</strong>
                  </span>
                )}
                {modo === 'retirada' && itens.length > 0 && (
                  <span className="itens-tipo-info">
                    {itens.filter(i => i.tipo_item === 'estoque').length} do estoque
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={adicionarItem}
                className="btn-add-item"
              >
                + Adicionar Item {modo === 'retirada' ? 'do Estoque' : 'para Compra'}
              </button>
            </div>
            
            {itens.length === 0 ? (
              <div className="itens-empty-state">
                <div className="itens-empty-icon">
                  {modo === 'retirada' ? '📦' : '🛒'}
                </div>
                <h4 className="itens-empty-title">Nenhum item adicionado</h4>
                <p className="itens-empty-description">
                  {modo === 'retirada'
                    ? 'Busque itens no estoque ou adicione manualmente'
                    : 'Adicione os itens que você precisa comprar'
                  }
                </p>
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="btn-add-item"
                >
                  + Adicionar Primeiro Item
                </button>
              </div>
            ) : (
              <div className="itens-lista">
                {itens.map((item, index) => (
                  <div key={item.id} className={`item-card ${item.tipo_item}`}>
                    <div className="item-card-header">
                      <div className="item-card-titulo">
                        <span className="item-numero">Item {index + 1}</span>
                        <span className="item-tipo">
                          {item.tipo_item === 'estoque' ? '📦 Estoque' : '🛒 Compra'}
                        </span>
                        <h4>{item.nome_item || 'Item sem nome'}</h4>
                        {item.item_id && (
                          <span className="item-estoque-info">(Do estoque)</span>
                        )}
                      </div>
                      <div className="item-card-actions">
                        <span className="item-valor-total">
                          {item.valor_unitario_estimado > 0 && (
                            <>
                              Unitário: {formatarMoeda(item.valor_unitario_estimado)} | 
                              Total: {formatarMoeda(item.valor_unitario_estimado * item.quantidade_solicitada)}
                            </>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerItem(item.id)}
                          className="btn-remove-item"
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    </div>
                    
                    <div className="item-card-conteudo">
                      <div className="item-form-grid">
                        <div className="form-group">
                          <label className="form-label form-label-required">
                            Nome do Item
                          </label>
                          <input
                            type="text"
                            value={item.nome_item}
                            onChange={(e) => atualizarItem(item.id, 'nome_item', e.target.value)}
                            className="form-input"
                            placeholder={
                              modo === 'retirada'
                                ? 'Ex: Notebook Dell Latitude'
                                : 'Ex: Monitor Dell 24" UltraSharp'
                            }
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label form-label-required">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade_solicitada}
                            onChange={(e) => atualizarItem(item.id, 'quantidade_solicitada', e.target.value)}
                            className="form-input"
                            required
                          />
                        </div>
                        
                        {modo === 'compra' && (
                          <div className="form-group">
                            <label className="form-label">
                              Valor Unitário Estimado
                            </label>
                            <div className="input-with-prefix">
                              <span className="input-prefix">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.valor_unitario_estimado}
                                onChange={(e) => {
                                  const novoValor = e.target.value;
                                  atualizarItem(item.id, 'valor_unitario_estimado', novoValor);
                                }}
                                className="form-input"
                                placeholder="0,00"
                              />
                            </div>
                          </div>
                        )}
                        
                        {modo === 'compra' && (
                          <div className="form-group">
                            <label className="form-label">
                              Fornecedor
                            </label>
                            <input
                              type="text"
                              value={item.fornecedor}
                              onChange={(e) => atualizarItem(item.id, 'fornecedor', e.target.value)}
                              className="form-input"
                              placeholder="Ex: Dell, Amazon, Kabum"
                            />
                          </div>
                        )}
                        
                        <div className="form-group form-group-full">
                          <label className="form-label form-label-required">
                            {modo === 'retirada' ? 'Motivo da Retirada' : 'Motivo da Compra'}
                          </label>
                          <input
                            type="text"
                            value={item.motivo_uso}
                            onChange={(e) => atualizarItem(item.id, 'motivo_uso', e.target.value)}
                            className="form-input"
                            placeholder={
                              modo === 'retirada'
                                ? 'Ex: Para uso no projeto X, treinamento, substituição...'
                                : 'Ex: Substituição, novo projeto, expansão...'
                            }
                            required
                          />
                        </div>
                        
                        <div className="form-group form-group-full">
                          <label className="form-label">
                            Especificações / Observações
                          </label>
                          <textarea
                            value={item.especificacoes_tecnicas?.descricao || ''}
                            onChange={(e) => atualizarItem(item.id, 'especificacoes_tecnicas', {
                              ...item.especificacoes_tecnicas,
                              descricao: e.target.value
                            })}
                            rows="2"
                            className="form-textarea"
                            placeholder="Detalhes adicionais sobre o item..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ações do Formulário */}
        <div className="form-actions">
          <Link to="/solicitacoes" className="btn-cancel">
            ← Cancelar
          </Link>
          <div className="form-actions-direita">
            <button
              type="button"
              onClick={() => {
                const confirmar = window.confirm('Deseja salvar como rascunho? Você pode continuar depois.');
                if (confirmar) {
                  alert('Solicitação salva como rascunho! (Funcionalidade em desenvolvimento)');
                  navigate('/solicitacoes');
                }
              }}
              className="btn-rascunho"
              disabled={loading || itens.length === 0}
            >
              💾 Salvar como Rascunho
            </button>
            <button
              type="submit"
              disabled={loading || itens.length === 0}
              className="btn-submit"
            >
              {loading ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Enviando Solicitação...
                </>
              ) : (
                <>
                  {modo === 'retirada' ? '📤 Enviar para Aprovação' : '🛒 Solicitar Compra'}
                  <span className="btn-submit-info">
                    {itens.length} item{itens.length !== 1 ? 's' : ''} • {formatarMoeda(valorTotal)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NovaSolicitacao;