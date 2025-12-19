import React, { useState, useEffect } from 'react';
import ExportButton from './ExportButton';
import ExportService from '../../services/exportService';
import './ExportManager.css';

const ExportManager = ({ 
  data = [], 
  type = 'itens', 
  filters = {},
  title = 'Exportar Dados',
  onExportStart,
  onExportComplete,
  onExportError 
}) => {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [recentExports, setRecentExports] = useState([]);

  // 📊 TIPOS DE EXPORTAÇÃO
  const exportOptions = {
    itens: {
      label: 'Itens',
      icon: '📦',
      pdf: 'Gerar PDF de Itens',
      excel: 'Exportar Excel de Itens'
    },
    movimentacoes: {
      label: 'Movimentações', 
      icon: '🔄',
      pdf: 'Gerar PDF de Movimentações',
      excel: 'Exportar Excel de Movimentações'
    }
  };

  // 🚀 EXECUTAR EXPORTAÇÃO
  const handleExport = async () => {
    if (!data || data.length === 0) {
      alert('❌ Nenhum dado disponível para exportação');
      return;
    }

    setLoading(true);
    
    if (onExportStart) {
      onExportStart();
    }

    try {
      let result;

      if (exportType === 'pdf') {
        result = await ExportService.generatePDF(type, filters);
      } else {
        result = await ExportService.generateExcel(type, filters);
      }

      // Adicionar ao histórico
      if (result.success) {
        const newExport = {
          id: Date.now(),
          type: exportType,
          format: exportType,
          filename: result.filename,
          timestamp: new Date(),
          records: data.length,
          status: 'success'
        };
        
        setRecentExports(prev => [newExport, ...prev.slice(0, 4)]);
      }

      if (onExportComplete) {
        onExportComplete(result);
      }

      console.log(`✅ Exportação ${exportType} concluída:`, result);

    } catch (error) {
      console.error(`❌ Erro na exportação ${exportType}:`, error);
      
      if (onExportError) {
        onExportError(error);
      } else {
        alert(`Erro ao exportar: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 📥 BAIXAR ARQUIVO
  const handleDownload = (filename) => {
    window.open(`http://localhost:3001/exports/${filename}`, '_blank');
  };

  const currentOption = exportOptions[type] || exportOptions.itens;

  return (
    <div className="export-manager">
      {/* CABEÇALHO */}
      <div className="export-header">
        <h3>
          <span className="export-icon">{currentOption.icon}</span>
          {title}
        </h3>
        <div className="export-badge">
          {data.length} registros
        </div>
      </div>

      {/* CONTROLES DE EXPORTAÇÃO */}
      <div className="export-controls">
        {/* SELETOR DE TIPO */}
        <div className="format-selector">
          <div className="format-options">
           
          </div>
        </div>

      </div>

      {/* INFORMAÇÕES */}
   

      {/* HISTÓRICO RECENTE */}
      {recentExports.length > 0 && (
        <div className="export-history">
          <h4>📋 Exportações Recentes</h4>
          <div className="history-list">
            {recentExports.map(exp => (
              <div key={exp.id} className="history-item">
                <div className="history-info">
                  <span className="history-filename">{exp.filename}</span>
                  <span className="history-details">
                    {exp.format.toUpperCase()} • {exp.records} registros • 
                    {exp.timestamp.toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <button
                  className="download-btn"
                  onClick={() => handleDownload(exp.filename)}
                  title="Baixar arquivo"
                >
                  ⬇️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DICAS */}
      <div className="export-tips">
        <div className="tip">
          <strong>💡 Dicas:</strong>
          <ul>
            <li><strong>PDF:</strong> Ideal para relatórios e impressão</li>
            <li><strong>Excel:</strong> Perfect para análise e edição de dados</li>
            <li>Arquivos ficam disponíveis por 24 horas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;