// src/pages/Manutencoes/ManutencaoForm.js - CÓDIGO COMPLETO CORRIGIDO
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { manutencoesService, itensService } from '../../services/api';
import { Button, Input, Loading } from '../../components/UI';
import { TIPO_MANUTENCAO, STATUS_MANUTENCAO, FORNECEDORES_MANUTENCAO, PRIORIDADES_MANUTENCAO, LABELS } from '../../utils/constants';
import './Manutencoes.css';

const ManutencaoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(!!id);
  const [error, setError] = useState('');
  const [itens, setItens] = useState([]);

  const [formData, setFormData] = useState({
    item_id: '',
    tipo_manutencao: 'corretiva',
    descricao_problema: '',
    descricao_solucao: '',
    custo_manutencao: '',
    fornecedor_manutencao: '',
    status: 'aberta',
    prioridade: 'media'
  });

  // 📋 CARREGAR DADOS PARA EDIÇÃO
  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      try {
        setCarregando(true);
        const response = await manutencoesService.getById(id);
        
        if (response.data.success) {
          const manutencao = response.data.data;
          setFormData({
            item_id: manutencao.item_id,
            tipo_manutencao: manutencao.tipo_manutencao,
            descricao_problema: manutencao.descricao_problema || '',
            descricao_solucao: manutencao.descricao_solucao || '',
            custo_manutencao: manutencao.custo_manutencao || '',
            fornecedor_manutencao: manutencao.fornecedor_manutencao || '',
            status: manutencao.status,
            prioridade: manutencao.prioridade || 'media'
          });
        }
      } catch (error) {
        console.error('Erro ao carregar manutenção:', error);
        setError('Erro ao carregar dados da manutenção');
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [id]);

  // 📦 CARREGAR ITENS
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
    if (formData.descricao_problema?.trim().length < 10) {
      setError('Descrição do problema deve ter pelo menos 10 caracteres');
      return false;
    }
    return true;
  };

  // 🛠️ SALVAR MANUTENÇÃO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) return;

    setLoading(true);

    try {
      // 🔥 PREPARAR DADOS CORRETAMENTE
      const dadosEnvio = {
        item_id: parseInt(formData.item_id),
        tipo_manutencao: formData.tipo_manutencao,
        descricao_problema: formData.descricao_problema.trim(),
        descricao_solucao: formData.descricao_solucao?.trim() || null,
        fornecedor_manutencao: formData.fornecedor_manutencao?.trim() || null,
        status: formData.status,
        prioridade: formData.prioridade,
        custo_manutencao: formData.custo_manutencao ? parseFloat(formData.custo_manutencao) : null
      };

      console.log('📤 Dados sendo enviados:', dadosEnvio);

      let response;
      
      if (id) {
        // Editar manutenção existente
        response = await manutencoesService.update(id, dadosEnvio);
      } else {
        // Criar nova manutenção
        response = await manutencoesService.create(dadosEnvio);
      }

      if (response.data.success) {
        alert(`✅ ${id ? 'Manutenção atualizada' : 'Manutenção registrada'} com sucesso!`);
        navigate('/manutencoes');
      }
    } catch (error) {
      console.error('💥 Erro ao salvar manutenção:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || `Erro ao ${id ? 'atualizar' : 'criar'} manutenção`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <div className="page-loading">
        <Loading size="large" text="Carregando dados da manutenção..." />
      </div>
    );
  }

  return (
    <div className="manutencoes-page">
      {/* 🎯 CABEÇALHO */}
      <header className="page-header">
        <div className="header-content">
          <h1>{id ? '✏️ Editar Manutenção' : '🛠️ Nova Manutenção'}</h1>
          <p>
            {id ? 'Atualize os dados da manutenção' : 'Registre uma nova manutenção no sistema'}
          </p>
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

      {/* 📝 FORMULÁRIO DE MANUTENÇÃO */}
      <form onSubmit={handleSubmit} className="manutencao-form">
        <div className="form-sections">
          
          {/* 📦 ITEM E TIPO */}
          <section className="form-section">
            <h3>📦 Item e Tipo de Manutenção</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Item *</label>
                <select 
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleChange}
                  required
                  disabled={!!id} // Não permite alterar item na edição
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
              </div>
              
              <div className="form-group">
                <label>Tipo de Manutenção *</label>
                <select 
                  name="tipo_manutencao"
                  value={formData.tipo_manutencao}
                  onChange={handleChange}
                  required
                >
                  {Object.entries(TIPO_MANUTENCAO).map(([key, value]) => (
                    <option key={key} value={value}>
                      {LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {Object.entries(STATUS_MANUTENCAO).map(([key, value]) => (
                    <option key={key} value={value}>
                      {LABELS[value]}
                    </option>
                  ))}
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
            </div>
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
                placeholder="Descreva detalhadamente o problema que precisa ser resolvido..."
                rows="4"
                required
                minLength="10"
              />
              <div className="form-help">
                {formData.descricao_problema.length}/10 caracteres mínimos
              </div>
            </div>
          </section>

          {/* 💡 SOLUÇÃO APLICADA */}
          <section className="form-section">
            <h3>💡 Solução Aplicada</h3>
            
            <div className="form-group full-width">
              <label>Descreva a solução aplicada (se houver)</label>
              <textarea 
                name="descricao_solucao"
                value={formData.descricao_solucao}
                onChange={handleChange}
                placeholder="Descreva a solução aplicada para resolver o problema..."
                rows="4"
              />
            </div>
          </section>

          {/* 💰 CUSTOS E FORNECEDOR */}
          <section className="form-section">
            <h3>💰 Custos e Fornecedor</h3>
            
            <div className="form-grid">
              <Input
                label="Custo da Manutenção (R$)"
                name="custo_manutencao"
                type="number"
                step="0.01"
                value={formData.custo_manutencao}
                onChange={handleChange}
                placeholder="0,00"
                min="0"
              />
              
              <div className="form-group">
                <label>Fornecedor/Responsável</label>
                <select 
                  name="fornecedor_manutencao"
                  value={formData.fornecedor_manutencao}
                  onChange={handleChange}
                >
                  <option value="">Selecione um fornecedor</option>
                  {FORNECEDORES_MANUTENCAO.map(fornecedor => (
                    <option key={fornecedor} value={fornecedor}>{fornecedor}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
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
          >
            {id ? '💾 Atualizar Manutenção' : '🛠️ Registrar Manutenção'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ManutencaoForm;