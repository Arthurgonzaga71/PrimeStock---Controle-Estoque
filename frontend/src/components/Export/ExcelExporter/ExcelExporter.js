class ExcelExporter {
  
  // 📊 GERAR EXCEL COM FORMATAÇÃO DE TABELA
  static generateExcel(data, headers, filename, sheetName = 'Dados') {
    return new Promise((resolve, reject) => {
      try {
        // Verificar se a biblioteca SheetJS está disponível
        if (window.XLSX) {
          this.generateWithSheetJS(data, headers, filename, sheetName)
            .then(resolve)
            .catch(reject);
        } else {
          // Fallback para CSV
          this.generateCSV(data, headers, filename)
            .then(resolve)
            .catch(reject);
        }
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }

  // 🎯 GERAR EXCEL COM FORMATAÇÃO DE TABELA
  static async generateWithSheetJS(data, headers, filename, sheetName) {
    const XLSX = window.XLSX;
    
    // Preparar dados com cabeçalhos como primeira linha
    const worksheetData = [
      headers, // Cabeçalho
      ...data.map(row => headers.map(header => row[header] || ''))
    ];

    // Criar worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Definir range da tabela
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Aplicar estilos ao cabeçalho
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: range.s.r, c: C });
      if (!worksheet[headerCell]) continue;
      
      // Estilizar cabeçalho
      worksheet[headerCell].s = {
        fill: { fgColor: { rgb: "4472C4" } }, // Azul do Excel
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Aplicar estilos às células de dados
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cell]) continue;
        
        // Alternar cores de linha (zebra stripes)
        const fillColor = (R % 2 === 0) ? "FFFFFF" : "F2F2F2";
        
        // Estilizar células de dados
        worksheet[cell].s = {
          fill: { fgColor: { rgb: fillColor } },
          border: {
            top: { style: "thin", color: { rgb: "D9D9D9" } },
            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          },
          alignment: { vertical: "center" }
        };

        // Alinhamento específico para colunas numéricas
        const headerName = headers[C];
        if (headerName.includes('Quantidade') || headerName.includes('Valor')) {
          worksheet[cell].s.alignment = { ...worksheet[cell].s.alignment, horizontal: "right" };
        } else if (headerName.includes('Data')) {
          worksheet[cell].s.alignment = { ...worksheet[cell].s.alignment, horizontal: "center" };
        }
      }
    }

    // Ajustar largura das colunas automaticamente
    const colWidths = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLength = 0;
      
      // Verificar todas as linhas
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        const cellValue = worksheet[cell] ? worksheet[cell].v : '';
        const length = cellValue ? String(cellValue).length : 0;
        maxLength = Math.max(maxLength, length);
      }
      
      // Definir largura mínima e máxima
      const width = Math.min(Math.max(maxLength + 2, headers[C].length + 2), 50);
      colWidths.push({ wch: width });
    }
    
    worksheet['!cols'] = colWidths;

    // Adicionar filtro na primeira linha (cabeçalho)
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

    // Criar workbook e adicionar worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar arquivo e fazer download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return { success: true, filename: `${filename}.xlsx`, format: 'excel' };
  }

  // 📄 GERAR CSV (fallback - sem alterações)
  static generateCSV(data, headers, filename) {
    return new Promise((resolve) => {
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      resolve({ success: true, filename: `${filename}.csv`, format: 'csv' });
    });
  }

  // 📦 GERAR EXCEL DE ITENS COM FORMATAÇÃO
  static async generateItensExcel(itens, options = {}) {
    const headers = ['Nome', 'Categoria', 'Patrimônio', 'Quantidade', 'Quantidade Mínima', 'Valor Unitário', 'Status', 'Localização', 'Descrição'];
    
    const data = itens.map(item => ({
      'Nome': item.nome || '',
      'Categoria': item.categoria?.nome || '',
      'Patrimônio': item.patrimonio || '',
      'Quantidade': item.quantidade || 0,
      'Quantidade Mínima': item.quantidade_minima || 0,
      'Valor Unitário': item.valor ? item.valor.toFixed(2) : 0,
      'Status': this.formatItemStatus(item),
      'Localização': item.localizacao || '',
      'Descrição': item.descricao || ''
    }));

    const filename = `relatorio-itens-${new Date().getTime()}`;
    return await this.generateExcel(data, headers, filename, 'Itens Estoque');
  }

  // 🔄 GERAR EXCEL DE MOVIMENTAÇÕES COM FORMATAÇÃO
  static async generateMovimentacoesExcel(movimentacoes, options = {}) {
    const headers = ['Data', 'Tipo', 'Item', 'Patrimônio', 'Quantidade', 'Destinatário', 'Departamento', 'Usuário', 'Observação'];
    
    const data = movimentacoes.map(mov => ({
      'Data': new Date(mov.data_movimentacao),
      'Tipo': mov.tipo || '',
      'Item': mov.item?.nome || '',
      'Patrimônio': mov.item?.patrimonio || '',
      'Quantidade': mov.quantidade || 0,
      'Destinatário': mov.destinatario || '',
      'Departamento': mov.departamento_destino || '',
      'Usuário': mov.usuario?.nome || '',
      'Observação': mov.observacao || ''
    }));

    const filename = `relatorio-movimentacoes-${new Date().getTime()}`;
    return await this.generateExcel(data, headers, filename, 'Movimentações');
  }

  // 🔧 GERAR EXCEL DE MANUTENÇÕES COM FORMATAÇÃO
  static async generateManutencoesExcel(manutencoes, options = {}) {
    const headers = ['Item', 'Patrimônio', 'Tipo', 'Status', 'Custo', 'Data Solicitação', 'Data Conclusão', 'Técnico', 'Problema'];
    
    const data = manutencoes.map(manut => ({
      'Item': manut.item?.nome || '',
      'Patrimônio': manut.item?.patrimonio || '',
      'Tipo': manut.tipo || '',
      'Status': manut.status || '',
      'Custo': manut.custo ? manut.custo.toFixed(2) : 0,
      'Data Solicitação': new Date(manut.data_solicitacao),
      'Data Conclusão': manut.data_conclusao ? new Date(manut.data_conclusao) : '',
      'Técnico': manut.tecnico_responsavel || '',
      'Problema': manut.descricao_problema || ''
    }));

    const filename = `relatorio-manutencoes-${new Date().getTime()}`;
    return await this.generateExcel(data, headers, filename, 'Manutenções');
  }

  static formatItemStatus(item) {
    if (item.status === 'disponivel') return 'Disponível';
    if (item.status === 'emprestado') return 'Emprestado';
    if (item.quantidade <= item.quantidade_minima) return 'Estoque Baixo';
    return 'Indisponível';
  }
}

export default ExcelExporter;