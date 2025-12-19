// src/pages/Movimentacoes/RegistrarSaida.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { movimentacoesService, itensService } from '../../services/api';
import { Button, Input, Loading } from '../../components/UI';
import { DEPARTAMENTOS, PRAZOS_DEVOLUCAO } from '../../utils/constants';
import './RegistrarSaida.css'; // Arquivo CSS atualizado

const RegistrarSaida = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [carregandoItens, setCarregandoItens] = useState(true);
  const [error, setError] = useState('');
  const [itensDisponiveis, setItensDisponiveis] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  const [formData, setFormData] = useState({
    item_id: '',
    quantidade: 1,
    destinatario: '',
    departamento_destino: '',
    data_devolucao_prevista: '',
    observacao: ''
  });

  // 📦 CARREGAR ITENS DISPONÍVEIS
  useEffect(() => {
    const carregarItensDisponiveis = async () => {
      try {
        setCarregandoItens(true);
        const response = await itensService.getAll({ 
          status: 'disponivel',
          limit: 100 
        });
        
        if (response.data.success) {
          setItensDisponiveis(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
        setError('Erro ao carregar itens disponíveis');
      } finally {
        setCarregandoItens(false);
      }
    };

    carregarItensDisponiveis();
  }, []);

  // 🔄 QUANDO ITEM É SELECIONADO
  useEffect(() => {
    if (formData.item_id) {
      const item = itensDisponiveis.find(i => i.id == formData.item_id);
      setItemSelecionado(item);
      
      // Definir quantidade máxima disponível
      if (item && formData.quantidade > item.quantidade) {
        setFormData(prev => ({ ...prev, quantidade: item.quantidade }));
      }
    } else {
      setItemSelecionado(null);
    }
  }, [formData.item_id, itensDisponiveis]);

  // 📅 CALCULAR DATA DE DEVOLUÇÃO PADRÃO
  const calcularDataDevolucao = (dias = PRAZOS_DEVOLUCAO.PADRAO) => {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split('T')[0];
  };

  // 🔄 HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🔄 HANDLE QUANTIDADE CHANGE
  const handleQuantidadeChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const maxQuantidade = itemSelecionado ? itemSelecionado.quantidade : 1;
    
    setFormData(prev => ({ 
      ...prev, 
      quantidade: Math.min(value, maxQuantidade) 
    }));
  };

  // 🚀 DEFINIR PRAZO RÁPIDO
  const definirPrazoRapido = (dias) => {
    setFormData(prev => ({
      ...prev,
      data_devolucao_prevista: calcularDataDevolucao(dias)
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
    if (!formData.destinatario?.trim()) {
      setError('Destinatário é obrigatório');
      return false;
    }
    if (itemSelecionado && formData.quantidade > itemSelecionado.quantidade) {
      setError(`Quantidade indisponível. Disponível: ${itemSelecionado.quantidade}`);
      return false;
    }
    return true;
  };

  // 📤 REGISTRAR SAÍDA
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const response = await movimentacoesService.registrarSaida(formData);
      
      if (response.data.success) {
        alert('✅ Saída registrada com sucesso!');
        navigate('/movimentacoes');
      }
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      setError(error.response?.data?.message || 'Erro ao registrar saída');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registrar-saida-container">
      {/* 🎯 CABEÇALHO */}
      <header className="registrar-saida-header">
        <div className="registrar-saida-header-content">
          <h1>📤 Registrar Saída</h1>
          <p>Registre a saída de equipamentos para usuários ou departamentos</p>
        </div>
        
        <Link to="/movimentacoes" className="registrar-saida-btn registrar-saida-btn-back">
          ← Voltar para Lista
        </Link>
      </header>

      {/* ❌ ERRO */}
      {error && (
        <div className="registrar-saida-alert">
          <div className="registrar-saida-alert-icon">❌</div>
          <div className="registrar-saida-alert-content">
            <strong>Erro:</strong> {error}
          </div>
        </div>
      )}

      {/* 📝 FORMULÁRIO DE SAÍDA */}
      <form onSubmit={handleSubmit} className="registrar-saida-form">
        <div className="registrar-saida-form-sections">
          
          {/* 📦 SELEÇÃO DO ITEM */}
          <section className="registrar-saida-form-section">
            <h3>📦 Item a Ser Retirado</h3>
            
            {carregandoItens ? (
              <div className="registrar-saida-loading-container">
                <Loading text="Carregando itens disponíveis..." />
              </div>
            ) : (
              <div className="registrar-saida-form-grid">
                <div className="registrar-saida-form-group">
                  <label>Item Disponível *</label>
                  <select 
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleChange}
                    required
                    className="registrar-saida-form-select"
                  >
                    <option value="">Selecione um item</option>
                    {itensDisponiveis.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nome} 
                        {item.patrimonio && ` (${item.patrimonio})`}
                        {` - Disponível: ${item.quantidade}`}
                      </option>
                    ))}
                  </select>
                  <div className="registrar-saida-form-help">
                    Apenas itens com status "Disponível" são mostrados
                  </div>
                </div>

                {/* 📊 INFO DO ITEM SELECIONADO */}
                {itemSelecionado && (
                  <div className="registrar-saida-item-info-card">
                    <h4>📋 Informações do Item</h4>
                    <div className="registrar-saida-info-grid">
                      <div className="registrar-saida-info-item">
                        <span className="registrar-saida-info-label">Nome:</span>
                        <span className="registrar-saida-info-value">{itemSelecionado.nome}</span>
                      </div>
                      <div className="registrar-saida-info-item">
                        <span className="registrar-saida-info-label">Categoria:</span>
                        <span className="registrar-saida-info-value">{itemSelecionado.categoria?.nome}</span>
                      </div>
                      <div className="registrar-saida-info-item">
                        <span className="registrar-saida-info-label">Patrimônio:</span>
                        <span className="registrar-saida-info-value">{itemSelecionado.patrimonio || 'Não informado'}</span>
                      </div>
                      <div className="registrar-saida-info-item">
                        <span className="registrar-saida-info-label">Disponível:</span>
                        <span className="registrar-saida-info-value registrar-saida-quantidade-disponivel">
                          {itemSelecionado.quantidade} unidades
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 👤 DESTINATÁRIO E QUANTIDADE */}
          <section className="registrar-saida-form-section">
            <h3>👤 Destinatário e Quantidade</h3>
            
            <div className="registrar-saida-form-grid">
              <div className="registrar-saida-form-group">
                <label>Quantidade *</label>
                <input
                  name="quantidade"
                  type="number"
                  min="1"
                  max={itemSelecionado ? itemSelecionado.quantidade : 1}
                  value={formData.quantidade}
                  onChange={handleQuantidadeChange}
                  required
                  className="registrar-saida-form-input"
                />
              </div>
              
              <div className="registrar-saida-form-group">
                <label>Destinatário *</label>
                <input
                  name="destinatario"
                  type="text"
                  value={formData.destinatario}
                  onChange={handleChange}
                  placeholder="Nome da pessoa que receberá o item"
                  required
                  className="registrar-saida-form-input"
                />
              </div>
              
              <div className="registrar-saida-form-group">
                <label>Departamento Destino</label>
                <select 
                  name="departamento_destino"
                  value={formData.departamento_destino}
                  onChange={handleChange}
                  className="registrar-saida-form-select"
                >
                  <option value="">Selecione um departamento</option>
                  {DEPARTAMENTOS.map(depto => (
                    <option key={depto} value={depto}>{depto}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 📅 PRAZO DE DEVOLUÇÃO */}
          <section className="registrar-saida-form-section">
            <h3>📅 Prazo de Devolução</h3>
            
            <div className="registrar-saida-form-grid">
              <div className="registrar-saida-form-group">
                <label>Data Prevista para Devolução</label>
                <input
                  name="data_devolucao_prevista"
                  type="date"
                  value={formData.data_devolucao_prevista}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="registrar-saida-form-input"
                />
              </div>
              
              {/* 🚀 PRAZOS RÁPIDOS */}
              <div className="registrar-saida-prazos-rapidos">
                <label>Prazos Rápidos:</label>
                <div className="registrar-saida-botoes-prazos">
                  <button 
                    type="button"
                    className="registrar-saida-btn registrar-saida-btn--outline registrar-saida-btn--sm"
                    onClick={() => definirPrazoRapido(PRAZOS_DEVOLUCAO.CURTO)}
                  >
                    {PRAZOS_DEVOLUCAO.CURTO} dias
                  </button>
                  <button 
                    type="button"
                    className="registrar-saida-btn registrar-saida-btn--outline registrar-saida-btn--sm"
                    onClick={() => definirPrazoRapido(PRAZOS_DEVOLUCAO.PADRAO)}
                  >
                    {PRAZOS_DEVOLUCAO.PADRAO} dias
                  </button>
                  <button 
                    type="button"
                    className="registrar-saida-btn registrar-saida-btn--outline registrar-saida-btn--sm"
                    onClick={() => definirPrazoRapido(PRAZOS_DEVOLUCAO.LONGO)}
                  >
                    {PRAZOS_DEVOLUCAO.LONGO} dias
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 📝 OBSERVAÇÕES */}
          <section className="registrar-saida-form-section">
            <h3>📝 Observações</h3>
            
            <div className="registrar-saida-form-group full-width">
              <label>Observações (Opcional)</label>
              <textarea 
                name="observacao"
                value={formData.observacao}
                onChange={handleChange}
                placeholder="Observações adicionais sobre esta saída..."
                rows="3"
                className="registrar-saida-form-textarea"
              />
            </div>
          </section>
        </div>

        {/* 📤 AÇÕES */}
        <div className="registrar-saida-form-actions">
          <Link to="/movimentacoes" className="registrar-saida-btn registrar-saida-btn--secondary">
            Cancelar
          </Link>
          
          <Button 
            type="submit" 
            loading={loading}
            variant="warning"
            className="registrar-saida-btn registrar-saida-btn--warning"
            disabled={!itemSelecionado}
          >
            📤 Registrar Saída
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegistrarSaida;