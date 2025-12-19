import React, { useState } from 'react';
import { exportService, downloadBlob } from '../services/api';
import { Button } from './UI/';

const ExportManutencoesButton = ({ filtros = {}, disabled = false, variant = "primary" }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      console.log('📤 Iniciando exportação de manutenções...', filtros);
      
      // TENTATIVA 1: Usar rota específica de manutenções
      try {
        const response = await exportService.exportManutencoes(filtros);
        
        if (response.data) {
          downloadBlob(
            response.data,
            `manutencoes_${new Date().toISOString().split('T')[0]}.xlsx`
          );
          console.log('✅ Exportação concluída com sucesso usando rota específica');
          return;
        }
      } catch (error1) {
        console.warn('⚠️ Rota específica falhou, tentando rota genérica...', error1.message);
      }
      
      // TENTATIVA 2: Usar rota genérica com parâmetro type
      try {
        const response = await exportService.exportToExcel({
          ...filtros,
          type: 'manutencoes'
        });
        
        if (response.data) {
          downloadBlob(
            response.data,
            `manutencoes_${new Date().toISOString().split('T')[0]}.xlsx`
          );
          console.log('✅ Exportação concluída com sucesso usando rota genérica');
          return;
        }
      } catch (error2) {
        console.error('❌ Ambas as rotas falharam:', error2.message);
      }
      
      // Se ambas falharem
      alert('❌ Não foi possível exportar as manutenções.\n\nVerifique:\n1. Se o backend está rodando\n2. Se a rota de exportação existe\n3. Se você tem permissão para exportar');
      
    } catch (error) {
      console.error('❌ Erro inesperado na exportação:', error);
      alert(`Erro ao exportar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      const response = await exportService.exportToPDF({
        ...filtros,
        type: 'manutencoes'
      });
      
      if (response.data) {
        downloadBlob(
          response.data,
          `manutencoes_${new Date().toISOString().split('T')[0]}.pdf`
        );
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-buttons">
      <Button
        onClick={handleExport}
        loading={loading}
        disabled={disabled || loading}
        variant={variant}
        icon="📊"
        title="Exportar manutenções para Excel"
        className="mr-2"
      >
        Exportar Excel
      </Button>
      
      <Button
        onClick={handleExportPDF}
        loading={loading}
        disabled={disabled || loading}
        variant="secondary"
        icon="📄"
        title="Exportar manutenções para PDF"
      >
        Exportar PDF
      </Button>
    </div>
  );
};

export default ExportManutencoesButton;