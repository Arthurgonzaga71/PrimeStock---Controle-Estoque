// src/pages/Movimentacoes/RegistrarDevolucao.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { movimentacoesService } from '../../services/api';
import { Button, Loading } from '../../components/UI';
import { MOVIMENTACOES_CONFIG, LABELS } from '../../utils/constants';
import './RegistrarDevolucao.css'; // Novo arquivo CSS

const RegistrarDevolucao = () => {
  const { id } = useParams(); // ID da movimentação de saída
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [error, setError] = useState('');
  const [movimentacaoSaida, setMovimentacaoSaida] = useState(null);
  const [formData, setFormData] = useState({
    observacao: ''
  });

  // 📋 CARREGAR MOVIMENTAÇÃO DE SAÍDA
  useEffect(() => {
    const carregarMovimentacaoSaida = async () => {
      try {
        setCarregando(true);
        const response = await movimentacoesService.getById(id);
        
        if (response.data.success) {
          const movimentacao = response.data.data;
          
          // Validar se é uma saída
          if (movimentacao.tipo !== 'saida') {
            setError('Apenas movimentações de saída podem ser devolvidas');
            return;
          }

          setMovimentacaoSaida(movimentacao);
        } else {
          setError('Movimentação não encontrada');
        }
      } catch (error) {
        console.error('Erro ao carregar movimentação:', error);
        setError('Erro ao carregar dados da movimentação');
      } finally {
        setCarregando(false);
      }
    };

    if (id) {
      carregarMovimentacaoSaida();
    }
  }, [id]);

  // 🔄 HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 📥 REGISTRAR DEVOLUÇÃO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      const response = await movimentacoesService.registrarDevolucao(id, formData);
      
      if (response.data.success) {
        alert('✅ Devolução registrada com sucesso!');
        navigate('/movimentacoes');
      }
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
      setError(error.response?.data?.message || 'Erro ao registrar devolução');
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <div className="registrar-devolucao-page-loading">
        <Loading size="large" text="Carregando dados da saída..." />
      </div>
    );
  }

  if (error && !movimentacaoSaida) {
    return (
      <div className="registrar-devolucao-container">
        <header className="registrar-devolucao-header">
          <div className="registrar-devolucao-header-content">
            <h1>❌ Erro</h1>
            <p>Não foi possível carregar a movimentação</p>
          </div>
          <Link to="/movimentacoes" className="registrar-devolucao-btn registrar-devolucao-btn-back">
            ← Voltar para Lista
          </Link>
        </header>
        
        <div className="registrar-devolucao-alert">
          <div className="registrar-devolucao-alert-content">
            <strong>Erro:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registrar-devolucao-container">
      {/* 🎯 CABEÇALHO */}
      <header className="registrar-devolucao-header">
        <div className="registrar-devolucao-header-content">
          <h1>🔄 Registrar Devolução</h1>
          <p>Registre a devolução do item ao estoque</p>
        </div>
        
        <Link to="/movimentacoes" className="registrar-devolucao-btn registrar-devolucao-btn-back">
          ← Voltar para Lista
        </Link>
      </header>

      {/* ❌ ERRO */}
      {error && (
        <div className="registrar-devolucao-alert">
          <div className="registrar-devolucao-alert-icon">❌</div>
          <div className="registrar-devolucao-alert-content">
            <strong>Erro:</strong> {error}
          </div>
        </div>
      )}

      {/* 📋 RESUMO DA SAÍDA */}
      {movimentacaoSaida && (
        <section className="registrar-devolucao-resumo-saida">
          <h3>📤 Saída Original</h3>
          <div className="registrar-devolucao-resumo-card">
            <div className="registrar-devolucao-resumo-grid">
              <div className="registrar-devolucao-resumo-item">
                <span className="registrar-devolucao-resumo-label">Item:</span>
                <span className="registrar-devolucao-resumo-value">
                  <strong>{movimentacaoSaida.item?.nome}</strong>
                  {movimentacaoSaida.item?.patrimonio && (
                    <span className="registrar-devolucao-patrimonio">({movimentacaoSaida.item.patrimonio})</span>
                  )}
                </span>
              </div>
              
              <div className="registrar-devolucao-resumo-item">
                <span className="registrar-devolucao-resumo-label">Quantidade:</span>
                <span className="registrar-devolucao-resumo-value registrar-devolucao-quantidade">
                  {movimentacaoSaida.quantidade} unidades
                </span>
              </div>
              
              <div className="registrar-devolucao-resumo-item">
                <span className="registrar-devolucao-resumo-label">Destinatário:</span>
                <span className="registrar-devolucao-resumo-value">
                  <strong>{movimentacaoSaida.destinatario}</strong>
                  {movimentacaoSaida.departamento_destino && (
                    <span className="registrar-devolucao-departamento"> - {movimentacaoSaida.departamento_destino}</span>
                  )}
                </span>
              </div>
              
              <div className="registrar-devolucao-resumo-item">
                <span className="registrar-devolucao-resumo-label">Data da Saída:</span>
                <span className="registrar-devolucao-resumo-value">
                  {new Date(movimentacaoSaida.data_movimentacao).toLocaleString('pt-BR')}
                </span>
              </div>
              
              {movimentacaoSaida.data_devolucao_prevista && (
                <div className="registrar-devolucao-resumo-item">
                  <span className="registrar-devolucao-resumo-label">Devolução Prevista:</span>
                  <span className="registrar-devolucao-resumo-value registrar-devolucao-data-devolucao">
                    {new Date(movimentacaoSaida.data_devolucao_prevista).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              
              <div className="registrar-devolucao-resumo-item">
                <span className="registrar-devolucao-resumo-label">Registrado por:</span>
                <span className="registrar-devolucao-resumo-value">
                  {movimentacaoSaida.usuario?.nome}
                </span>
              </div>
            </div>
            
            {movimentacaoSaida.observacao && (
              <div className="registrar-devolucao-resumo-observacao">
                <span className="registrar-devolucao-resumo-label">Observação Original:</span>
                <span className="registrar-devolucao-resumo-value">{movimentacaoSaida.observacao}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 📝 FORMULÁRIO DE DEVOLUÇÃO */}
      <form onSubmit={handleSubmit} className="registrar-devolucao-form">
        <div className="registrar-devolucao-form-sections">
          
          {/* ✅ CONFIRMAÇÃO */}
          <section className="registrar-devolucao-form-section">
            <h3>✅ Confirmar Devolução</h3>
            
            <div className="registrar-devolucao-confirmacao-card">
              <div className="registrar-devolucao-confirmacao-icon">🔄</div>
              <div className="registrar-devolucao-confirmacao-content">
                <h4>Item será devolvido ao estoque</h4>
                <p>
                  Ao confirmar, o item <strong>{movimentacaoSaida?.item?.nome}</strong> 
                  será marcado como <strong>Disponível</strong> no estoque e 
                  a quantidade de <strong>{movimentacaoSaida?.quantidade} unidades</strong> 
                  será restaurada.
                </p>
              </div>
            </div>
          </section>

          {/* 📝 OBSERVAÇÕES DA DEVOLUÇÃO */}
          <section className="registrar-devolucao-form-section">
            <h3>📝 Observações da Devolução</h3>
            
            <div className="registrar-devolucao-form-group full-width">
              <label>Observações (Opcional)</label>
              <textarea 
                name="observacao"
                value={formData.observacao}
                onChange={handleChange}
                placeholder="Descreva o estado do item, observações sobre a devolução, etc..."
                rows="4"
                className="registrar-devolucao-form-textarea"
              />
              <div className="registrar-devolucao-form-help">
                Ex: "Item devolvido em perfeito estado", "Necessita de manutenção", etc.
              </div>
            </div>
          </section>
        </div>

        {/* 📤 AÇÕES */}
        <div className="registrar-devolucao-form-actions">
          <Link to="/movimentacoes" className="registrar-devolucao-btn registrar-devolucao-btn--secondary">
            Cancelar
          </Link>
          
          <Button 
            type="submit" 
            loading={loading}
            variant="success"
            className="registrar-devolucao-btn registrar-devolucao-btn--success"
          >
            🔄 Registrar Devolução
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegistrarDevolucao;