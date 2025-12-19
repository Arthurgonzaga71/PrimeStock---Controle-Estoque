// 📁 frontend/src/pages/Relatorios/RelatorioMovimentacoes.js - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { movimentacoesService } from '../../services/api';
import { exportMovimentacoesToPDF } from '../../utils/exportUtils';
import { Button, Loading } from '../../components/UI';
import './Relatorios.css';

const RelatorioMovimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    tipo: '',
    item_id: ''
  });

  const carregarMovimentacoes = async () => {
    try {
      setLoading(true);
      const response = await movimentacoesService.getAll(filtros);
      if (response.data.success) {
        setMovimentacoes(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMovimentacoes();
  }, [filtros]);

  const exportarPDF = async () => {
    try {
      setExportando(true);
      await exportMovimentacoesToPDF(movimentacoes, filtros);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Verifique o console.');
    } finally {
      setExportando(false);
    }
  };

  const exportarExcel = () => {
    // Implementação simplificada do Excel
    const csvContent = [
      ['Data', 'Tipo', 'Item', 'Quantidade', 'Destinatário', 'Usuário'],
      ...movimentacoes.map(mov => [
        new Date(mov.data_movimentacao).toLocaleDateString('pt-BR'),
        mov.tipo,
        mov.item?.nome || 'N/A',
        mov.quantidade,
        mov.destinatario || 'N/A',
        mov.usuario?.nome || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `movimentacoes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const limparFiltros = () => {
    setFiltros({
      data_inicio: '',
      data_fim: '',
      tipo: '',
      item_id: ''
    });
  };

  return (
    <div className="relatorio-page">
      <header className="page-header">
        <h1>📋 Relatório de Movimentações</h1>
        <p>Relatório detalhado de todas as movimentações do sistema</p>
      </header>

      {/* FILTROS */}
      <section className="filtros-section">
        <div className="filtros-grid">
          <div className="filtro-group">
            <label>Data Início</label>
            <input
              type="date"
              name="data_inicio"
              value={filtros.data_inicio}
              onChange={handleFiltroChange}
            />
          </div>

          <div className="filtro-group">
            <label>Data Fim</label>
            <input
              type="date"
              name="data_fim"
              value={filtros.data_fim}
              onChange={handleFiltroChange}
            />
          </div>

          <div className="filtro-group">
            <label>Tipo</label>
            <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="devolucao">Devolução</option>
            </select>
          </div>

          <div className="filtro-actions">
            <Button variant="secondary" onClick={limparFiltros}>
              🗑️ Limpar
            </Button>
            <Button variant="primary" onClick={carregarMovimentacoes}>
              🔍 Filtrar
            </Button>
          </div>
        </div>
      </section>

      {/* ESTATÍSTICAS */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{movimentacoes.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {movimentacoes.filter(m => m.tipo === 'entrada').length}
          </div>
          <div className="stat-label">Entradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {movimentacoes.filter(m => m.tipo === 'saida').length}
          </div>
          <div className="stat-label">Saídas</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {movimentacoes.filter(m => m.tipo === 'devolucao').length}
          </div>
          <div className="stat-label">Devoluções</div>
        </div>
      </section>

      {/* EXPORTAÇÃO */}
      <section className="export-section">
        <h3>📤 Exportar Relatório</h3>
        <div className="export-buttons">
       
          
          <Button 
            variant="success" 
            onClick={exportarExcel}
            disabled={movimentacoes.length === 0}
          >
            📊 Exportar Excel
          </Button>
        </div>
        
        {exportando && (
          <div className="export-progress">
            Gerando relatório PDF...
          </div>
        )}
      </section>

      {/* LISTA */}
      <section className="dados-section">
        {loading ? (
          <Loading text="Carregando movimentações..." />
        ) : movimentacoes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Nenhuma movimentação encontrada</h3>
            <p>Não há movimentações com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Item</th>
                  <th>Quantidade</th>
                  <th>Destinatário</th>
                  <th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map(movimentacao => (
                  <tr key={movimentacao.id}>
                    <td>{new Date(movimentacao.data_movimentacao).toLocaleString('pt-BR')}</td>
                    <td>
                      <span className={`badge badge-${movimentacao.tipo}`}>
                        {movimentacao.tipo}
                      </span>
                    </td>
                    <td>{movimentacao.item?.nome}</td>
                    <td>{movimentacao.quantidade}</td>
                    <td>{movimentacao.destinatario || '-'}</td>
                    <td>{movimentacao.usuario?.nome}</td>
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

export default RelatorioMovimentacoes;