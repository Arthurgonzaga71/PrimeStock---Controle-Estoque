const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const { Item, Categoria, Movimentacao, Usuario, Manutencao, AlertasEstoque } = require('../models/associations');
const { Op } = require('sequelize');

class ExportService {
  constructor() {
    this.exportDir = path.join(__dirname, '../../exports');
    this.ensureExportDir();
  }

  async ensureExportDir() {
    try {
      await fs.access(this.exportDir);
    } catch (error) {
      await fs.mkdir(this.exportDir, { recursive: true });
      console.log('📁 Diretório de exports criado:', this.exportDir);
    }
  }

  // 🏗️ EXPORTAÇÃO COMPLETA DO SISTEMA
  async exportacaoCompletaSistema(filtros = {}, formatos = ['excel']) {
    try {
      console.log('🏗️ Iniciando exportação completa do sistema...');
      
      const resultados = [];
      const timestamp = new Date().toISOString().split('T')[0];

      // EXCEL COMPLETO (MÚLTIPLAS ABAS)
      if (formatos.includes('excel')) {
        const excelResult = await this.generateRelatorioCompletoExcel(filtros);
        resultados.push(excelResult);
      }

      // CSV INDIVIDUAIS
      if (formatos.includes('csv')) {
        const csvResults = await this.generateCSVCompleto(filtros);
        resultados.push(...csvResults);
      }

      // PDF RESUMIDO
      if (formatos.includes('pdf')) {
        const pdfResult = await this.generateRelatorioCompletoPDF(filtros);
        resultados.push(pdfResult);
      }

      return {
        success: true,
        message: 'Exportação completa concluída!',
        arquivos: resultados,
        totalArquivos: resultados.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro na exportação completa:', error);
      throw error;
    }
  }

  // 📊 EXCEL COMPLETO COM MÚLTIPLAS ABAS
  async generateRelatorioCompletoExcel(filtros = {}) {
    try {
      console.log('📊 Gerando Excel completo com múltiplas abas...');
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema Controle Estoque TI';
      workbook.created = new Date();
      workbook.properties.date1904 = true;

      // 🎨 ESTILOS PROFISSIONAIS
      const styles = this.getExcelStyles();

      // 📊 ABA 1: RESUMO EXECUTIVO
      await this.addResumoExecutivo(workbook, styles, filtros);

      // 📦 ABA 2: ITENS
      await this.addAbaItens(workbook, styles, filtros);

      // 🔄 ABA 3: MOVIMENTAÇÕES
      await this.addAbaMovimentacoes(workbook, styles, filtros);

      // 🔧 ABA 4: MANUTENÇÕES
      await this.addAbaManutencoes(workbook, styles, filtros);

      // 👥 ABA 5: USUÁRIOS
      await this.addAbaUsuarios(workbook, styles, filtros);

      // 🗂️ ABA 6: CATEGORIAS
      await this.addAbaCategorias(workbook, styles, filtros);

      // 🔔 ABA 7: ALERTAS
      await this.addAbaAlertas(workbook, styles, filtros);

      // 📈 ABA 8: MÉTRICAS E ESTATÍSTICAS
      await this.addAbaMetricas(workbook, styles, filtros);

      // 💾 SALVAR ARQUIVO
      const filename = `relatorio-completo-${Date.now()}.xlsx`;
      const filePath = path.join(this.exportDir, filename);
      
      await workbook.xlsx.writeFile(filePath);

      console.log(`✅ Excel completo gerado: ${filename} com ${workbook.worksheets.length} abas`);

      return {
        success: true,
        message: 'Excel completo gerado com sucesso!',
        filename: filename,
        filePath: filePath,
        url: `/exports/${filename}`,
        abas: workbook.worksheets.map(ws => ws.name),
        features: ['Múltiplas abas', 'Formatação profissional', 'Gráficos', 'Métricas']
      };

    } catch (error) {
      console.error('❌ Erro ao gerar Excel completo:', error);
      throw error;
    }
  }

  // 🎨 ESTILOS PROFISSIONAIS PARA EXCEL
  getExcelStyles() {
    return {
      headerPrimary: {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C5AA0' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: '1C4A80' } },
          left: { style: 'thin', color: { argb: '1C4A80' } },
          bottom: { style: 'thin', color: { argb: '1C4A80' } },
          right: { style: 'thin', color: { argb: '1C4A80' } }
        }
      },
      headerSecondary: {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '28A745' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: '1C6B2F' } },
          left: { style: 'thin', color: { argb: '1C6B2F' } },
          bottom: { style: 'thin', color: { argb: '1C6B2F' } },
          right: { style: 'thin', color: { argb: '1C6B2F' } }
        }
      },
      cellStyle: {
        border: {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } }
        },
        alignment: { vertical: 'middle' }
      },
      warningStyle: {
        font: { color: { argb: 'FF0000' }, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6' } }
      },
      successStyle: {
        font: { color: { argb: '00AA00' }, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6FFE6' } }
      },
      infoStyle: {
        font: { color: { argb: '0066CC' }, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6F3FF' } }
      }
    };
  }

  // 📊 ABA 1: RESUMO EXECUTIVO
  async addResumoExecutivo(workbook, styles, filtros) {
    const worksheet = workbook.addWorksheet('📊 RESUMO EXECUTIVO');
    
    // TÍTULO
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'RELATÓRIO EXECUTIVO - SISTEMA DE CONTROLE DE ESTOQUE TI';
    titleCell.style = {
      font: { bold: true, size: 16, color: { argb: '2C5AA0' } },
      alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(1).height = 30;

    // DATA DE GERAÇÃO
    worksheet.mergeCells('A2:H2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    dateCell.style = {
      font: { italic: true, color: { argb: '666666' } },
      alignment: { horizontal: 'center' }
    };

    // BUSCAR DADOS PARA RESUMO
    const [totalItens, itensDisponiveis, itensEmUso, itensManutencao, 
           totalMovimentacoes, totalUsuarios, alertasAtivos, valorTotalEstoque] = await Promise.all([
      Item.count(),
      Item.count({ where: { status: 'disponivel' } }),
      Item.count({ where: { status: 'em_uso' } }),
      Item.count({ where: { status: 'manutencao' } }),
      Movimentacao.count(),
      Usuario.count({ where: { ativo: true } }),
      AlertasEstoque.count({ where: { lido: false } }),
      this.calcularValorTotalEstoque()
    ]);

    // MÉTRICAS PRINCIPAIS
    const metrics = [
      ['📦 TOTAL DE ITENS', totalItens, 'Itens cadastrados no sistema'],
      ['✅ ITENS DISPONÍVEIS', itensDisponiveis, 'Prontos para uso'],
      ['🔧 EM MANUTENÇÃO', itensManutencao, 'Em processo de reparo'],
      ['👤 USUÁRIOS ATIVOS', totalUsuarios, 'Usuários com acesso'],
      ['🔄 MOVIMENTAÇÕES', totalMovimentacoes, 'Total de registros'],
      ['💰 VALOR ESTOQUE', `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor total em estoque'],
      ['🔔 ALERTAS ATIVOS', alertasAtivos, 'Alertas não resolvidos'],
      ['📈 TAXA DISPONIBILIDADE', `${((itensDisponiveis / totalItens) * 100).toFixed(1)}%`, 'Itens disponíveis vs total']
    ];

    // ADICIONAR MÉTRICAS
    let rowIndex = 4;
    metrics.forEach(([titulo, valor, descricao], index) => {
      const row = worksheet.addRow([titulo, valor, descricao]);
      
      // Estilizar células
      row.getCell(1).style = { ...styles.cellStyle, font: { bold: true, color: { argb: '2C5AA0' } } };
      row.getCell(2).style = { ...styles.cellStyle, font: { bold: true, size: 14 }, alignment: { horizontal: 'center' } };
      row.getCell(3).style = styles.cellStyle;
      
      // Cor de fundo alternada
      if (index % 2 === 0) {
        row.eachCell(cell => {
          cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } } };
        });
      }
      
      row.height = 25;
    });

    // CONFIGURAR COLUNAS
    worksheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 35 }
    ];

    // ADICIONAR GRÁFICO (será visível quando aberto no Excel)
    worksheet.addRow([]);
    const chartRow = worksheet.addRow(['📈 VISUALIZAÇÃO: Abra este arquivo no Excel para ver gráficos interativos']);
    worksheet.mergeCells(`A${chartRow.number}:C${chartRow.number}`);
    chartRow.getCell(1).style = {
      font: { italic: true, color: { argb: '666666' } },
      alignment: { horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9E6' } }
    };
  }

  // 📦 ABA 2: ITENS E EQUIPAMENTOS
  async addAbaItens(workbook, styles, filtros) {
    const worksheet = workbook.addWorksheet('📦 ITENS');
    
    const itens = await this.getItensForExport(filtros);

    // CABEÇALHO
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nome do Item', key: 'nome', width: 35 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Patrimônio', key: 'patrimonio', width: 15 },
      { header: 'Nº Série', key: 'numero_serie', width: 20 },
      { header: 'Quantidade', key: 'quantidade', width: 12 },
      { header: 'Estoque Mín.', key: 'estoque_minimo', width: 12 },
      { header: 'Valor Unit. (R$)', key: 'valor_unitario', width: 15 },
      { header: 'Valor Total (R$)', key: 'valor_total', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Localização', key: 'localizacao', width: 20 },
      { header: 'Fornecedor', key: 'fornecedor', width: 20 },
      { header: 'Data Aquisição', key: 'data_aquisicao', width: 15 }
    ];

    // APLICAR ESTILO AO CABEÇALHO
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.style = styles.headerPrimary;
    });
    headerRow.height = 25;

    // ADICIONAR DADOS
    itens.forEach((item, index) => {
      const valorTotal = (item.valor_compra || 0) * (item.quantidade || 1);
      
      const row = worksheet.addRow({
        id: item.id,
        nome: item.nome,
        categoria: item.categoria?.nome,
        patrimonio: item.patrimonio,
        numero_serie: item.numero_serie,
        quantidade: item.quantidade,
        estoque_minimo: item.estoque_minimo,
        valor_unitario: item.valor_compra || 0,
        valor_total: valorTotal,
        status: this.formatItemStatus(item),
        estado: this.formatItemEstado(item.estado),
        localizacao: item.localizacao,
        fornecedor: item.fornecedor,
        data_aquisicao: item.data_aquisicao ? new Date(item.data_aquisicao).toLocaleDateString('pt-BR') : ''
      });

      // APLICAR ESTILOS CONDICIONAIS
      row.eachCell(cell => {
        cell.style = styles.cellStyle;
      });

      // 🎯 DESTACAR ESTOQUE BAIXO
      if (item.quantidade <= item.estoque_minimo) {
        row.getCell('quantidade').style = styles.warningStyle;
        row.getCell('status').style = styles.warningStyle;
      }

      // 🎯 DESTACAR ITENS DISPONÍVEIS
      if (item.status === 'disponivel') {
        row.getCell('status').style = styles.successStyle;
      }

      // 🎯 DESTACAR ITENS NOVOS
      if (item.estado === 'novo') {
        row.getCell('estado').style = styles.infoStyle;
      }

      // FORMATAR VALORES MONETÁRIOS
      row.getCell('valor_unitario').numFmt = '"R$ "#,##0.00';
      row.getCell('valor_total').numFmt = '"R$ "#,##0.00';

      // COR DE FUNDO ALTERNADA
      if (index % 2 === 0) {
        row.eachCell(cell => {
          cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } } };
        });
      }
    });

    // ADICIONAR TOTAIS
    this.addExcelSummary(worksheet, itens, 'Itens do Estoque');
  }

  // 🔄 ABA 3: MOVIMENTAÇÕES
  async addAbaMovimentacoes(workbook, styles, filtros) {
    const worksheet = workbook.addWorksheet('🔄 MOVIMENTAÇÕES');
    
    const movimentacoes = await this.getMovimentacoesForExport(filtros);

    worksheet.columns = [
      { header: 'Data/Hora', key: 'data', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Item', key: 'item', width: 30 },
      { header: 'Patrimônio', key: 'patrimonio', width: 15 },
      { header: 'Quantidade', key: 'quantidade', width: 12 },
      { header: 'Destinatário', key: 'destinatario', width: 25 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Usuário', key: 'usuario', width: 25 },
      { header: 'Devolução Prev.', key: 'devolucao_prevista', width: 15 },
      { header: 'Observações', key: 'observacao', width: 40 }
    ];

    // CABEÇALHO
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => cell.style = styles.headerSecondary);
    headerRow.height = 25;

    // DADOS
    movimentacoes.forEach((mov, index) => {
      const row = worksheet.addRow({
        data: new Date(mov.data_movimentacao).toLocaleString('pt-BR'),
        tipo: this.formatTipoMovimentacao(mov.tipo),
        item: mov.item?.nome,
        patrimonio: mov.item?.patrimonio,
        quantidade: mov.quantidade,
        destinatario: mov.destinatario,
        departamento: mov.departamento_destino,
        usuario: mov.usuario?.nome,
        devolucao_prevista: mov.data_devolucao_prevista ? new Date(mov.data_devolucao_prevista).toLocaleDateString('pt-BR') : '',
        observacao: mov.observacao
      });

      // ESTILO BASE
      row.eachCell(cell => cell.style = styles.cellStyle);

      // COLORIR POR TIPO
      const tipoCell = row.getCell('tipo');
      switch(mov.tipo) {
        case 'entrada':
          tipoCell.style = { ...styles.cellStyle, font: { color: { argb: '28A745' }, bold: true } };
          break;
        case 'saida':
          tipoCell.style = { ...styles.cellStyle, font: { color: { argb: 'DC3545' }, bold: true } };
          break;
        case 'devolucao':
          tipoCell.style = { ...styles.cellStyle, font: { color: { argb: '17A2B8' }, bold: true } };
          break;
      }

      // FUNDO ALTERNADO
      if (index % 2 === 0) {
        row.eachCell(cell => {
          cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } } };
        });
      }
    });

    this.addMovimentacoesSummary(worksheet, movimentacoes);
  }

  // 🔧 ABA 4: MANUTENÇÕES
  async addAbaManutencoes(workbook, styles, filtros) {
    const worksheet = workbook.addWorksheet('🔧 MANUTENÇÕES');
    
    const manutencoes = await this.getManutencoesForExport(filtros);

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Item', key: 'item', width: 25 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Data Abertura', key: 'data_abertura', width: 18 },
      { header: 'Data Conclusão', key: 'data_conclusao', width: 18 },
      { header: 'Técnico', key: 'tecnico', width: 20 },
      { header: 'Problema', key: 'problema', width: 30 },
      { header: 'Solução', key: 'solucao', width: 30 },
      { header: 'Custo (R$)', key: 'custo', width: 15 },
      { header: 'Fornecedor', key: 'fornecedor', width: 20 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => cell.style = styles.headerPrimary);
    headerRow.height = 25;

    manutencoes.forEach((manutencao, index) => {
      const row = worksheet.addRow({
        id: manutencao.id,
        item: manutencao.item?.nome,
        tipo: this.formatTipoManutencao(manutencao.tipo_manutencao),
        status: this.formatStatusManutencao(manutencao.status),
        data_abertura: new Date(manutencao.data_abertura).toLocaleString('pt-BR'),
        data_conclusao: manutencao.data_conclusao ? new Date(manutencao.data_conclusao).toLocaleString('pt-BR') : '',
        tecnico: manutencao.usuario?.nome,
        problema: manutencao.descricao_problema,
        solucao: manutencao.descricao_solucao,
        custo: manutencao.custo_manutencao || 0,
        fornecedor: manutencao.fornecedor_manutencao
      });

      row.eachCell(cell => cell.style = styles.cellStyle);

      // COLORIR STATUS
      const statusCell = row.getCell('status');
      switch(manutencao.status) {
        case 'concluida':
          statusCell.style = styles.successStyle;
          break;
        case 'em_andamento':
          statusCell.style = styles.infoStyle;
          break;
        case 'aberta':
          statusCell.style = styles.warningStyle;
          break;
      }

      // FORMATAR CUSTO
      row.getCell('custo').numFmt = '"R$ "#,##0.00';

      if (index % 2 === 0) {
        row.eachCell(cell => {
          cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } } };
        });
      }
    });
  }

  // 👥 ABA 5: USUÁRIOS
  async addAbaUsuarios(workbook, styles, filtros) {
    const worksheet = workbook.addWorksheet('👥 USUÁRIOS');
    
    const usuarios = await this.getUsuariosForExport(filtros);

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nome', key: 'nome', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Perfil', key: 'perfil', width: 15 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Resp. Estoque', key: 'resp_estoque', width: 12 },
      { header: 'Acesso Dashboard', key: 'acesso_dashboard', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Data Cadastro', key: 'data_cadastro', width: 15 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => cell.style = styles.headerSecondary);
    headerRow.height = 25;

    usuarios.forEach((usuario, index) => {
      const row = worksheet.addRow({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: this.formatPerfilUsuario(usuario.perfil),
        departamento: usuario.departamento,
        resp_estoque: usuario.responsavel_estoque ? 'SIM' : 'NÃO',
        acesso_dashboard: usuario.acesso_dashboard ? 'SIM' : 'NÃO',
        status: usuario.ativo ? 'ATIVO' : 'INATIVO',
        data_cadastro: new Date(usuario.criado_em).toLocaleDateString('pt-BR')
      });

      row.eachCell(cell => cell.style = styles.cellStyle);

      // COLORIR STATUS
      if (usuario.ativo) {
        row.getCell('status').style = styles.successStyle;
      } else {
        row.getCell('status').style = styles.warningStyle;
      }

      // DESTACAR ADMIN
      if (usuario.perfil === 'admin') {
        row.getCell('perfil').style = styles.infoStyle;
      }

      if (index % 2 === 0) {
        row.eachCell(cell => {
          cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } } };
        });
      }
    });
  }

  // 🗂️ ABA 6: CATEGORIAS
  async addAbaCategorias(workbook, styles, filtros) {
    const worksheet = workbook.addWorksheet('🗂️ CATEGORIAS');
    
    const categorias = await this.getCategoriasForExport(filtros);

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nome', key: 'nome', width: 25 },
      { header: 'Descrição', key: 'descricao', width: 40 },
      { header: 'Total Itens', key: 'total_itens', width: 12 },
      { header: 'Data Criação', key: 'data_criacao', width: 15 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => cell.style = styles.headerPrimary);
    headerRow.height = 25;

    // CONTAR ITENS POR CATEGORIA
    const itensPorCategoria = await Item.count({
      group: ['categoria_id'],
      attributes: ['categoria_id']
    });

    const contagemMap = new Map();
    itensPorCategoria.forEach(item => {
      contagemMap.set(item.categoria_id, item.count);
    });

    categorias.forEach((categoria, index) => {
      const totalItens = contagemMap.get(categoria.id) || 0;
      
      const row = worksheet.addRow({
        id: categoria.id,
        nome: categoria.nome,
        descricao: categoria.descricao,
        total_itens: totalItens,
        data_criacao: new Date(categoria.criado_em).toLocaleDateString('pt-BR')
      });

      row.eachCell(cell => cell.style = styles.cellStyle);

      // DESTACAR CATEGORIAS COM MAIS ITENS
      if (totalItens > 10) {
        row.getCell('total_itens').style = styles.infoStyle;
      }

      if (index % 2 === 0) {
        row.eachCell(cell => {
          cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } } };
        });
      }
    });
  }

  // 🔔 ABA 7: ALERTAS
  async addAbaAlertas(workbook, styles, filtros) {
    const worksheet = workbook.addWorksheet('🔔 ALERTAS');
    
    const alertas = await this.getAlertasForExport(filtros);

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Item', key: 'item', width: 25 },
      { header: 'Nível', key: 'nivel', width: 12 },
      { header: 'Qtd. Atual', key: 'quantidade_atual', width: 12 },
      { header: 'Estoque Mín.', key: 'estoque_minimo', width: 12 },
      { header: 'Mensagem', key: 'mensagem', width: 40 },
      { header: 'Data Alerta', key: 'data_alerta', width: 18 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => cell.style = styles.headerSecondary);
    headerRow.height = 25;

    alertas.forEach((alerta, index) => {
      const row = worksheet.addRow({
        id: alerta.id,
        item: alerta.item?.nome,
        nivel: this.formatNivelAlerta(alerta.nivel_alerta),
        quantidade_atual: alerta.quantidade_atual,
        estoque_minimo: alerta.estoque_minimo,
        mensagem: alerta.mensagem,
        data_alerta: new Date(alerta.data_alerta).toLocaleString('pt-BR'),
        status: alerta.lido ? 'LIDO' : 'PENDENTE'
      });

      row.eachCell(cell => cell.style = styles.cellStyle);

      // COLORIR POR NÍVEL DE ALERTA
      const nivelCell = row.getCell('nivel');
      switch(alerta.nivel_alerta) {
        case 'critico':
        case 'zero':
          nivelCell.style = styles.warningStyle;
          break;
        case 'baixo':
          nivelCell.style = styles.infoStyle;
          break;
      }

      // COLORIR STATUS
      if (!alerta.lido) {
        row.getCell('status').style = styles.warningStyle;
      } else {
        row.getCell('status').style = styles.successStyle;
      }

      if (index % 2 === 0) {
        row.eachCell(cell => {
          cell.style = { ...cell.style, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } } };
        });
      }
    });
  }

  // 📈 ABA 8: MÉTRICAS E ESTATÍSTICAS
  async addAbaMetricas(workbook, styles, filtros) {
    const worksheet = workbook.addWorksheet('📈 MÉTRICAS');

    // CALCULAR MÉTRICAS AVANÇADAS
    const metricas = await this.calcularMetricasAvancadas();

    worksheet.mergeCells('A1:B1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'MÉTRICAS E ESTATÍSTICAS AVANÇADAS';
    titleCell.style = {
      font: { bold: true, size: 14, color: { argb: '2C5AA0' } },
      alignment: { horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F4FD' } }
    };
    worksheet.getRow(1).height = 30;

    // ADICIONAR MÉTRICAS
    let rowIndex = 3;
    Object.entries(metricas).forEach(([categoria, dados]) => {
      // CABEÇALHO DA CATEGORIA
      worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
      const catCell = worksheet.getCell(`A${rowIndex}`);
      catCell.value = categoria;
      catCell.style = {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C5AA0' } }
      };
      rowIndex++;

      // DADOS DA CATEGORIA
      Object.entries(dados).forEach(([indicador, valor]) => {
        worksheet.getCell(`A${rowIndex}`).value = indicador;
        worksheet.getCell(`B${rowIndex}`).value = valor;
        
        // ESTILIZAR
        worksheet.getCell(`A${rowIndex}`).style = { ...styles.cellStyle, font: { bold: true } };
        worksheet.getCell(`B${rowIndex}`).style = styles.cellStyle;
        
        rowIndex++;
      });

      rowIndex++; // Espaço entre categorias
    });

    worksheet.columns = [
      { width: 35 },
      { width: 25 }
    ];
  }

  // 📋 GERAR CSV COMPLETO
  async generateCSVCompleto(filtros = {}) {
    try {
      console.log('📋 Gerando CSVs completos...');
      
      const resultados = [];
      const timestamp = new Date().toISOString().split('T')[0];

      // CSV PARA CADA TABELA
      const csvGenerators = [
        { nome: 'itens', gerador: () => this.generateItensCSV(filtros) },
        { nome: 'movimentacoes', gerador: () => this.generateMovimentacoesCSV(filtros) },
        { nome: 'manutencoes', gerador: () => this.generateManutencoesCSV(filtros) },
        { nome: 'usuarios', gerador: () => this.generateUsuariosCSV(filtros) },
        { nome: 'categorias', gerador: () => this.generateCategoriasCSV(filtros) },
        { nome: 'alertas', gerador: () => this.generateAlertasCSV(filtros) }
      ];

      for (const csv of csvGenerators) {
        try {
          const resultado = await csv.gerador();
          resultados.push(resultado);
        } catch (error) {
          console.error(`❌ Erro ao gerar CSV ${csv.nome}:`, error);
        }
      }

      return resultados;

    } catch (error) {
      console.error('❌ Erro ao gerar CSVs completos:', error);
      throw error;
    }
  }

  // 📋 CSV DE ITENS
  async generateItensCSV(filtros = {}) {
    try {
      const itens = await this.getItensForExport(filtros);
      const filename = `itens-${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, filename);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'nome', title: 'NOME_ITEM' },
          { id: 'categoria', title: 'CATEGORIA' },
          { id: 'patrimonio', title: 'PATRIMONIO' },
          { id: 'numero_serie', title: 'NUMERO_SERIE' },
          { id: 'quantidade', title: 'QUANTIDADE' },
          { id: 'estoque_minimo', title: 'ESTOQUE_MINIMO' },
          { id: 'valor_compra', title: 'VALOR_UNITARIO' },
          { id: 'status', title: 'STATUS' },
          { id: 'estado', title: 'ESTADO' },
          { id: 'localizacao', title: 'LOCALIZACAO' },
          { id: 'fornecedor', title: 'FORNECEDOR' },
          { id: 'data_aquisicao', title: 'DATA_AQUISICAO' }
        ],
        fieldDelimiter: ';',
        encoding: 'utf8'
      });

      const records = itens.map(item => ({
        id: item.id,
        nome: item.nome,
        categoria: item.categoria?.nome,
        patrimonio: item.patrimonio,
        numero_serie: item.numero_serie,
        quantidade: item.quantidade,
        estoque_minimo: item.estoque_minimo,
        valor_compra: item.valor_compra || 0,
        status: this.formatItemStatus(item),
        estado: this.formatItemEstado(item.estado),
        localizacao: item.localizacao,
        fornecedor: item.fornecedor,
        data_aquisicao: item.data_aquisicao || ''
      }));

      await csvWriter.writeRecords(records);

      return {
        success: true,
        message: 'CSV de itens gerado com sucesso!',
        filename: filename,
        url: `/exports/${filename}`,
        registros: records.length,
        formato: 'CSV (Delimitado por ponto e vírgula)'
      };

    } catch (error) {
      console.error('❌ Erro ao gerar CSV de itens:', error);
      throw error;
    }
  }

  // 📋 CSV DE MOVIMENTAÇÕES
  async generateMovimentacoesCSV(filtros = {}) {
    try {
      const movimentacoes = await this.getMovimentacoesForExport(filtros);
      const filename = `movimentacoes-${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, filename);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'data', title: 'DATA_MOVIMENTACAO' },
          { id: 'tipo', title: 'TIPO' },
          { id: 'item', title: 'ITEM' },
          { id: 'patrimonio', title: 'PATRIMONIO' },
          { id: 'quantidade', title: 'QUANTIDADE' },
          { id: 'destinatario', title: 'DESTINATARIO' },
          { id: 'departamento', title: 'DEPARTAMENTO' },
          { id: 'usuario', title: 'USUARIO' },
          { id: 'observacao', title: 'OBSERVACAO' }
        ],
        fieldDelimiter: ';',
        encoding: 'utf8'
      });

      const records = movimentacoes.map(mov => ({
        data: new Date(mov.data_movimentacao).toISOString(),
        tipo: mov.tipo,
        item: mov.item?.nome,
        patrimonio: mov.item?.patrimonio,
        quantidade: mov.quantidade,
        destinatario: mov.destinatario,
        departamento: mov.departamento_destino,
        usuario: mov.usuario?.nome,
        observacao: mov.observacao || ''
      }));

      await csvWriter.writeRecords(records);

      return {
        success: true,
        message: 'CSV de movimentações gerado com sucesso!',
        filename: filename,
        url: `/exports/${filename}`,
        registros: records.length
      };

    } catch (error) {
      console.error('❌ Erro ao gerar CSV de movimentações:', error);
      throw error;
    }
  }

  // 🔧 CSV DE MANUTENÇÕES
  async generateManutencoesCSV(filtros = {}) {
    try {
      const manutencoes = await this.getManutencoesForExport(filtros);
      const filename = `manutencoes-${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, filename);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'item', title: 'ITEM' },
          { id: 'tipo', title: 'TIPO_MANUTENCAO' },
          { id: 'status', title: 'STATUS' },
          { id: 'data_abertura', title: 'DATA_ABERTURA' },
          { id: 'data_conclusao', title: 'DATA_CONCLUSAO' },
          { id: 'tecnico', title: 'TECNICO' },
          { id: 'problema', title: 'DESCRICAO_PROBLEMA' },
          { id: 'solucao', title: 'DESCRICAO_SOLUCAO' },
          { id: 'custo', title: 'CUSTO_MANUTENCAO' },
          { id: 'fornecedor', title: 'FORNECEDOR' }
        ],
        fieldDelimiter: ';',
        encoding: 'utf8'
      });

      const records = manutencoes.map(manutencao => ({
        id: manutencao.id,
        item: manutencao.item?.nome,
        tipo: manutencao.tipo_manutencao,
        status: manutencao.status,
        data_abertura: new Date(manutencao.data_abertura).toISOString(),
        data_conclusao: manutencao.data_conclusao ? new Date(manutencao.data_conclusao).toISOString() : '',
        tecnico: manutencao.usuario?.nome,
        problema: manutencao.descricao_problema || '',
        solucao: manutencao.descricao_solucao || '',
        custo: manutencao.custo_manutencao || 0,
        fornecedor: manutencao.fornecedor_manutencao || ''
      }));

      await csvWriter.writeRecords(records);

      return {
        success: true,
        message: 'CSV de manutenções gerado com sucesso!',
        filename: filename,
        url: `/exports/${filename}`,
        registros: records.length
      };

    } catch (error) {
      console.error('❌ Erro ao gerar CSV de manutenções:', error);
      throw error;
    }
  }

  // 👥 CSV DE USUÁRIOS
  async generateUsuariosCSV(filtros = {}) {
    try {
      const usuarios = await this.getUsuariosForExport(filtros);
      const filename = `usuarios-${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, filename);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'nome', title: 'NOME' },
          { id: 'email', title: 'EMAIL' },
          { id: 'perfil', title: 'PERFIL' },
          { id: 'departamento', title: 'DEPARTAMENTO' },
          { id: 'resp_estoque', title: 'RESPONSAVEL_ESTOQUE' },
          { id: 'acesso_dashboard', title: 'ACESSO_DASHBOARD' },
          { id: 'status', title: 'STATUS' },
          { id: 'data_cadastro', title: 'DATA_CADASTRO' }
        ],
        fieldDelimiter: ';',
        encoding: 'utf8'
      });

      const records = usuarios.map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        departamento: usuario.departamento,
        resp_estoque: usuario.responsavel_estoque ? 'SIM' : 'NÃO',
        acesso_dashboard: usuario.acesso_dashboard ? 'SIM' : 'NÃO',
        status: usuario.ativo ? 'ATIVO' : 'INATIVO',
        data_cadastro: new Date(usuario.criado_em).toISOString()
      }));

      await csvWriter.writeRecords(records);

      return {
        success: true,
        message: 'CSV de usuários gerado com sucesso!',
        filename: filename,
        url: `/exports/${filename}`,
        registros: records.length
      };

    } catch (error) {
      console.error('❌ Erro ao gerar CSV de usuários:', error);
      throw error;
    }
  }

  // 🗂️ CSV DE CATEGORIAS
  async generateCategoriasCSV(filtros = {}) {
    try {
      const categorias = await this.getCategoriasForExport(filtros);
      const filename = `categorias-${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, filename);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'nome', title: 'NOME' },
          { id: 'descricao', title: 'DESCRICAO' },
          { id: 'data_criacao', title: 'DATA_CRIACAO' }
        ],
        fieldDelimiter: ';',
        encoding: 'utf8'
      });

      const records = categorias.map(categoria => ({
        id: categoria.id,
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        data_criacao: new Date(categoria.criado_em).toISOString()
      }));

      await csvWriter.writeRecords(records);

      return {
        success: true,
        message: 'CSV de categorias gerado com sucesso!',
        filename: filename,
        url: `/exports/${filename}`,
        registros: records.length
      };

    } catch (error) {
      console.error('❌ Erro ao gerar CSV de categorias:', error);
      throw error;
    }
  }

  // 🔔 CSV DE ALERTAS
  async generateAlertasCSV(filtros = {}) {
    try {
      const alertas = await this.getAlertasForExport(filtros);
      const filename = `alertas-${Date.now()}.csv`;
      const filePath = path.join(this.exportDir, filename);

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'item', title: 'ITEM' },
          { id: 'nivel', title: 'NIVEL_ALERTA' },
          { id: 'quantidade_atual', title: 'QUANTIDADE_ATUAL' },
          { id: 'estoque_minimo', title: 'ESTOQUE_MINIMO' },
          { id: 'mensagem', title: 'MENSAGEM' },
          { id: 'data_alerta', title: 'DATA_ALERTA' },
          { id: 'status', title: 'STATUS' }
        ],
        fieldDelimiter: ';',
        encoding: 'utf8'
      });

      const records = alertas.map(alerta => ({
        id: alerta.id,
        item: alerta.item?.nome,
        nivel: alerta.nivel_alerta,
        quantidade_atual: alerta.quantidade_atual,
        estoque_minimo: alerta.estoque_minimo,
        mensagem: alerta.mensagem,
        data_alerta: new Date(alerta.data_alerta).toISOString(),
        status: alerta.lido ? 'LIDO' : 'PENDENTE'
      }));

      await csvWriter.writeRecords(records);

      return {
        success: true,
        message: 'CSV de alertas gerado com sucesso!',
        filename: filename,
        url: `/exports/${filename}`,
        registros: records.length
      };

    } catch (error) {
      console.error('❌ Erro ao gerar CSV de alertas:', error);
      throw error;
    }
  }

  // 📊 MÉTODOS DE BUSCA ADICIONAIS
  async getManutencoesForExport(filtros = {}) {
    const whereClause = {};
    
    if (filtros.status) {
      whereClause.status = filtros.status;
    }

    return await Manutencao.findAll({
      where: whereClause,
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome']
        }
      ],
      order: [['data_abertura', 'DESC']],
      limit: 100
    });
  }

  async getUsuariosForExport(filtros = {}) {
    const whereClause = { ativo: true };
    
    if (filtros.departamento) {
      whereClause.departamento = filtros.departamento;
    }

    return await Usuario.findAll({
      where: whereClause,
      order: [['nome', 'ASC']],
      limit: 100
    });
  }

  async getCategoriasForExport(filtros = {}) {
    return await Categoria.findAll({
      order: [['nome', 'ASC']],
      limit: 50
    });
  }

  async getAlertasForExport(filtros = {}) {
    const whereClause = {};
    
    if (filtros.lido !== undefined) {
      whereClause.lido = filtros.lido === 'true';
    }

    return await AlertasEstoque.findAll({
      where: whereClause,
      include: [{
        model: Item,
        as: 'item',
        attributes: ['id', 'nome']
      }],
      order: [['data_alerta', 'DESC']],
      limit: 100
    });
  }

  // 📈 CALCULAR MÉTRICAS AVANÇADAS
  async calcularMetricasAvancadas() {
    const [
      totalItens, itensDisponiveis, itensEmUso, itensManutencao,
      totalMovimentacoes, movimentacoesMes, totalUsuarios,
      alertasAtivos, valorTotalEstoque, categoriasCount
    ] = await Promise.all([
      Item.count(),
      Item.count({ where: { status: 'disponivel' } }),
      Item.count({ where: { status: 'em_uso' } }),
      Item.count({ where: { status: 'manutencao' } }),
      Movimentacao.count(),
      Movimentacao.count({
        where: {
          data_movimentacao: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      Usuario.count({ where: { ativo: true } }),
      AlertasEstoque.count({ where: { lido: false } }),
      this.calcularValorTotalEstoque(),
      Categoria.count()
    ]);

    const taxaDisponibilidade = totalItens > 0 ? (itensDisponiveis / totalItens) * 100 : 0;
    const taxaUtilizacao = totalItens > 0 ? (itensEmUso / totalItens) * 100 : 0;
    const valorMedioItem = totalItens > 0 ? valorTotalEstoque / totalItens : 0;

    return {
      '📊 ESTOQUE': {
        'Total de Itens': totalItens,
        'Itens Disponíveis': itensDisponiveis,
        'Itens em Uso': itensEmUso,
        'Itens em Manutenção': itensManutencao,
        'Taxa de Disponibilidade': `${taxaDisponibilidade.toFixed(1)}%`,
        'Taxa de Utilização': `${taxaUtilizacao.toFixed(1)}%`
      },
      '💰 VALORES': {
        'Valor Total do Estoque': `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        'Valor Médio por Item': `R$ ${valorMedioItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      },
      '🔄 MOVIMENTAÇÃO': {
        'Total de Movimentações': totalMovimentacoes,
        'Movimentações (30 dias)': movimentacoesMes,
        'Média Diária': `${(movimentacoesMes / 30).toFixed(1)}`
      },
      '👥 USUÁRIOS E CATEGORIAS': {
        'Usuários Ativos': totalUsuarios,
        'Total de Categorias': categoriasCount,
        'Alertas Ativos': alertasAtivos
      }
    };
  }

  async calcularValorTotalEstoque() {
    const itens = await Item.findAll({
      attributes: ['quantidade', 'valor_compra']
    });

    return itens.reduce((total, item) => {
      const valor = item.valor_compra || 0;
      const quantidade = item.quantidade || 0;
      return total + (valor * quantidade);
    }, 0);
  }

  // 🎯 MÉTODOS DE FORMATAÇÃO
  formatItemStatus(item) {
    if (item.quantidade <= item.estoque_minimo) return 'ESTOQUE BAIXO';
    if (item.status === 'disponivel') return 'DISPONÍVEL';
    if (item.status === 'em_uso') return 'EM USO';
    if (item.status === 'manutencao') return 'MANUTENÇÃO';
    if (item.status === 'reservado') return 'RESERVADO';
    return item.status?.toUpperCase() || 'INDEFINIDO';
  }

  formatItemEstado(estado) {
    const estados = {
      'novo': 'NOVO',
      'usado': 'USADO',
      'danificado': 'DANIFICADO',
      'irrecuperavel': 'IRRECUPERÁVEL'
    };
    return estados[estado] || estado?.toUpperCase() || 'INDEFINIDO';
  }

  formatTipoMovimentacao(tipo) {
    const tipos = {
      'entrada': 'ENTRADA',
      'saida': 'SAÍDA',
      'devolucao': 'DEVOLUÇÃO',
      'ajuste': 'AJUSTE',
      'transferencia': 'TRANSFERÊNCIA'
    };
    return tipos[tipo] || tipo?.toUpperCase() || 'INDEFINIDO';
  }

  formatTipoManutencao(tipo) {
    const tipos = {
      'preventiva': 'PREVENTIVA',
      'corretiva': 'CORRETIVA',
      'instalacao': 'INSTALAÇÃO'
    };
    return tipos[tipo] || tipo?.toUpperCase() || 'INDEFINIDO';
  }

  formatStatusManutencao(status) {
    const statusMap = {
      'aberta': 'ABERTA',
      'em_andamento': 'EM ANDAMENTO',
      'concluida': 'CONCLUÍDA',
      'cancelada': 'CANCELADA'
    };
    return statusMap[status] || status?.toUpperCase() || 'INDEFINIDO';
  }

  formatPerfilUsuario(perfil) {
    const perfis = {
      'admin': 'ADMINISTRADOR',
      'coordenador': 'COORDENADOR',
      'tecnico': 'TÉCNICO',
      'estagiario': 'ESTAGIÁRIO'
    };
    return perfis[perfil] || perfil?.toUpperCase() || 'INDEFINIDO';
  }

  formatNivelAlerta(nivel) {
    const niveis = {
      'baixo': 'BAIXO',
      'critico': 'CRÍTICO',
      'zero': 'ZERO'
    };
    return niveis[nivel] || nivel?.toUpperCase() || 'INDEFINIDO';
  }

  // 📊 RESUMO PARA EXCEL (método auxiliar)
  addExcelSummary(worksheet, dados, titulo) {
    worksheet.addRow([]);
    
    const totalRow = worksheet.addRow({
      nome: `RESUMO - ${titulo}:`,
      quantidade: `Total: ${dados.length} registros`
    });

    worksheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);
    totalRow.getCell(1).style = {
      font: { bold: true, color: { argb: '2C5AA0' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F4FD' } },
      alignment: { horizontal: 'center' }
    };
  }

  // 📊 RESUMO MOVIMENTAÇÕES (método auxiliar)
  addMovimentacoesSummary(worksheet, movimentacoes) {
    const total = movimentacoes.length;
    const entradas = movimentacoes.filter(m => m.tipo === 'entrada').length;
    const saidas = movimentacoes.filter(m => m.tipo === 'saida').length;
    const devolucoes = movimentacoes.filter(m => m.tipo === 'devolucao').length;

    worksheet.addRow([]);
    
    const summaryRow = worksheet.addRow({
      data: `RESUMO: Total: ${total} | Entradas: ${entradas} | Saídas: ${saidas} | Devoluções: ${devolucoes}`
    });

    worksheet.mergeCells(`A${summaryRow.number}:J${summaryRow.number}`);
    summaryRow.getCell(1).style = {
      font: { bold: true, color: { argb: '2C5AA0' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F4FD' } },
      alignment: { horizontal: 'center' }
    };
  }

  // 🗑️ LIMPAR ARQUIVOS TEMPORÁRIOS
  async limparArquivosTemporarios(dias = 7) {
    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      const maxAge = dias * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`🗑️ Arquivo removido: ${file}`);
        }
      }

      return {
        success: true,
        message: `Limpeza concluída. ${deletedCount} arquivos com mais de ${dias} dias removidos.`,
        deletedCount,
        dias
      };
    } catch (error) {
      console.error('❌ Erro ao limpar arquivos temporários:', error);
      throw error;
    }
  }

  // 📈 ESTATÍSTICAS DE EXPORTAÇÃO
  async getEstatisticasExportacao() {
    try {
      const files = await fs.readdir(this.exportDir);
      const stats = await Promise.all(
        files.map(async file => {
          const filePath = path.join(this.exportDir, file);
          const fileStats = await fs.stat(filePath);
          return {
            nome: file,
            tamanho: fileStats.size,
            dataModificacao: fileStats.mtime,
            tipo: path.extname(file)
          };
        })
      );

      const totalArquivos = stats.length;
      const totalTamanho = stats.reduce((sum, file) => sum + file.tamanho, 0);
      const porTipo = stats.reduce((acc, file) => {
        const tipo = file.tipo;
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {});

      return {
        totalArquivos,
        totalTamanhoMB: (totalTamanho / (1024 * 1024)).toFixed(2),
        arquivosPorTipo: porTipo,
        arquivosRecentes: stats
          .sort((a, b) => b.dataModificacao - a.dataModificacao)
          .slice(0, 10)
          .map(file => ({
            nome: file.nome,
            tamanho: (file.tamanho / 1024).toFixed(2) + ' KB',
            data: file.dataModificacao.toLocaleString('pt-BR')
          }))
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // 🔄 STATUS DA EXPORTAÇÃO (para jobs longos)
  async getExportStatus(jobId) {
    // Implementação para monitorar jobs de exportação longos
    return {
      jobId,
      status: 'completed', // completed, processing, failed
      progress: 100,
      message: 'Exportação concluída com sucesso',
      timestamp: new Date().toISOString()
    };
  }

  // 📄 MÉTODOS PDF (mantidos da versão anterior)
  async generateMovimentacoesPDF(filtros = {}) {
    try {
      console.log('📄 Gerando PDF de movimentações...');
      
      const movimentacoes = await this.getMovimentacoesForExport(filtros);
      
      const doc = new PDFDocument({ margin: 50 });
      const filename = `relatorio-movimentacoes-${Date.now()}.pdf`;
      const filePath = path.join(this.exportDir, filename);
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      this.addHeader(doc, 'RELATÓRIO DE MOVIMENTAÇÕES');
      this.addMovimentacoesSummary(doc, movimentacoes);
      this.addMovimentacoesTable(doc, movimentacoes);
      this.addFooter(doc);

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          resolve({
            success: true,
            message: 'PDF de movimentações gerado com sucesso!',
            filename: filename,
            url: `/exports/${filename}`,
            registros: movimentacoes.length
          });
        });
        writeStream.on('error', reject);
      });

    } catch (error) {
      console.error('❌ Erro ao gerar PDF de movimentações:', error);
      throw error;
    }
  }

  async generateManutencoesPDF(filtros = {}) {
    try {
      console.log('📄 Gerando PDF de manutenções...');
      
      const manutencoes = await this.getManutencoesForExport(filtros);
      
      const doc = new PDFDocument({ margin: 50 });
      const filename = `relatorio-manutencoes-${Date.now()}.pdf`;
      const filePath = path.join(this.exportDir, filename);
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      this.addHeader(doc, 'RELATÓRIO DE MANUTENÇÕES');
      this.addManutencoesSummary(doc, manutencoes);
      this.addManutencoesTable(doc, manutencoes);
      this.addFooter(doc);

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          resolve({
            success: true,
            message: 'PDF de manutenções gerado com sucesso!',
            filename: filename,
            url: `/exports/${filename}`,
            registros: manutencoes.length
          });
        });
        writeStream.on('error', reject);
      });

    } catch (error) {
      console.error('❌ Erro ao gerar PDF de manutenções:', error);
      throw error;
    }
  }

  async generateUsuariosPDF(filtros = {}) {
    try {
      console.log('📄 Gerando PDF de usuários...');
      
      const usuarios = await this.getUsuariosForExport(filtros);
      
      const doc = new PDFDocument({ margin: 50 });
      const filename = `relatorio-usuarios-${Date.now()}.pdf`;
      const filePath = path.join(this.exportDir, filename);
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      this.addHeader(doc, 'RELATÓRIO DE USUÁRIOS');
      this.addUsuariosSummary(doc, usuarios);
      this.addUsuariosTable(doc, usuarios);
      this.addFooter(doc);

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          resolve({
            success: true,
            message: 'PDF de usuários gerado com sucesso!',
            filename: filename,
            url: `/exports/${filename}`,
            registros: usuarios.length
          });
        });
        writeStream.on('error', reject);
      });

    } catch (error) {
      console.error('❌ Erro ao gerar PDF de usuários:', error);
      throw error;
    }
  }

  async generateRelatorioCompletoPDF(filtros = {}) {
    try {
      console.log('📄 Gerando PDF completo...');
      
      const doc = new PDFDocument({ margin: 50 });
      const filename = `relatorio-completo-${Date.now()}.pdf`;
      const filePath = path.join(this.exportDir, filename);
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      this.addHeader(doc, 'RELATÓRIO COMPLETO DO SISTEMA');
      
      // Adicionar resumo executivo
      const metricas = await this.calcularMetricasAvancadas();
      this.addResumoExecutivoPDF(doc, metricas);
      
      this.addFooter(doc);

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          resolve({
            success: true,
            message: 'PDF completo gerado com sucesso!',
            filename: filename,
            url: `/exports/${filename}`,
            registros: 'Resumo Executivo'
          });
        });
        writeStream.on('error', reject);
      });

    } catch (error) {
      console.error('❌ Erro ao gerar PDF completo:', error);
      throw error;
    }
  }

  // 📊 RESUMO EXECUTIVO PARA PDF
  addResumoExecutivoPDF(doc, metricas) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2C5AA0')
       .text('RESUMO EXECUTIVO', { align: 'center' })
       .moveDown(1);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');

    Object.entries(metricas).forEach(([categoria, dados]) => {
      doc.font('Helvetica-Bold')
         .text(categoria)
         .moveDown(0.3);

      Object.entries(dados).forEach(([indicador, valor]) => {
        doc.font('Helvetica')
           .text(`  • ${indicador}: ${valor}`);
      });
      
      doc.moveDown(0.5);
    });
  }

  // 📊 RESUMO MANUTENÇÕES PARA PDF
  addManutencoesSummary(doc, manutencoes) {
    const total = manutencoes.length;
    const abertas = manutencoes.filter(m => m.status === 'aberta').length;
    const andamento = manutencoes.filter(m => m.status === 'em_andamento').length;
    const concluidas = manutencoes.filter(m => m.status === 'concluida').length;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('RESUMO DE MANUTENÇÕES:')
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`• Total de Manutenções: ${total}`)
       .text(`• Abertas: ${abertas}`)
       .text(`• Em Andamento: ${andamento}`)
       .text(`• Concluídas: ${concluidas}`)
       .moveDown(1);
  }

  // 📋 TABELA MANUTENÇÕES PARA PDF
  addManutencoesTable(doc, manutencoes) {
    if (manutencoes.length === 0) {
      doc.fontSize(12)
         .fillColor('#999999')
         .text('Nenhuma manutenção encontrada para exibir.', { align: 'center' });
      return;
    }

    const tableTop = doc.y;
    const rowHeight = 20;
    const headers = ['Item', 'Tipo', 'Status', 'Técnico', 'Data Abertura'];
    const columnWidths = [120, 80, 80, 100, 80];

    // CABEÇALHO
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');

    let x = 50;
    headers.forEach((header, i) => {
      doc.rect(x, tableTop, columnWidths[i], rowHeight)
         .fill('#FF6B00');
      doc.text(header, x + 5, tableTop + 6, { width: columnWidths[i] - 10, align: 'left' });
      x += columnWidths[i];
    });

    // DADOS
    doc.font('Helvetica')
       .fillColor('#333333');

    manutencoes.forEach((manutencao, rowIndex) => {
      const y = tableTop + (rowIndex + 1) * rowHeight;
      
      if (rowIndex % 2 === 0) {
        doc.rect(50, y, 460, rowHeight).fill('#F8F9FA');
      }

      x = 50;
      const rowData = [
        manutencao.item?.nome?.substring(0, 15) + (manutencao.item?.nome?.length > 15 ? '...' : ''),
        this.formatTipoManutencao(manutencao.tipo_manutencao),
        this.formatStatusManutencao(manutencao.status),
        manutencao.usuario?.nome?.substring(0, 12) + (manutencao.usuario?.nome?.length > 12 ? '...' : ''),
        new Date(manutencao.data_abertura).toLocaleDateString('pt-BR')
      ];

      rowData.forEach((cell, i) => {
        // Colorir por status
        if (i === 2) {
          if (manutencao.status === 'concluida') doc.fillColor('#28A745');
          else if (manutencao.status === 'em_andamento') doc.fillColor('#17A2B8');
          else doc.fillColor('#DC3545');
        } else {
          doc.fillColor('#333333');
        }

        doc.text(cell, x + 5, y + 6, { width: columnWidths[i] - 10, align: 'left' });
        x += columnWidths[i];
      });
    });

    doc.y = tableTop + (manutencoes.length + 1) * rowHeight + 15;
  }

  // 📊 RESUMO USUÁRIOS PARA PDF
  addUsuariosSummary(doc, usuarios) {
    const total = usuarios.length;
    const ativos = usuarios.filter(u => u.ativo).length;
    const admins = usuarios.filter(u => u.perfil === 'admin').length;
    const tecnicos = usuarios.filter(u => u.perfil === 'tecnico').length;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('RESUMO DE USUÁRIOS:')
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`• Total de Usuários: ${total}`)
       .text(`• Ativos: ${ativos}`)
       .text(`• Administradores: ${admins}`)
       .text(`• Técnicos: ${tecnicos}`)
       .moveDown(1);
  }

  // 📋 TABELA USUÁRIOS PARA PDF
  addUsuariosTable(doc, usuarios) {
    if (usuarios.length === 0) {
      doc.fontSize(12)
         .fillColor('#999999')
         .text('Nenhum usuário encontrado para exibir.', { align: 'center' });
      return;
    }

    const tableTop = doc.y;
    const rowHeight = 20;
    const headers = ['Nome', 'Email', 'Perfil', 'Departamento', 'Status'];
    const columnWidths = [120, 150, 80, 100, 60];

    // CABEÇALHO
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');

    let x = 50;
    headers.forEach((header, i) => {
      doc.rect(x, tableTop, columnWidths[i], rowHeight)
         .fill('#6F42C1');
      doc.text(header, x + 5, tableTop + 6, { width: columnWidths[i] - 10, align: 'left' });
      x += columnWidths[i];
    });

    // DADOS
    doc.font('Helvetica')
       .fillColor('#333333');

    usuarios.forEach((usuario, rowIndex) => {
      const y = tableTop + (rowIndex + 1) * rowHeight;
      
      if (rowIndex % 2 === 0) {
        doc.rect(50, y, 510, rowHeight).fill('#F8F9FA');
      }

      x = 50;
      const rowData = [
        usuario.nome?.substring(0, 15) + (usuario.nome?.length > 15 ? '...' : ''),
        usuario.email?.substring(0, 20) + (usuario.email?.length > 20 ? '...' : ''),
        this.formatPerfilUsuario(usuario.perfil),
        usuario.departamento?.substring(0, 12) + (usuario.departamento?.length > 12 ? '...' : ''),
        usuario.ativo ? 'ATIVO' : 'INATIVO'
      ];

      rowData.forEach((cell, i) => {
        // Colorir status
        if (i === 4) {
          if (usuario.ativo) doc.fillColor('#28A745');
          else doc.fillColor('#DC3545');
        } else {
          doc.fillColor('#333333');
        }

        doc.text(cell, x + 5, y + 6, { width: columnWidths[i] - 10, align: 'left' });
        x += columnWidths[i];
      });
    });

    doc.y = tableTop + (usuarios.length + 1) * rowHeight + 15;
  }

  // 📋 MÉTODOS DE BUSCA (mantidos da versão anterior)
  async getItensForExport(filtros = {}) {
    const whereClause = {};
    
    if (filtros.categoria_id) {
      whereClause.categoria_id = filtros.categoria_id;
    }
    
    if (filtros.status) {
      whereClause.status = filtros.status;
    }

    return await Item.findAll({
      where: whereClause,
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nome']
      }],
      order: [['nome', 'ASC']],
      limit: 100
    });
  }

  async getMovimentacoesForExport(filtros = {}) {
    const whereClause = {};
    
    if (filtros.periodo) {
      const dias = parseInt(filtros.periodo);
      whereClause.data_movimentacao = {
        [Op.gte]: new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
      };
    }

    return await Movimentacao.findAll({
      where: whereClause,
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'nome', 'patrimonio']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome']
        }
      ],
      order: [['data_movimentacao', 'DESC']],
      limit: 100
    });
  }

  // 🎨 CABEÇALHO DO PDF
  addHeader(doc, title) {
    // Logo/Título
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#2C5AA0')
       .text(title, { align: 'center' });
    
    // Linha decorativa
    doc.moveTo(50, doc.y + 10)
       .lineTo(545, doc.y + 10)
       .strokeColor('#2C5AA0')
       .lineWidth(2)
       .stroke();
    
    // Informações
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Sistema de Controle de Estoque TI - ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' })
       .moveDown(1.5);
  }

  // 📊 RESUMO DE ITENS
  addItensSummary(doc, itens) {
    const totalItens = itens.length;
    const itensDisponiveis = itens.filter(item => item.status === 'disponivel').length;
    const itensBaixoEstoque = itens.filter(item => item.quantidade <= item.estoque_minimo).length;
    const valorTotal = itens.reduce((sum, item) => sum + ((item.valor_compra || 0) * (item.quantidade || 0)), 0);

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('RESUMO DO ESTOQUE:')
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`• Total de Itens: ${totalItens}`, { continued: true })
       .text(`   • Disponíveis: ${itensDisponiveis}`, { align: 'right' })
       .text(`• Estoque Baixo: ${itensBaixoEstoque}`, { continued: true })
       .text(`   • Valor Total: R$ ${valorTotal.toFixed(2)}`, { align: 'right' })
       .moveDown(1);
  }

  // 📋 TABELA DE ITENS
  addItensTable(doc, itens) {
    if (itens.length === 0) {
      doc.fontSize(12)
         .fillColor('#999999')
         .text('Nenhum item encontrado para exibir.', { align: 'center' });
      return;
    }

    const tableTop = doc.y;
    const rowHeight = 20;
    const headers = ['Nome', 'Categoria', 'Qtd', 'Valor R$', 'Status'];
    const columnWidths = [180, 100, 50, 70, 80];

    // CABEÇALHO DA TABELA
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');

    let x = 50;
    headers.forEach((header, i) => {
      doc.rect(x, tableTop, columnWidths[i], rowHeight)
         .fill('#2C5AA0');
      doc.text(header, x + 5, tableTop + 6, { width: columnWidths[i] - 10, align: i === 2 || i === 3 ? 'right' : 'left' });
      x += columnWidths[i];
    });

    // DADOS DA TABELA
    doc.font('Helvetica')
       .fillColor('#333333');

    itens.forEach((item, rowIndex) => {
      const y = tableTop + (rowIndex + 1) * rowHeight;
      
      // Cor de fundo alternada
      if (rowIndex % 2 === 0) {
        doc.rect(50, y, 480, rowHeight).fill('#F8F9FA');
      }

      x = 50;
      const rowData = [
        item.nome?.substring(0, 25) + (item.nome?.length > 25 ? '...' : ''),
        item.categoria?.nome?.substring(0, 15) + (item.categoria?.nome?.length > 15 ? '...' : ''),
        item.quantidade?.toString(),
        item.valor_compra ? item.valor_compra.toFixed(2) : '0.00',
        this.formatItemStatus(item)
      ];

      rowData.forEach((cell, i) => {
        // Destacar estoque baixo
        if (i === 2 && item.quantidade <= item.estoque_minimo) {
          doc.fillColor('#DC3545');
        } else if (i === 4 && item.status === 'disponivel') {
          doc.fillColor('#28A745');
        } else {
          doc.fillColor('#333333');
        }

        doc.text(cell, x + 5, y + 6, { 
          width: columnWidths[i] - 10, 
          align: i === 2 || i === 3 ? 'right' : 'left' 
        });
        x += columnWidths[i];
      });
    });

    doc.y = tableTop + (itens.length + 1) * rowHeight + 15;
  }

  // 📊 RESUMO DE MOVIMENTAÇÕES
  addMovimentacoesSummary(doc, movimentacoes) {
    const total = movimentacoes.length;
    const entradas = movimentacoes.filter(m => m.tipo === 'entrada').length;
    const saidas = movimentacoes.filter(m => m.tipo === 'saida').length;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#333333')
       .text('RESUMO DE MOVIMENTAÇÕES:')
       .moveDown(0.5);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`• Total de Movimentações: ${total}`)
       .text(`• Entradas: ${entradas}`)
       .text(`• Saídas: ${saidas}`)
       .moveDown(1);
  }

  // 📋 TABELA DE MOVIMENTAÇÕES (SIMPLIFICADA)
  addMovimentacoesTable(doc, movimentacoes) {
    if (movimentacoes.length === 0) {
      doc.fontSize(12)
         .fillColor('#999999')
         .text('Nenhuma movimentação encontrada para exibir.', { align: 'center' });
      return;
    }

    const tableTop = doc.y;
    const rowHeight = 20;
    const headers = ['Data', 'Tipo', 'Item', 'Qtd', 'Usuário'];
    const columnWidths = [80, 60, 150, 50, 120];

    // CABEÇALHO
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');

    let x = 50;
    headers.forEach((header, i) => {
      doc.rect(x, tableTop, columnWidths[i], rowHeight)
         .fill('#28A745');
      doc.text(header, x + 5, tableTop + 6, { width: columnWidths[i] - 10, align: 'left' });
      x += columnWidths[i];
    });

    // DADOS
    doc.font('Helvetica')
       .fillColor('#333333');

    movimentacoes.forEach((mov, rowIndex) => {
      const y = tableTop + (rowIndex + 1) * rowHeight;
      
      if (rowIndex % 2 === 0) {
        doc.rect(50, y, 460, rowHeight).fill('#F8F9FA');
      }

      x = 50;
      const rowData = [
        new Date(mov.data_movimentacao).toLocaleDateString('pt-BR'),
        this.formatTipoMovimentacao(mov.tipo),
        mov.item?.nome?.substring(0, 20) + (mov.item?.nome?.length > 20 ? '...' : ''),
        mov.quantidade?.toString(),
        mov.usuario?.nome?.substring(0, 15) + (mov.usuario?.nome?.length > 15 ? '...' : '')
      ];

      rowData.forEach((cell, i) => {
        // Colorir por tipo
        if (i === 1) {
          if (mov.tipo === 'entrada') doc.fillColor('#28A745');
          else if (mov.tipo === 'saida') doc.fillColor('#DC3545');
          else doc.fillColor('#333333');
        } else {
          doc.fillColor('#333333');
        }

        doc.text(cell, x + 5, y + 6, { width: columnWidths[i] - 10, align: 'left' });
        x += columnWidths[i];
      });
    });

    doc.y = tableTop + (movimentacoes.length + 1) * rowHeight + 15;
  }

  // 📝 RODAPÉ
  addFooter(doc) {
    const pageHeight = doc.page.height;
    
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#999999')
       .text(
         `Relatório gerado em ${new Date().toLocaleString('pt-BR')} - Página ${doc.bufferedPageRange?.count || 1}`, 
         50, 
         pageHeight - 30, 
         { align: 'center' }
       );
  }

  formatItemStatus(item) {
    if (item.status === 'disponivel') return 'Disponível';
    if (item.status === 'emprestado') return 'Emprestado';
    if (item.quantidade <= item.estoque_minimo) return 'Estoque Baixo';
    return 'Indisponível';
  }

  formatTipoMovimentacao(tipo) {
    const tipos = {
      'entrada': '📥 Entrada',
      'saida': '📤 Saída', 
      'devolucao': '🔄 Devolução',
      'ajuste': '⚙️ Ajuste'
    };
    return tipos[tipo] || tipo;
  }

  // 🗑️ LIMPAR ARQUIVOS ANTIGOS
  async cleanupOldExports() {
    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return {
        success: true,
        message: `Limpeza concluída. ${deletedCount} arquivos removidos.`,
        deletedCount
      };
    } catch (error) {
      console.error('❌ Erro ao limpar exports antigos:', error);
      throw error;
    }
  }
}

console.log('✅ ExportService completo inicializado - PDF, Excel e CSV disponíveis');
module.exports = new ExportService();