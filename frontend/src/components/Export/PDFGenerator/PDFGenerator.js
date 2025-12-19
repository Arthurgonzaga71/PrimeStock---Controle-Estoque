import React from 'react';
import BaseTemplate from '../ReportTemplates/BaseTemplate';
import ItensPDF from './ItensPDF';
import MovimentacoesPDF from './MovimentacoesPDF';
import ManutencoesPDF from './ManutencoesPDF';

class PDFGenerator {
  
  // 📋 GERAR PDF BASE
  static generatePDF(content, filename) {
    return new Promise((resolve, reject) => {
      try {
        // Abrir nova janela para impressão/PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${filename}</title>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: 'Arial', sans-serif; 
                margin: 20px; 
                color: #333;
                line-height: 1.4;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #2c5aa0; 
                padding-bottom: 15px; 
              }
              .title { 
                font-size: 24px; 
                color: #2c5aa0; 
                margin: 0; 
                font-weight: bold;
              }
              .subtitle { 
                font-size: 14px; 
                color: #666; 
                margin: 5px 0; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
                font-size: 12px;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 10px; 
                text-align: left; 
              }
              th { 
                background-color: #f8f9fa; 
                font-weight: bold;
                color: #2c5aa0;
              }
              .total-row { 
                font-weight: bold; 
                background-color: #e9ecef; 
              }
              .status-disponivel { color: #28a745; font-weight: bold; }
              .status-baixo { color: #dc3545; font-weight: bold; }
              .status-emprestado { color: #ffc107; font-weight: bold; }
              .footer { 
                margin-top: 40px; 
                padding-top: 15px; 
                border-top: 1px solid #ddd; 
                text-align: center;
                font-size: 11px;
                color: #666;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
          </html>
        `);
        
        printWindow.document.close();
        
        // Dar tempo para carregar e então imprimir
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
            resolve({ success: true, filename });
          };
        }, 500);
        
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    });
  }

  // 📦 GERAR PDF DE ITENS
  static async generateItensPDF(itens, options = {}) {
    try {
      const content = ItensPDF.generate(itens, options);
      const filename = `relatorio-itens-${new Date().getTime()}.pdf`;
      return await this.generatePDF(content, filename);
    } catch (error) {
      throw new Error(`Erro ao gerar PDF de itens: ${error.message}`);
    }
  }

  // 🔄 GERAR PDF DE MOVIMENTAÇÕES
  static async generateMovimentacoesPDF(movimentacoes, options = {}) {
    try {
      const content = MovimentacoesPDF.generate(movimentacoes, options);
      const filename = `relatorio-movimentacoes-${new Date().getTime()}.pdf`;
      return await this.generatePDF(content, filename);
    } catch (error) {
      throw new Error(`Erro ao gerar PDF de movimentações: ${error.message}`);
    }
  }

  // 🔧 GERAR PDF DE MANUTENÇÕES
  static async generateManutencoesPDF(manutencoes, options = {}) {
    try {
      const content = ManutencoesPDF.generate(manutencoes, options);
      const filename = `relatorio-manutencoes-${new Date().getTime()}.pdf`;
      return await this.generatePDF(content, filename);
    } catch (error) {
      throw new Error(`Erro ao gerar PDF de manutenções: ${error.message}`);
    }
  }

  // 📊 GERAR PDF COMPLETO DO SISTEMA
  static async generateSistemaCompleto(dados, options = {}) {
    try {
      const { itens = [], movimentacoes = [], manutencoes = [] } = dados;
      
      const content = `
        ${BaseTemplate.generateHeader('Relatório Completo do Sistema', 'Resumo geral do estoque TI')}
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c5aa0;">📊 Resumo Estatístico</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0;">
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #2c5aa0;">${itens.length}</div>
              <div style="font-size: 12px; color: #666;">Total de Itens</div>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #856404;">${movimentacoes.length}</div>
              <div style="font-size: 12px; color: #666;">Movimentações</div>
            </div>
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #721c24;">${manutencoes.length}</div>
              <div style="font-size: 12px; color: #666;">Manutenções</div>
            </div>
          </div>
        </div>

        ${itens.length > 0 ? ItensPDF.generateSection(itens, { showHeader: false }) : ''}
        ${movimentacoes.length > 0 ? MovimentacoesPDF.generateSection(movimentacoes, { showHeader: false }) : ''}
        ${manutencoes.length > 0 ? ManutencoesPDF.generateSection(manutencoes, { showHeader: false }) : ''}
        
        ${BaseTemplate.generateFooter()}
      `;

      const filename = `relatorio-completo-sistema-${new Date().getTime()}.pdf`;
      return await this.generatePDF(content, filename);
    } catch (error) {
      throw new Error(`Erro ao gerar PDF completo: ${error.message}`);
    }
  }
}

export default PDFGenerator;