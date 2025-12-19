// 📁 backend/src/routes/backupRoutes.js - VERSÃO OTIMIZADA
const express = require('express');
const router = express.Router();
const backupService = require('../services/backupService');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// 🔒 Todas as rotas requerem autenticação (descomente se quiser)
// router.use(authMiddleware);

// ✅ ROTA PRINCIPAL - LISTAR BACKUPS
router.get('/', async (req, res) => {
  try {
    const result = await backupService.listBackups();
    
    if (result.success) {
      console.log(`📊 ${result.total} backups encontrados`);
      res.json(result);
    } else {
      console.error('❌ Erro ao listar backups:', result.error);
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao listar backups',
      error: error.message
    });
  }
});

// ✅ CRIAR BACKUP (COM AUTORIZAÇÃO ADMIN)
router.post('/create', /* authorize('admin'), */ async (req, res) => {
  try {
    const { usuarioId, tipo = 'completo' } = req.body;
    
    console.log(`🔄 Criando backup (tipo: ${tipo}, usuário: ${usuarioId || 'sistema'})`);
    
    const result = await backupService.createDatabaseBackup(usuarioId, tipo);
    
    if (result.success) {
      console.log(`✅ Backup criado: ${result.backup.nome}`);
      res.status(201).json(result);
    } else {
      console.error('❌ Falha ao criar backup:', result.message);
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao criar backup',
      error: error.message
    });
  }
});

// ✅ DOWNLOAD BACKUP
router.get('/download/:filename', /* authorize('admin'), */ async (req, res) => {
  try {
    const { filename } = req.params;
    
    console.log(`📥 Download solicitado: ${filename}`);
    
    const fileInfo = await backupService.getBackupForDownload(filename);
    
    res.download(fileInfo.path, filename, (err) => {
      if (err) {
        console.error('❌ Erro no download:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Erro ao fazer download do backup'
          });
        }
      } else {
        console.log(`✅ Download concluído: ${filename}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no download:', error);
    const status = error.message.includes('não encontrado') || error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ RESTAURAR BACKUP (NOVA FUNCIONALIDADE)
router.post('/restore/:filename', /* authorize('admin'), */ async (req, res) => {
  try {
    const { filename } = req.params;
    const { confirmar = false } = req.body;
    
    console.log(`🔄 Solicitação de restauração: ${filename}`);
    
    if (!confirmar) {
      return res.status(400).json({
        success: false,
        message: 'Confirmação necessária para restaurar backup',
        instrucao: 'Envie { "confirmar": true } no body para confirmar a restauração',
        aviso: '⚠️ Esta operação irá SOBRESCREVER todos os dados atuais do banco!'
      });
    }
    
    const result = await backupService.restoreBackup(filename);
    
    if (result.success) {
      console.log(`✅ Backup restaurado: ${filename}`);
      res.json(result);
    } else {
      console.error('❌ Falha ao restaurar:', result.error);
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao restaurar backup',
      error: error.message
    });
  }
});

// ✅ DELETAR BACKUP
router.delete('/:filename', /* authorize('admin'), */ async (req, res) => {
  try {
    const { filename } = req.params;
    
    console.log(`🗑️ Solicitação de exclusão: ${filename}`);
    
    const result = await backupService.deleteBackup(filename);
    
    if (result.success) {
      console.log(`✅ Backup deletado: ${filename}`);
      res.json(result);
    } else {
      console.error('❌ Falha ao deletar:', result.error);
      const status = result.error.includes('não encontrado') ? 404 : 500;
      res.status(status).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erro ao deletar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao deletar backup',
      error: error.message
    });
  }
});

// ✅ HEALTH CHECK DO SISTEMA DE BACKUP
router.get('/health', async (req, res) => {
  try {
    const health = await backupService.healthCheck();
    
    console.log('🔍 Health check do sistema de backup:', health.status);
    
    if (health.success) {
      res.json(health);
    } else {
      res.status(500).json(health);
    }
    
  } catch (error) {
    console.error('❌ Erro no health check:', error);
    res.status(500).json({
      success: false,
      status: 'erro_critico',
      message: 'Falha no health check do sistema',
      error: error.message
    });
  }
});

// ✅ LOGS DOS BACKUPS (NOVA FUNCIONALIDADE)
router.get('/logs', /* authorize('admin'), */ async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const logFile = path.join(__dirname, '../../backups/backup-logs.json');
    const fsSync = require('fs');
    
    if (!fsSync.existsSync(logFile)) {
      return res.json({
        success: true,
        logs: [],
        total: 0,
        message: 'Nenhum log de backup encontrado'
      });
    }
    
    const content = await fs.readFile(logFile, 'utf8');
    const logs = JSON.parse(content);
    
    console.log(`📋 ${logs.length} logs de backup encontrados`);
    
    res.json({
      success: true,
      logs: logs.reverse(), // Mostrar mais recentes primeiro
      total: logs.length,
      ultimoLog: logs[0] || null
    });
    
  } catch (error) {
    console.error('❌ Erro ao ler logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao ler logs de backup',
      error: error.message
    });
  }
});

// ✅ ROTA DE TESTE (VERIFICAÇÃO RÁPIDA)
router.get('/test', (req, res) => {
  console.log('🧪 Teste da rota de backup solicitado');
  
  res.json({ 
    success: true, 
    message: '✅ Rota de backup funcionando perfeitamente!',
    timestamp: new Date().toISOString(),
    sistema: 'Controle de Estoque TI',
    versao: '2.2.0',
    endpoints: {
      listar: 'GET /api/backup',
      criar: 'POST /api/backup/create',
      download: 'GET /api/backup/download/:filename',
      restaurar: 'POST /api/backup/restore/:filename',
      deletar: 'DELETE /api/backup/:filename',
      health: 'GET /api/backup/health',
      logs: 'GET /api/backup/logs',
      teste: 'GET /api/backup/test'
    },
    status: {
      banco: 'MySQL',
      backup_dir: '../../backups',
      max_backups: 7,
      compactacao: 'gzip automática'
    }
  });
});

// ✅ INFO DO SISTEMA DE BACKUP
router.get('/info', async (req, res) => {
  try {
    const health = await backupService.healthCheck();
    const { backups } = await backupService.listBackups();
    
    // Verificar espaço em disco
    const checkDiskSpace = async () => {
      try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        const { stdout } = await execPromise('df -h .');
        const lines = stdout.split('\n');
        const diskLine = lines[1];
        const parts = diskLine.split(/\s+/);
        
        return {
          total: parts[1],
          usado: parts[2],
          disponivel: parts[3],
          uso: parts[4]
        };
      } catch {
        return { erro: 'Não foi possível verificar espaço em disco' };
      }
    };
    
    const diskInfo = await checkDiskSpace();
    
    res.json({
      success: true,
      sistema: {
        nome: 'Sistema de Backup - Controle de Estoque TI',
        versao: '2.2.0',
        data_consulta: new Date().toISOString()
      },
      backups: {
        total: backups.length,
        ultimo: backups[0] || null,
        tamanho_total: backups.reduce((sum, b) => {
          const sizeMB = parseFloat(b.tamanho);
          return sum + (isNaN(sizeMB) ? 0 : sizeMB);
        }, 0).toFixed(2) + ' MB'
      },
      configuracoes: {
        max_backups: 7,
        diretorio: health.diretorio?.path || '../../backups',
        compactacao: 'gzip (.gz)',
        tipos_suportados: ['completo', 'diario', 'alternativo']
      },
      disco: diskInfo,
      status: health.status
    });
    
  } catch (error) {
    console.error('❌ Erro na info do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações do sistema',
      error: error.message
    });
  }
});

// ✅ LIMPAR BACKUPS ANTIGOS (MANUAL)
router.post('/limpar', /* authorize('admin'), */ async (req, res) => {
  try {
    const { manter = 7 } = req.body;
    
    console.log(`🧹 Limpeza manual solicitada (manter ${manter} backups)`);
    
    const { backups } = await backupService.listBackups();
    
    if (backups.length <= manter) {
      return res.json({
        success: true,
        message: `Nenhum backup para limpar (${backups.length} backups, mantendo ${manter})`,
        backups_restantes: backups.length
      });
    }
    
    const toDelete = backups.slice(manter);
    const deleted = [];
    const errors = [];
    
    for (const backup of toDelete) {
      try {
        await backupService.deleteBackup(backup.nome);
        deleted.push(backup.nome);
      } catch (error) {
        errors.push({ nome: backup.nome, erro: error.message });
      }
    }
    
    console.log(`🧹 ${deleted.length} backups removidos, ${errors.length} erros`);
    
    res.json({
      success: true,
      message: `Limpeza concluída: ${deleted.length} backups removidos`,
      removidos: deleted,
      erros: errors,
      backups_restantes: backups.length - deleted.length
    });
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na limpeza de backups',
      error: error.message
    });
  }
});

module.exports = router;