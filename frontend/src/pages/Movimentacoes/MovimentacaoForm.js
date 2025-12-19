// src/pages/Movimentacoes/MovimentacaoForm.js - VERSÃO COM EDIÇÃO
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { movimentacoesService, itensService } from '../../services/api';
import { Button, Loading } from '../../components/UI';
import { TIPO_MOVIMENTACAO, DEPARTAMENTOS, LABELS } from '../../utils/constants';
import './MovimentacaoForm.css';

const MovimentacaoForm = () => {
  const { id } = useParams(); // ID para edição
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(!!id);
  const [error, setError] = useState('');
  const [itens, setItens] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  
  // 🔥 REMOVI: modoVisualizacao - Agora pode editar!

  const [formData, setFormData] = useState({
    item_id: '',
    tipo: 'saida',
    quantidade: 1,
    destinatario: '',
    departamento_destino: '',
    data_devolucao_prevista: '',
    observacao: ''
  });

  // 📋 CARREGAR DADOS PARA EDIÇÃO
  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      try {
        setCarregando(true);
        const response = await movimentacoesService.getById(id);
        
        if (response.data.success) {
          const movimentacao = response.data.data;
          setFormData({
            item_id: movimentacao.item_id,
            tipo: movimentacao.tipo,
            quantidade: movimentacao.quantidade,
            destinatario: movimentacao.destinatario || '',
            departamento_destino: movimentacao.departamento_destino || '',
            data_devolucao_prevista: movimentacao.data_devolucao_prevista 
              ? movimentacao.data_devolucao_prevista.split('T')[0] 
              : '',
            observacao: movimentacao.observacao || ''
          });
          
          // Encontrar o item selecionado
          const item = movimentacao.item;
          if (item) {
            setItemSelecionado(item);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar movimentação:', error);
        setError('Erro ao carregar dados da movimentação');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [id]);

  // 📦 CARREGAR ITENS (sempre carrega, mesmo para edição)
  useEffect(() => {
    const carregarItens = async () => {
      try {
        const response = await itensService.getAll({ limit: 100 });
        if (response.data.success) {
          setItens(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
      }
    };

    carregarItens();
  }, []);

  // 🔄 QUANDO ITEM É SELECIONADO
  useEffect(() => {
    if (formData.item_id) {
      const item = itens.find(i => i.id == formData.item_id);
      setItemSelecionado(item);
    }
  }, [formData.item_id, itens]);

  // 🔄 HANDLE CHANGE (sempre permite)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🔄 HANDLE QUANTIDADE CHANGE
  const handleQuantidadeChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const maxQuantidade = itemSelecionado ? itemSelecionado.quantidade : 999;
    
    setFormData(prev => ({ 
      ...prev, 
      quantidade: Math.min(value, maxQuantidade) 
    }));
  };

  // ✅ VALIDAR FORMULÁRIO
  const validarFormulario = () => {
    if (!formData.item_id) {
      setError('Selecione um item');
      return false;
    }
    if (!formData.quantidade || formData.quantidade < 1) {
      setError('Quantidade deve ser maior que zero');
      return false;
    }
    if ((formData.tipo === 'saida' || formData.tipo === 'transferencia') && !formData.destinatario) {
      setError('Destinatário é obrigatório para saída e transferência');
      return false;
    }
    return true; // 🔥 REMOVIDA: validação de quantidade disponível na edição
  };

  // 📤 SALVAR MOVIMENTAÇÃO - VERSÃO COM EDIÇÃO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      console.log('📤 Enviando dados da movimentação:', formData);
      
      let response;
      
      if (id) {
        // 🔥 CORREÇÃO: Agora pode editar!
        response = await movimentacoesService.update(id, formData);
      } else {
        response = await movimentacoesService.create(formData);
      }

      if (response.data.success) {
        alert(`✅ ${id ? 'Movimentação atualizada' : 'Movimentação registrada'} com sucesso!`);
        navigate('/movimentacoes');
      }
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error);
      setError(error.response?.data?.message || `Erro ao ${id ? 'atualizar' : 'criar'} movimentação`);
      
      // Mensagem específica para erros de permissão
      if (error.response?.status === 403) {
        setError('❌ Acesso negado. Você não tem permissão para esta ação.');
      }
      if (error.response?.status === 400 && error.response?.data?.message?.includes('muito antiga')) {
        setError('❌ Esta movimentação é muito antiga para edição (máximo 30 dias).');
      }
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <div className="movimentacao-form-page-loading">
        <Loading size="large" text="Carregando dados da movimentação..." />
      </div>
    );
  }

  return (
    <div className="movimentacao-form-container">
      {/* 🎯 CABEÇALHO */}
      <header className="movimentacao-form-header">
        <div className="movimentacao-form-header-content">
          <h1>
            {id ? '✏️ Editar Movimentação' : '➕ Nova Movimentação'}
          </h1>
          <p>
            {id ? 'Atualize os dados da movimentação' : 'Registre uma nova movimentação no sistema'}
          </p>
        </div>
        
        <div className="movimentacao-form-header-actions">
          <Link to="/movimentacoes" className="movimentacao-form-btn movimentacao-form-btn--back">
            ← Voltar para Lista
          </Link>
        </div>
      </header>

      {/* ⚠️ AVISO PARA EDIÇÃO (se tiver ID) */}
      {id && (
        <div className="movimentacao-form-info-banner">
          <div className="movimentacao-form-info-icon">ℹ️</div>
          <div className="movimentacao-form-info-content">
            <strong>Modo de Edição:</strong> Movimentações podem ser editadas apenas até 30 dias após a criação.
            {itemSelecionado && (
              <div className="movimentacao-form-info-detail">
                Item: <strong>{itemSelecionado.nome}</strong> • 
                Disponível: <strong>{itemSelecionado.quantidade} unidades</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ❌ ERRO */}
      {error && (
        <div className="movimentacao-form-alert">
          <div className="movimentacao-form-alert-icon">❌</div>
          <div className="movimentacao-form-alert-content">
            <strong>Erro:</strong> {error}
          </div>
        </div>
      )}

      {/* 📝 FORMULÁRIO */}
      <form onSubmit={handleSubmit} className="movimentacao-form-form">
        <div className="movimentacao-form-sections">
          
          {/* 📦 ITEM E TIPO */}
          <section className="movimentacao-form-section">
            <h3>📦 Item e Tipo de Movimentação</h3>
            
            <div className="movimentacao-form-grid">
              <div className="movimentacao-form-group">
                <label>Item <span className="movimentacao-form-required">*</span></label>
                <select 
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleChange}
                  required
                  className="movimentacao-form-select"
                  disabled={!!id} // 🔥 Em edição, não pode mudar o item
                >
                  <option value="">Selecione um item</option>
                  {itens.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nome} 
                      {item.patrimonio && ` (${item.patrimonio})`}
                      {` - ${LABELS[item.status]}`}
                    </option>
                  ))}
                </select>
                {id && (
                  <div className="movimentacao-form-hint">
                    ⚠️ Item não pode ser alterado em edições
                  </div>
                )}
              </div>
              
              <div className="movimentacao-form-group">
                <label>Tipo de Movimentação <span className="movimentacao-form-required">*</span></label>
                <select 
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="movimentacao-form-select"
                  disabled={!!id} // 🔥 Em edição, não pode mudar o tipo
                >
                  {Object.entries(TIPO_MOVIMENTACAO).map(([key, value]) => (
                    <option key={key} value={value}>
                      {LABELS[value]}
                    </option>
                  ))}
                </select>
                {id && (
                  <div className="movimentacao-form-hint">
                    ⚠️ Tipo não pode ser alterado em edições
                  </div>
                )}
              </div>
              
              <div className="movimentacao-form-group">
                <label>Quantidade <span className="movimentacao-form-required">*</span></label>
                <input
                  name="quantidade"
                  type="number"
                  min="1"
                  max={itemSelecionado ? itemSelecionado.quantidade : 999}
                  value={formData.quantidade}
                  onChange={handleQuantidadeChange}
                  required
                  className="movimentacao-form-input"
                />
                {itemSelecionado && (
                  <div className="movimentacao-form-hint">
                    Disponível: {itemSelecionado.quantidade} unidades
                    {id && ' (alterações afetam o estoque automaticamente)'}
                  </div>
                )}
              </div>
            </div>

            {/* 📊 PREVIEW DO ITEM SELECIONADO */}
            {itemSelecionado && (
              <div className="movimentacao-form-item-preview active">
                <h4>📋 Informações do Item</h4>
                <div className="movimentacao-form-item-preview-grid">
                  <div className="movimentacao-form-preview-item">
                    <span className="movimentacao-form-preview-label">Nome:</span>
                    <span className="movimentacao-form-preview-value">{itemSelecionado.nome}</span>
                  </div>
                  <div className="movimentacao-form-preview-item">
                    <span className="movimentacao-form-preview-label">Categoria:</span>
                    <span className="movimentacao-form-preview-value">{itemSelecionado.categoria?.nome}</span>
                  </div>
                  <div className="movimentacao-form-preview-item">
                    <span className="movimentacao-form-preview-label">Patrimônio:</span>
                    <span className="movimentacao-form-preview-value">
                      {itemSelecionado.patrimonio || 'Não informado'}
                    </span>
                  </div>
                  <div className="movimentacao-form-preview-item">
                    <span className="movimentacao-form-preview-label">Disponível:</span>
                    <span className={`movimentacao-form-preview-value ${itemSelecionado.quantidade > 0 ? 'movimentacao-form-quantidade-disponivel' : 'movimentacao-form-quantidade-esgotado'}`}>
                      {itemSelecionado.quantidade} unidades
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 👤 DESTINATÁRIO (CONDICIONAL) */}
          {(formData.tipo === 'saida' || formData.tipo === 'transferencia') && (
            <section className="movimentacao-form-section movimentacao-form-conditional-section">
              <h3>👤 Destinatário</h3>
              
              <div className="movimentacao-form-grid">
                <div className="movimentacao-form-group">
                  <label>Destinatário <span className="movimentacao-form-required">*</span></label>
                  <input
                    name="destinatario"
                    type="text"
                    value={formData.destinatario}
                    onChange={handleChange}
                    placeholder="Nome da pessoa ou setor"
                    required
                    className="movimentacao-form-input"
                  />
                </div>
                
                <div className="movimentacao-form-group">
                  <label>Departamento Destino</label>
                  <select 
                    name="departamento_destino"
                    value={formData.departamento_destino}
                    onChange={handleChange}
                    className="movimentacao-form-select"
                  >
                    <option value="">Selecione um departamento</option>
                    {DEPARTAMENTOS.map(depto => (
                      <option key={depto} value={depto}>{depto}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* 📅 PRAZO DE DEVOLUÇÃO (APENAS PARA SAÍDA) */}
          {formData.tipo === 'saida' && (
            <section className="movimentacao-form-section movimentacao-form-conditional-section">
              <h3>📅 Prazo de Devolução</h3>
              
              <div className="movimentacao-form-grid">
                <div className="movimentacao-form-group">
                  <label>Data Prevista para Devolução</label>
                  <input
                    name="data_devolucao_prevista"
                    type="date"
                    value={formData.data_devolucao_prevista}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="movimentacao-form-input"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 📝 OBSERVAÇÕES */}
          <section className="movimentacao-form-section">
            <h3>📝 Observações</h3>
            
            <div className="movimentacao-form-group full-width">
              <label>Observações (Opcional)</label>
              <textarea 
                name="observacao"
                value={formData.observacao}
                onChange={handleChange}
                placeholder="Observações adicionais sobre esta movimentação..."
                rows="4"
                className="movimentacao-form-textarea"
              />
              <div className="movimentacao-form-char-count">
                {formData.observacao.length}/500 caracteres
              </div>
            </div>
          </section>
        </div>

        {/* 📤 AÇÕES */}
        <div className="movimentacao-form-actions">
          <Link to="/movimentacoes" className="movimentacao-form-btn movimentacao-form-btn--secondary">
            Cancelar
          </Link>
          
          <Button 
            type="submit" 
            loading={loading}
            variant="primary"
            className="movimentacao-form-btn movimentacao-form-btn--primary"
          >
            {id ? '💾 Atualizar Movimentação' : '📋 Registrar Movimentação'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MovimentacaoForm;