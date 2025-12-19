// Template base para todos os relatórios
class BaseTemplate {
  static generateHeader(title, subtitle = '', filters = []) {
    const filtersHtml = filters.length > 0 ? `
      <div style="margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #007bff;">
        <p style="margin: 0 0 5px 0; font-weight: bold; color: #495057;">Filtros Aplicados:</p>
        <ul style="margin: 0; padding-left: 20px; color: #6c757d;">
          ${filters.map(filter => `<li>${filter}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    return `
      <div style="margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
          <h1 style="margin: 0 0 5px 0; font-size: 28px; font-weight: 600;">${title}</h1>
          ${subtitle ? `<p style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">${subtitle}</p>` : ''}
          <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; margin-top: 10px;">
            <span style="font-size: 14px;">📋</span>
            <span style="font-size: 14px;">Sistema de Controle de Estoque TI</span>
            <span style="font-size: 14px;">•</span>
            <span style="font-size: 14px;">${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
        ${filtersHtml}
      </div>
    `;
  }

  static generateFooter(summary = {}) {
    const summaryItems = Object.entries(summary)
      .map(([key, value]) => `<span style="margin-right: 20px;"><strong>${key}:</strong> ${value}</span>`)
      .join('');

    return `
      <div style="margin-top: 40px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          ${summaryItems ? `
            <div style="font-size: 14px; color: #495057;">
              ${summaryItems}
            </div>
          ` : ''}
          <div style="font-size: 12px; color: #6c757d;">
            <span style="margin-right: 15px;">📄 Página: <strong>1 de 1</strong></span>
            <span>👤 Usuário: <strong>${localStorage.getItem('userName') || 'Sistema'}</strong></span>
          </div>
        </div>
        <div style="text-align: center; padding-top: 10px; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #6c757d; font-size: 12px;">
            ⏰ Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}
          </p>
          <p style="margin: 5px 0 0 0; color: #adb5bd; font-size: 11px;">
            Sistema de Controle de Estoque TI • Departamento de Tecnologia da Informação
          </p>
        </div>
      </div>
    `;
  }

  static generateTable(headers, rows, options = {}) {
    const {
      striped = true,
      highlightFirstColumn = false,
      columnWidths = [],
      alignments = [],
      numericColumns = [],
      dateColumns = [],
      totals = []
    } = options;

    const headerRow = headers.map((header, index) => {
      const style = [
        'background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
        'padding: 12px 15px',
        'border: 1px solid #dee2e6',
        'font-weight: 600',
        'color: #495057',
        'text-align: left',
        'position: sticky',
        'top: 0',
        'z-index: 10'
      ];
      
      if (columnWidths[index]) {
        style.push(`width: ${columnWidths[index]}`);
      }
      
      if (alignments[index]) {
        style.push(`text-align: ${alignments[index]}`);
      }
      
      return `<th style="${style.join(';')}">${header}</th>`;
    }).join('');

    const bodyRows = rows.map((row, rowIndex) => {
      const rowStyle = [
        striped && rowIndex % 2 === 0 ? 'background-color: #ffffff' : 'background-color: #f8f9fa',
        'transition: background-color 0.2s'
      ].filter(Boolean);

      const cells = row.map((cell, cellIndex) => {
        const cellStyle = [
          'padding: 10px 15px',
          'border: 1px solid #dee2e6',
          alignments[cellIndex] ? `text-align: ${alignments[cellIndex]}` : 'text-align: left',
          highlightFirstColumn && cellIndex === 0 ? 'font-weight: 600; background-color: #f1f3f4' : '',
          numericColumns.includes(cellIndex) ? 'font-family: "Courier New", monospace; font-weight: 600' : '',
          dateColumns.includes(cellIndex) ? 'color: #0066cc' : ''
        ].filter(Boolean);

        let displayCell = cell;
        if (numericColumns.includes(cellIndex) && typeof cell === 'number') {
          displayCell = cell.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (dateColumns.includes(cellIndex) && cell) {
          try {
            const date = new Date(cell);
            displayCell = date.toLocaleDateString('pt-BR');
          } catch (e) {
            displayCell = cell;
          }
        }

        return `<td style="${cellStyle.join(';')}">${displayCell || '-'}</td>`;
      }).join('');

      return `<tr style="${rowStyle.join(';')}">${cells}</tr>`;
    }).join('');

    // Adicionar linha de totais se especificado
    let totalsRow = '';
    if (totals.length > 0) {
      const totalCells = headers.map((_, index) => {
        const total = totals.find(t => t.column === index);
        if (total) {
          const formattedValue = typeof total.value === 'number' 
            ? total.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : total.value;
          return `<td style="padding: 10px 15px; border: 1px solid #dee2e6; background-color: #e7f3ff; font-weight: 700; text-align: ${alignments[index] || 'right'};">${formattedValue}</td>`;
        }
        return `<td style="padding: 10px 15px; border: 1px solid #dee2e6; background-color: #e7f3ff;"></td>`;
      }).join('');
      
      totalsRow = `
        <tr style="background-color: #e7f3ff; font-weight: 700;">
          <td colspan="${headers.length - totals.length}" style="padding: 10px 15px; border: 1px solid #dee2e6; text-align: right;">TOTAL</td>
          ${totalCells}
        </tr>
      `;
    }

    return `
      <div style="overflow-x: auto; margin: 20px 0; border-radius: 8px; border: 1px solid #dee2e6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${bodyRows}
            ${totalsRow}
          </tbody>
        </table>
      </div>
    `;
  }

  static generateCard(title, value, icon = '📊', color = '#007bff') {
    return `
      <div style="
        background: linear-gradient(135deg, ${color}20 0%, ${color}10 100%);
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        border-left: 4px solid ${color};
        display: inline-block;
        min-width: 180px;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">${icon}</span>
          <div>
            <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">${title}</div>
            <div style="font-size: 18px; font-weight: 600; color: #343a40;">${value}</div>
          </div>
        </div>
      </div>
    `;
  }

  static generateStatsRow(stats) {
    const statsHtml = stats.map(stat => this.generateCard(stat.title, stat.value, stat.icon, stat.color)).join('');
    return `<div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">${statsHtml}</div>`;
  }

  static generateFullReport(title, subtitle, headers, rows, filters = [], summary = {}, options = {}) {
    const header = this.generateHeader(title, subtitle, filters);
    const table = this.generateTable(headers, rows, options);
    const footer = this.generateFooter(summary);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Controle de Estoque TI</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', 'Segoe UI', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #fff;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            table { page-break-inside: avoid; }
            thead { display: table-header-group; }
          }
          tr:hover { background-color: #f5f7fa !important; }
          .highlight { background-color: #fff8e1 !important; }
          .warning { background-color: #fff3cd !important; }
          .success { background-color: #d4edda !important; }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
          <button onclick="window.print()" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          ">
            🖨️ Imprimir Relatório
          </button>
        </div>
        ${header}
        ${table}
        ${footer}
        <script>
          // Adicionar classes baseadas no conteúdo
          document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('td').forEach(cell => {
              const text = cell.textContent.toLowerCase();
              if (text.includes('baixo') || text.includes('critico')) {
                cell.classList.add('warning');
              } else if (text.includes('alto') || text.includes('bom')) {
                cell.classList.add('success');
              }
            });
          });
        </script>
      </body>
      </html>
    `;
  }
}

export default BaseTemplate;