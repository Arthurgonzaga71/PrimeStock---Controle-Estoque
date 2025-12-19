// src/pages/Manutencoes/RegistrarManutencao.js - CÓDIGO COMPLETO CORRIGIDO
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { manutencoesService, itensService } from '../../services/api';
import { Button, Input, Loading } from '../../components/UI';
import { FORNECEDORES_MANUTENCAO, PRIORIDADES_MANUTENCAO } from '../../utils/constants';
import './Manutencoes.css';

const RegistrarManutencao = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [carregandoItens, setCarregandoItens] = useState(true);
  const [error, setError] = useState('');
  const [itens, setItens] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);

  const [formData, setFormData] = useState({
    item_id: '',
    tipo_manutencao: 'corretiva',
    descricao_problema: '',
    prioridade: 'media',
    fornecedor_manutencao: 'Equipe Interna TI',
    status: 'aberta' // 🔥 ADICIONAR STATUS OBRIGATÓRIO
  });

  // 📦 CARREGAR ITENS
  useEffect(() => {
    const carregarItens = async () => {
      try {
        setCarregandoItens(true);
        const response = await itensService.getAll({ limit: 100 });
        
        if (response.data.success) {
          setItens(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
        setError('Erro ao carregar itens disponíveis');
      } finally {
        setCarregandoItens(false);
      }
    };

    carregarItens();
  }, []);

  // 🔄 QUANDO ITEM É SELECIONADO
  useEffect(() => {
    if (formData.item_id) {
      const item = itens.find(i => i.id == formData.item_id);
      setItemSelecionado(item);
    } else {
      setItemSelecionado(null);
    }
  }, [formData.item_id, itens]);

  // 🔄 HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ VALIDAR FORMULÁRIO
  const validarFormulario = () => {
    if (!formData.item_id) {
      setError('Selecione um item');
      return false;
    }
    if (!formData.descricao_problema?.trim()) {
      setError('Descrição do problema é obrigatória');
      return false;
    }
    if (formData.descricao_problema.trim().length < 10) {
      setError('Descrição do problema deve ter pelo menos 10 caracteres');
      return false;
    }
    return true;
  };

  // 🛠️ REGISTRAR MANUTENÇÃO RÁPIDA
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // 🔥 PREPARAR DADOS COMPLETOS PARA O BACKEND
      const dadosEnvio = {
        item_id: parseInt(formData.item_id),
        tipo_manutencao: formData.tipo_manutencao,
        descricao_problema: formData.descricao_problema.trim(),
        prioridade: formData.prioridade,
        fornecedor_manutencao: formData.fornecedor_manutencao,
        status: formData.status // 🔥 STATUS É OBRIGATÓRIO
      };

      console.log('📤 Dados sendo enviados para criação:', dadosEnvio);

      const response = await manutencoesService.create(dadosEnvio);
      
      if (response.data.success) {
        alert('✅ Manutenção registrada com sucesso!');
        navigate('/manutencoes');
      }
    } catch (error) {
      console.error('💥 Erro ao registrar manutenção:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erro ao registrar manutenção';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manutencoes-page">
      {/* 🎯 CABEÇALHO */}
      <header className="page-header">
        <div className="header-content">
          <h1>🔧 Registrar Manutenção Rápida</h1>
          <p>Registro rápido de manutenções corretivas</p>
        </div>
        
        <Link to="/manutencoes" className="btn btn--secondary">
          ← Voltar para Lista
        </Link>
      </header>

      {/* ❌ ERRO */}
      {error && (
        <div className="alert alert--error">
          <div className="alert__icon">❌</div>
          <div className="alert__content">
            <strong>Erro:</strong> {error}
          </div>
        </div>
      )}

      {/* 📝 FORMULÁRIO RÁPIDO */}
      <form onSubmit={handleSubmit} className="manutencao-form">
        <div className="form-sections">
          
          {/* 📦 SELEÇÃO DO ITEM */}
          <section className="form-section">
            <h3>📦 Item com Problema</h3>
            
            {carregandoItens ? (
              <div className="loading-container">
                <Loading text="Carregando itens..." />
              </div>
            ) : (
              <div className="form-grid">
                <div className="form-group">
                  <label>Item *</label>
                  <select 
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione um item</option>
                    {itens.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nome} 
                        {item.patrimonio && ` (${item.patrimonio})`}
                        {` - ${item.status}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo de Manutenção</label>
                  <select 
                    name="tipo_manutencao"
                    value={formData.tipo_manutencao}
                    onChange={handleChange}
                  >
                    <option value="corretiva">🔧 Corretiva</option>
                    <option value="preventiva">🛡️ Preventiva</option>
                    <option value="instalacao">💻 Instalação</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridade</label>
                  <select 
                    name="prioridade"
                    value={formData.prioridade}
                    onChange={handleChange}
                  >
                    <option value="baixa">🟢 Baixa</option>
                    <option value="media">🟡 Média</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Responsável</label>
                  <select 
                    name="fornecedor_manutencao"
                    value={formData.fornecedor_manutencao}
                    onChange={handleChange}
                  >
                    {FORNECEDORES_MANUTENCAO.map(fornecedor => (
                      <option key={fornecedor} value={fornecedor}>{fornecedor}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* 📝 DESCRIÇÃO DO PROBLEMA */}
          <section className="form-section">
            <h3>📝 Descrição do Problema *</h3>
            
            <div className="form-group full-width">
              <label>Descreva o problema encontrado (mínimo 10 caracteres)</label>
              <textarea 
                name="descricao_problema"
                value={formData.descricao_problema}
                onChange={handleChange}
                placeholder="Ex: 'Notebook não liga', 'Mouse com defeito no scroll', 'Monitor com linhas na tela'..."
                rows="3"
                required
                minLength="10"
              />
              <div className="form-help">
                {formData.descricao_problema.length}/10 caracteres mínimos
              </div>
            </div>
          </section>

          {/* ℹ️ INFO DO ITEM SELECIONADO */}
          {itemSelecionado && (
            <section className="form-section">
              <h3>ℹ️ Informações do Item</h3>
              
              <div className="item-info-card">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Nome:</span>
                    <span className="info-value">{itemSelecionado.nome}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Categoria:</span>
                    <span className="info-value">{itemSelecionado.categoria?.nome}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Patrimônio:</span>
                    <span className="info-value">{itemSelecionado.patrimonio || 'Não informado'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status Atual:</span>
                    <span className="info-value status-item">{itemSelecionado.status}</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 📤 AÇÕES */}
        <div className="form-actions">
          <Link to="/manutencoes" className="btn btn--secondary">
            Cancelar
          </Link>
          
          <Button 
            type="submit" 
            loading={loading}
            variant="warning"
            className="btn--warning"
          >
            🔧 Registrar Manutenção
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegistrarManutencao;