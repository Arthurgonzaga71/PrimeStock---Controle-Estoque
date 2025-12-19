// 📁 frontend/src/components/Export/ExportManager.js
import React, { useState } from 'react';

const ExportManager = ({ dados, tipo }) => {
  const [exportando, setExportando] = useState(false);

  const handleExport = async (formato) => {
    try {
      setExportando(true);
      
      // Simular tempo de exportação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`✅ ${tipo} exportado em ${formato.toUpperCase()} com sucesso!`);
      console.log(`Exportando ${tipo} em ${formato}:`, dados);
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('❌ Erro ao gerar relatório.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="export-manager">
      <h4>📤 Exportar {tipo}</h4>
      
      <div className="export-buttons">
      
        
        <button
          onClick={() => handleExport('excel')}
          disabled={exportando}
          className="export-btn"
        >
          {exportando ? '⏳' : '📊'} Excel
        </button>
      </div>
      
      {exportando && (
        <div className="export-progress">
          <span>Gerando relatório...</span>
        </div>
      )}
    </div>
  );
};

export default ExportManager;