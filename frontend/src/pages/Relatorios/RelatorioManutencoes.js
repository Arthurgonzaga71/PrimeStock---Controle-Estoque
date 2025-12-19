// src/pages/Relatorios/RelatorioManutencoes.js - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/api';
import { Button, Loading, Input } from '../../components/UI';
import { 
  LABELS, 
  STATUS_MANUTENCAO, 
  TIPO_MANUTENCAO,  // ✅ CORREÇÃO: Usar TIPO_MANUTENCAO em vez de TIPOS_MANUTENCAO
  STATUS_COLORS 
} from '../../utils/constants';
import { 
  exportManutencoesToPDF, 
  exportToExcel 
} from '../../utils/exportUtils';
import './Relatorios.css';

const RelatorioManutencoes = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    status: '',
    tipo_manutencao: '',
    tecnico_id: ''
  });

  // 📊 CARREGAR RELATÓRIO
  const carregarRelatorio = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;
      if (filtros.status) params.status = filtros.status;
      if (filtros.tipo_manutencao) params.tipo_manutencao = filtros.tipo_manutencao;
      if (filtros.tecnico_id) params.tecnico_id = filtros.tecnico_id;

      const response = await dashboardService.getRelatorioManutencoes(params);
      
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      alert('Erro ao carregar relatório de manutenções');
    } finally {
      setLoading(false);
    }
  };

  // 📤 EXPORTAR PDF
  const exportarPDF = async () => {
    try {
      setExporting(true);
      if (!data?.manutencoes?.length) {
        alert('Nenhum dado para exportar');
        return;
      }
      await exportManutencoesToPDF(data.manutencoes, data.estatisticas);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // 📊 EXPORTAR EXCEL
  const exportarExcel = async () => {
    try {
      setExporting(true);
      if (!data?.manutencoes?.length) {
        alert('Nenhum dado para exportar');
        return;
      }
      const columns = ['Data Abertura', 'Item', 'Tipo', 'Status', 'Fornecedor', 'Custo', 'Técnico'];
      const excelData = data.manutencoes.map(manut => [
        new Date(manut.data_abertura).toLocaleDateString('pt-BR'),
        manut.item?.nome,
        LABELS[manut.tipo_manutencao] || manut.tipo_manutencao, // ✅ CORREÇÃO: Fallback
        LABELS[manut.status] || manut.status, // ✅ CORREÇÃO: Fallback
        manut.fornecedor_manutencao || '-',
        manut.custo_manutencao ? parseFloat(manut.custo_manutencao) : null,
        manut.tecnico?.nome || '-'
      ]);
      await exportToExcel(excelData, columns, 'Relatório de Manutenções - Estoque TI', 'manutencoes.xlsx');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar Excel: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    carregarRelatorio();
  }, []);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = () => {
    carregarRelatorio();
  };

  const limparFiltros = () => {
    setFiltros({
      data_inicio: '',
      data_fim: '',
      status: '',
      tipo_manutencao: '',
      tecnico_id: ''
    });
    carregarRelatorio();
  };

  // ✅ CORREÇÃO: Criar array de tipos de manutenção baseado nas constants disponíveis
  const tiposManutencaoDisponiveis = Object.keys(TIPO_MANUTENCAO || {}).map(key => ({
    value: TIPO_MANUTENCAO[key],
    label: LABELS[TIPO_MANUTENCAO[key]] || key
  }));

  if (loading) {
    return (
      <div className="relatorio-loading">
        <Loading size="large" text="Carregando relatório de manutenções..." />
      </div>
    );
  }

  return (
    <div className="relatorio-page">
      {/* 🎯 CABEÇALHO */}
      <header className="relatorio-header">
        <div className="relatorio-header__info">
          <h1>🛠️ Relatório de Manutenções</h1>
          <p>Relatório completo de todas as manutenções realizadas</p>
        </div>
        <div className="relatorio-header__actions">
        
          <Button 
            variant="success" 
            onClick={exportarExcel}
            loading={exporting}
          >
            📊 Exportar Excel
          </Button>
        </div>
      </header>

      {/* 🔍 FILTROS */}
      <section className="filtros-section">
        <div className="filtros-header">
          <h3>🔍 Filtros do Relatório</h3>
          <div className="filtros-actions">
            <Button variant="outline" onClick={limparFiltros}>
              🗑️ Limpar Filtros
            </Button>
            <Button variant="primary" onClick={aplicarFiltros}>
              🔍 Aplicar Filtros
            </Button>
          </div>
        </div>
        
        <div className="filtros-grid">
          <Input
            label="Data Início"
            type="date"
            name="data_inicio"
            value={filtros.data_inicio}
            onChange={handleFiltroChange}
          />
          <Input
            label="Data Fim"
            type="date"
            name="data_fim"
            value={filtros.data_fim}
            onChange={handleFiltroChange}
          />
          <div className="form-group">
            <label>Status</label>
            <select 
              name="status"
              value={filtros.status}
              onChange={handleFiltroChange}
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_MANUTENCAO || {}).map(([key, value]) => (
                <option key={key} value={value}>
                  {LABELS[value] || key} {/* ✅ CORREÇÃO: Fallback */}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tipo de Manutenção</label>
            <select 
              name="tipo_manutencao"
              value={filtros.tipo_manutencao}
              onChange={handleFiltroChange}
            >
              <option value="">Todos os tipos</option>
              {tiposManutencaoDisponiveis.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 📊 RELATÓRIO */}
      <div id="relatorio-manutencoes" className="relatorio-content">
        {/* 📈 RESUMO ESTATÍSTICO */}
        {data?.estatisticas && (
          <section className="resumo-estatistico">
            <h3>📈 Resumo Estatístico</h3>
            <div className="estatisticas-grid">
              <div className="estatistica-card">
                <div className="estatistica-value">{data.estatisticas.total_manutencoes || 0}</div>
                <div className="estatistica-label">Total de Manutenções</div>
              </div>
              <div className="estatistica-card">
                <div className="estatistica-value">{data.estatisticas.manutencoes_abertas || 0}</div>
                <div className="estatistica-label">Em Aberto</div>
              </div>
              <div className="estatistica-card">
                <div className="estatistica-value">{data.estatisticas.manutencoes_concluidas || 0}</div>
                <div className="estatistica-label">Concluídas</div>
              </div>
              <div className="estatistica-card">
                <div className="estatistica-value">
                  R$ {(data.estatisticas.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="estatistica-label">Custo Total</div>
              </div>
            </div>
          </section>
        )}

        {/* 📊 GRÁFICOS DE DISTRIBUIÇÃO */}
        {data?.estatisticas && (
          <section className="distribuicao-section">
            <div className="distribuicao-grid">
              <div className="distribuicao-card">
                <h4>📊 Por Status</h4>
                <div className="distribuicao-lista">
                  {[
                    { status: 'aberta', count: data.estatisticas.manutencoes_abertas || 0 },
                    { status: 'em_andamento', count: data.estatisticas.manutencoes_em_andamento || 0 },
                    { status: 'concluida', count: data.estatisticas.manutencoes_concluidas || 0 },
                    { status: 'cancelada', count: data.estatisticas.manutencoes_canceladas || 0 }
                  ].map((item, index) => {
                    const total = data.estatisticas.total_manutencoes || 1;
                    const porcentagem = total > 0 ? (item.count / total) * 100 : 0;
                    
                    return (
                      <div key={item.status} className="distribuicao-item">
                        <div className="distribuicao-info">
                          <span className="distribuicao-label">{LABELS[item.status] || item.status}</span>
                          <span className="distribuicao-value">{item.count}</span>
                        </div>
                        <div className="distribuicao-bar">
                          <div 
                            className="distribuicao-fill"
                            style={{ 
                              width: `${porcentagem}%`,
                              backgroundColor: item.status === 'aberta' ? '#F59E0B' : 
                                             item.status === 'em_andamento' ? '#3B82F6' : 
                                             item.status === 'concluida' ? '#10B981' : '#EF4444'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="distribuicao-card">
                <h4>🔧 Por Tipo</h4>
                <div className="distribuicao-lista">
                  {data.estatisticas.por_tipo?.map((item, index) => (
                    <div key={item.tipo} className="distribuicao-item">
                      <div className="distribuicao-info">
                        <span className="distribuicao-label">{LABELS[item.tipo] || item.tipo}</span>
                        <span className="distribuicao-value">{item.count} ({item.porcentagem}%)</span>
                      </div>
                      <div className="distribuicao-bar">
                        <div 
                          className="distribuicao-fill"
                          style={{ 
                            width: `${item.porcentagem}%`,
                            backgroundColor: `hsl(${index * 90}, 70%, 50%)`
                          }}
                        ></div>
                      </div>
                    </div>
                  )) || <p className="no-data">Nenhum dado disponível</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 📋 TABELA DETALHADA */}
        <section className="tabela-relatorio">
          <h3>📋 Manutenções Detalhadas</h3>
          <div className="table-container">
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Data Abertura</th>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Problema</th>
                  <th>Solução</th>
                  <th>Fornecedor</th>
                  <th>Custo</th>
                  <th>Técnico</th>
                  <th>Data Conclusão</th>
                </tr>
              </thead>
              <tbody>
                {data?.manutencoes?.length > 0 ? (
                  data.manutencoes.map((manut) => (
                    <tr key={manut.id} className={`status-${manut.status}`}>
                      <td>{new Date(manut.data_abertura).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <strong>{manut.item?.nome}</strong>
                        {manut.item?.patrimonio && (
                          <div className="item-details">Patrimônio: {manut.item.patrimonio}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge--${manut.tipo_manutencao}`}>
                          {LABELS[manut.tipo_manutencao] || manut.tipo_manutencao}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${manut.status}`}>
                          {LABELS[manut.status] || manut.status}
                        </span>
                      </td>
                      <td className="problema-cell">
                        {manut.descricao_problema || '-'}
                      </td>
                      <td className="solucao-cell">
                        {manut.descricao_solucao || '-'}
                      </td>
                      <td>{manut.fornecedor_manutencao || '-'}</td>
                      <td className="text-right">
                        {manut.custo_manutencao ? 
                          `R$ ${parseFloat(manut.custo_manutencao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                          '-'
                        }
                      </td>
                      <td>{manut.tecnico?.nome || '-'}</td>
                      <td>
                        {manut.data_conclusao ? 
                          new Date(manut.data_conclusao).toLocaleDateString('pt-BR') : 
                          <span className="text-warning">Em andamento</span>
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="no-data">
                      Nenhuma manutenção encontrada com os filtros aplicados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 📊 ANÁLISE DE CUSTOS */}
        {data?.estatisticas && data.estatisticas.custo_total > 0 && (
          <section className="analise-custos">
            <h3>💰 Análise de Custos</h3>
            <div className="custos-grid">
              <div className="custo-card">
                <h4>Custo Médio por Manutenção</h4>
                <div className="custo-valor">
                  R$ {((data.estatisticas.custo_total || 0) / (data.estatisticas.total_manutencoes || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="custo-card">
                <h4>Manutenções com Custo</h4>
                <div className="custo-valor">
                  {data.manutencoes?.filter(m => m.custo_manutencao > 0).length || 0}
                </div>
              </div>
              <div className="custo-card">
                <h4>Custo Mais Alto</h4>
                <div className="custo-valor">
                  R$ {Math.max(...(data.manutencoes?.map(m => parseFloat(m.custo_manutencao) || 0) || [0])).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 📝 RODAPÉ DO RELATÓRIO */}
        <footer className="relatorio-footer">
          <div className="relatorio-metadata">
            <div className="metadata-item">
              <strong>Relatório gerado em:</strong> {new Date().toLocaleString('pt-BR')}
            </div>
            <div className="metadata-item">
              <strong>Total de manutenções:</strong> {data?.manutencoes?.length || 0}
            </div>
            <div className="metadata-item">
              <strong>Custo total:</strong> R$ {(data?.estatisticas?.custo_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="metadata-item">
              <strong>Período:</strong> {filtros.data_inicio ? `${filtros.data_inicio} a ${filtros.data_fim}` : 'Todo o período'}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RelatorioManutencoes;