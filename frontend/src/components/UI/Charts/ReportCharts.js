// 📁 frontend/src/components/Charts/ReportCharts.js
import React from 'react';

// Componente simples sem dependências externas
export const ChartItensPorCategoria = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>📊 Itens por Categoria</h3>
        <div className="chart-placeholder">
          <div className="no-data">📈 Gráfico de Itens por Categoria</div>
          <p>Dados de exemplo carregados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>📊 Itens por Categoria</h3>
      <div className="chart-placeholder">
        <div className="chart-bars">
          {data.map((item, index) => (
            <div key={index} className="chart-bar">
              <div className="bar-label">{item.name}</div>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ height: `${(item.quantidade / 10) * 100}%` }}
                ></div>
              </div>
              <div className="bar-value">{item.quantidade}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ChartMovimentacoesPorTipo = ({ data }) => {
  return (
    <div className="chart-container">
      <h3>🔄 Movimentações por Tipo</h3>
      <div className="chart-placeholder">
        <div className="pie-chart">
          {data?.map((item, index) => (
            <div key={index} className="pie-item">
              <div className="pie-color" style={{ backgroundColor: getColor(index) }}></div>
              <span>{item.name}: {item.value}</span>
            </div>
          )) || <div className="no-data">Dados de movimentações</div>}
        </div>
      </div>
    </div>
  );
};

export const ChartStatusItens = ({ data }) => {
  return (
    <div className="chart-container">
      <h3>🎯 Status dos Itens</h3>
      <div className="chart-placeholder">
        <div className="pie-chart">
          {data?.map((item, index) => (
            <div key={index} className="pie-item">
              <div className="pie-color" style={{ backgroundColor: getColor(index) }}></div>
              <span>{item.name}: {item.value}</span>
            </div>
          )) || <div className="no-data">Dados de status</div>}
        </div>
      </div>
    </div>
  );
};

// Função auxiliar para cores
const getColor = (index) => {
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  return colors[index % colors.length];
};