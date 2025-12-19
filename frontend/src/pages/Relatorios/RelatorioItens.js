// 📁 frontend/src/pages/Relatorios/RelatorioItens.js - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { itensService } from '../../services/api';
import { exportItensToPDF, exportItensToExcel } from '../../utils/exportUtils';
import { Button, Loading } from '../../components/UI';
import './Relatorios.css';

const RelatorioItens = () => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [filtros, setFiltros] = useState({
    categoria_id: '',
    status: '',
    search: ''
  });

  const carregarItens = async () => {
    try {
      setLoading(true);
      const response = await itensService.getAll(filtros);
      if (response.data.success) {
        setItens(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarItens();
  }, [filtros]);

  const exportarPDF = async () => {
    try {
      setExportando(true);
      await exportItensToPDF(itens, filtros);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Verifique o console.');
    } finally {
      setExportando(false);
    }
  };

  const exportarExcel = async () => {
    try {
      setExportando(true);
      await exportItensToExcel(itens, filtros);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar Excel. Verifique o console.');
    } finally {
      setExportando(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const limparFiltros = () => {
    setFiltros({
      categoria_id: '',
      status: '',
      search: ''
    });
  };

  // Calcular estatísticas
  const totalItens = itens.length;
  const itensDisponiveis = itens.filter(item => item.status === 'disponivel').length;
  const itensEmUso = itens.filter(item => item.status === 'em_uso').length;
  const valorTotal = itens.reduce((total, item) => total + (item.valor * item.quantidade || 0), 0);

  return (
    <div className="relatorio-page">
      <header className="page-header">
        <h1>📦 Relatório de Itens</h1>
        <p>Relatório completo do inventário de equipamentos</p>
      </header>

      {/* FILTROS */}
      <section className="filtros-section">
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Status</label>
            <select name="status" value={filtros.status} onChange={handleFiltroChange}>
              <option value="">Todos</option>
              <option value="disponivel">Disponível</option>
              <option value="em_uso">Em Uso</option>
              <option value="manutencao">Manutenção</option>
            </select>
          </div>

          <div className="filtro-group">
            <label>Buscar</label>
            <input
              type="text"
              name="search"
              value={filtros.search}
              onChange={handleFiltroChange}
              placeholder="Nome ou patrimônio..."
            />
          </div>

          <div className="filtro-actions">
            <Button variant="secondary" onClick={limparFiltros}>
              🗑️ Limpar
            </Button>
            <Button variant="primary" onClick={carregarItens}>
              🔍 Filtrar
            </Button>
          </div>
        </div>
      </section>

      {/* ESTATÍSTICAS */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{totalItens}</div>
          <div className="stat-label">Total Itens</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{itensDisponiveis}</div>
          <div className="stat-label">Disponíveis</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{itensEmUso}</div>
          <div className="stat-label">Em Uso</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">R$ {valorTotal.toLocaleString('pt-BR')}</div>
          <div className="stat-label">Valor Total</div>
        </div>
      </section>

      {/* EXPORTAÇÃO */}
      <section className="export-section">
        <h3>📤 Exportar Relatório</h3>
        <div className="export-buttons">
       
          
          <Button 
            variant="success" 
            onClick={exportarExcel}
            disabled={exportando || itens.length === 0}
          >
            {exportando ? '⏳' : '📊'} Exportar Excel
          </Button>
        </div>
        
        {exportando && (
          <div className="export-progress">
            Gerando relatório...
          </div>
        )}
      </section>

      {/* LISTA */}
      <section className="dados-section">
        {loading ? (
          <Loading text="Carregando itens..." />
        ) : itens.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>Nenhum item encontrado</h3>
            <p>Não há itens com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Patrimônio</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                  <th>Valor Unitário</th>
                  <th>Localização</th>
                </tr>
              </thead>
              <tbody>
                {itens.map(item => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.categoria?.nome}</td>
                    <td>{item.patrimonio || '-'}</td>
                    <td>{item.quantidade}</td>
                    <td>
                      <span className={`badge badge-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>R$ {item.valor?.toFixed(2) || '0.00'}</td>
                    <td>{item.localizacao || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default RelatorioItens;