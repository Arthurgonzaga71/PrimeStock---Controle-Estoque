const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');

console.log('✅ exportRoutes carregado - com PDF, Excel e CSV');

// ✅ ROTA DE TESTE
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Export API com PDF, Excel e CSV funcionando!',
    status: '🟢 Online',
    endpoints: {
      pdf: 'POST /export/pdf',
      excel: 'POST /export/excel', 
      csv: 'POST /export/csv',
      completo: 'POST /export/completo',
      data: 'GET /export/data/:tipo',
      health: 'GET /export/health'
    }
  });
});

// 📄 GERAR PDF REAL
router.post('/pdf', async (req, res) => {
  try {
    const { tipo, filtros = {} } = req.body;

    console.log(`📄 Gerando PDF REAL para: ${tipo}`, filtros);

    if (!tipo) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de relatório é obrigatório'
      });
    }

    let result;
    switch (tipo) {
      case 'itens':
        result = await exportService.generateItensPDF(filtros);
        break;
      case 'movimentacoes':
        result = await exportService.generateMovimentacoesPDF(filtros);
        break;
      case 'manutencoes':
        result = await exportService.generateManutencoesPDF(filtros);
        break;
      case 'usuarios':
        result = await exportService.generateUsuariosPDF(filtros);
        break;
      case 'completo':
        result = await exportService.generateRelatorioCompletoPDF(filtros);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo não suportado. Use: itens, movimentacoes, manutencoes, usuarios ou completo'
        });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 📊 GERAR EXCEL COM MÚLTIPLAS ABAS
router.post('/excel', async (req, res) => {
  try {
    const { tipo, filtros = {} } = req.body;

    console.log(`📊 Gerando Excel para: ${tipo}`, filtros);

    if (!tipo) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de relatório é obrigatório'
      });
    }

    let result;
    switch (tipo) {
      case 'itens':
        result = await exportService.generateItensExcel(filtros);
        break;
      case 'movimentacoes':
        result = await exportService.generateMovimentacoesExcel(filtros);
        break;
      case 'manutencoes':
        result = await exportService.generateManutencoesExcel(filtros);
        break;
      case 'usuarios':
        result = await exportService.generateUsuariosExcel(filtros);
        break;
      case 'categorias':
        result = await exportService.generateCategoriasExcel(filtros);
        break;
      case 'alertas':
        result = await exportService.generateAlertasExcel(filtros);
        break;
      case 'completo':
        result = await exportService.generateRelatorioCompletoExcel(filtros);
        break;
      case 'dashboard':
        result = await exportService.generateDashboardExcel(filtros);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo não suportado. Use: itens, movimentacoes, manutencoes, usuarios, categorias, alertas, completo ou dashboard'
        });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao gerar Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 📋 GERAR CSV
router.post('/csv', async (req, res) => {
  try {
    const { tipo, filtros = {} } = req.body;

    console.log(`📋 Gerando CSV para: ${tipo}`, filtros);

    if (!tipo) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de relatório é obrigatório'
      });
    }

    let result;
    switch (tipo) {
      case 'itens':
        result = await exportService.generateItensCSV(filtros);
        break;
      case 'movimentacoes':
        result = await exportService.generateMovimentacoesCSV(filtros);
        break;
      case 'manutencoes':
        result = await exportService.generateManutencoesCSV(filtros);
        break;
      case 'usuarios':
        result = await exportService.generateUsuariosCSV(filtros);
        break;
      case 'categorias':
        result = await exportService.generateCategoriasCSV(filtros);
        break;
      case 'completo':
        result = await exportService.generateCSVCompleto(filtros);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo não suportado. Use: itens, movimentacoes, manutencoes, usuarios, categorias ou completo'
        });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao gerar CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🏗️ EXPORTAÇÃO COMPLETA DO SISTEMA
router.post('/completo', async (req, res) => {
  try {
    const { filtros = {}, formatos = ['excel'] } = req.body;

    console.log('🏗️ Iniciando exportação completa do sistema...', { filtros, formatos });

    const result = await exportService.exportacaoCompletaSistema(filtros, formatos);

    res.json(result);

  } catch (error) {
    console.error('❌ Erro na exportação completa:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📋 OBTER DADOS PARA EXPORTAÇÃO
router.get('/data/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const filtros = req.query;

    console.log(`📋 Buscando dados para exportação: ${tipo}`, filtros);

    let dados;
    switch (tipo) {
      case 'itens':
        dados = await exportService.getItensForExport(filtros);
        break;
      case 'movimentacoes':
        dados = await exportService.getMovimentacoesForExport(filtros);
        break;
      case 'manutencoes':
        dados = await exportService.getManutencoesForExport(filtros);
        break;
      case 'usuarios':
        dados = await exportService.getUsuariosForExport(filtros);
        break;
      case 'categorias':
        dados = await exportService.getCategoriasForExport(filtros);
        break;
      case 'alertas':
        dados = await exportService.getAlertasForExport(filtros);
        break;
      case 'dashboard':
        dados = await exportService.getDashboardDataForExport(filtros);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo não suportado. Use: itens, movimentacoes, manutencoes, usuarios, categorias, alertas ou dashboard'
        });
    }

    res.json({
      success: true,
      data: dados,
      total: Array.isArray(dados) ? dados.length : 0,
      tipo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao obter dados:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🗑️ LIMPAR ARQUIVOS TEMPORÁRIOS
router.delete('/limpar', async (req, res) => {
  try {
    const { dias = 7 } = req.query; // Limpar arquivos com mais de X dias

    console.log(`🗑️ Limpando arquivos temporários com mais de ${dias} dias...`);

    const result = await exportService.limparArquivosTemporarios(dias);

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao limpar arquivos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📈 ESTATÍSTICAS DE EXPORTAÇÃO
router.get('/estatisticas', async (req, res) => {
  try {
    console.log('📈 Buscando estatísticas de exportação...');

    const estatisticas = await exportService.getEstatisticasExportacao();

    res.json({
      success: true,
      ...estatisticas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔄 STATUS DA EXPORTAÇÃO
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    console.log(`🔄 Verificando status do job: ${jobId}`);

    const status = await exportService.getExportStatus(jobId);

    res.json({
      success: true,
      jobId,
      ...status
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🧪 HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Export API Completa',
    status: '🟢 Healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      '📄 PDF - Itens, Movimentações, Manutenções, Usuários, Completo',
      '📊 Excel - Todas as tabelas com múltiplas abas', 
      '📋 CSV - Exportação estruturada',
      '🏗️ Exportação Completa do Sistema',
      '📈 Estatísticas e Monitoramento',
      '🗑️ Limpeza Automática'
    ],
    endpoints: {
      pdf: 'POST /export/pdf',
      excel: 'POST /export/excel',
      csv: 'POST /export/csv', 
      completo: 'POST /export/completo',
      data: 'GET /export/data/:tipo',
      estatisticas: 'GET /export/estatisticas',
      limpar: 'DELETE /export/limpar',
      status: 'GET /export/status/:jobId',
      health: 'GET /export/health'
    }
  });
});

module.exports = router;