// services/backupService.js
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { sequelize } = require('../config/database');

const execPromise = util.promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.maxBackups = 7; // Manter últimos 7 backups
    this.logFile = path.join(this.backupDir, 'backup-logs.json');
    console.log('✅ BackupService inicializado');
    this.ensureBackupDir();
  }

  // Criar diretório de backups
  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`📁 Diretório de backups: ${this.backupDir}`);
    } catch (error) {
      console.error('❌ Erro ao criar diretório:', error);
    }
  }

  // =========== BACKUP PRINCIPAL ===========
  async createDatabaseBackup(usuarioId = null, tipo = 'completo') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${tipo}-${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, backupFileName);
    const compressedPath = `${backupPath}.gz`;

    try {
      console.log(`🔄 Iniciando backup (${tipo})...`);

      // Configurações do banco (mesmas do database.js)
      const dbConfig = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'controle_estoque_ti'
      };

      // Comando mysqldump
      const dumpCommand = `mysqldump \
        -h ${dbConfig.host} \
        -P ${dbConfig.port} \
        -u ${dbConfig.user} \
        ${dbConfig.password ? `-p${dbConfig.password}` : ''} \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        ${dbConfig.database} > "${backupPath}"`;

      await execPromise(dumpCommand);
      
      // Verificar se backup foi criado
      if (!fsSync.existsSync(backupPath)) {
        throw new Error('Backup não foi criado - arquivo não encontrado');
      }

      const fileSize = (await fs.stat(backupPath)).size;
      console.log(`✅ Backup SQL criado: ${backupFileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

      // Compactar backup
      await this.compressBackup(backupPath, compressedPath);
      
      // Remover arquivo não compactado
      await fs.unlink(backupPath);

      // Rotacionar backups antigos
      await this.rotateBackups();

      // Registrar log
      await this.logBackup({
        fileName: `${backupFileName}.gz`,
        type: tipo,
        size: fileSize,
        usuarioId: usuarioId,
        status: 'success'
      });

      return {
        success: true,
        backup: {
          nome: `${backupFileName}.gz`,
          tamanho: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
          tipo: tipo,
          dataCriacao: new Date(),
          usuarioId: usuarioId,
          caminho: compressedPath
        },
        message: 'Backup criado com sucesso!'
      };

    } catch (error) {
      console.error('❌ Erro no backup:', error);
      
      await this.logBackup({
        fileName: backupFileName,
        type: tipo,
        status: 'error',
        usuarioId: usuarioId,
        error: error.message
      });

      // Tentar backup alternativo
      return await this.createAlternativeBackup(usuarioId);
    }
  }

  // =========== BACKUP ALTERNATIVO (JSON) ===========
  async createAlternativeBackup(usuarioId = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-alternativo-${timestamp}.json`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      console.log('🔄 Criando backup alternativo (JSON)...');

      const backupData = {
        metadata: {
          dataBackup: new Date(),
          tipo: 'alternativo_json',
          usuarioId: usuarioId,
          versaoSistema: '2.2.0'
        },
        mensagem: 'Backup criado como arquivo JSON (mysqldump não disponível)',
        tabelas: []
      };

      // Listar tabelas do banco
      const [tables] = await sequelize.query("SHOW TABLES");
      
      // Backup das principais tabelas (limitado para não sobrecarregar)
      const tabelasImportantes = ['usuarios', 'itens', 'categorias', 'movimentacoes', 'manutencoes'];
      
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        
        if (tabelasImportantes.includes(tableName)) {
          try {
            const [data] = await sequelize.query(`SELECT * FROM ${tableName} LIMIT 1000`);
            backupData[tableName] = data;
            backupData.tabelas.push(tableName);
          } catch (e) {
            console.warn(`⚠️ Não foi possível fazer backup da tabela ${tableName}:`, e.message);
          }
        }
      }

      // Salvar JSON
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      
      const fileSize = (await fs.stat(backupPath)).size;
      console.log(`✅ Backup alternativo criado: ${backupFileName}`);

      await this.logBackup({
        fileName: backupFileName,
        type: 'alternativo',
        size: fileSize,
        usuarioId: usuarioId,
        status: 'success'
      });

      return {
        success: true,
        backup: {
          nome: backupFileName,
          tamanho: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
          tipo: 'alternativo',
          dataCriacao: new Date(),
          usuarioId: usuarioId,
          caminho: backupPath,
          tabelas: backupData.tabelas.length
        },
        message: 'Backup alternativo criado (formato JSON)',
        observacao: 'mysqldump não disponível, usando backup em JSON'
      };

    } catch (error) {
      console.error('❌ Erro no backup alternativo:', error);
      
      return {
        success: false,
        message: 'Falha ao criar backup',
        error: error.message
      };
    }
  }

  // =========== COMPRESSÃO ===========
  async compressBackup(inputPath, outputPath) {
    try {
      const compressCommand = `gzip -c "${inputPath}" > "${outputPath}"`;
      await execPromise(compressCommand);
      console.log(`✅ Backup compactado: ${path.basename(outputPath)}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao compactar:', error);
      throw error;
    }
  }

  // =========== LISTAR BACKUPS ===========
  async listBackups() {
    try {
      await this.ensureBackupDir();
      const files = await fs.readdir(this.backupDir);
      
      const backups = await Promise.all(
        files
          .filter(file => file.startsWith('backup-'))
          .map(async file => {
            const filePath = path.join(this.backupDir, file);
            const stats = await fs.stat(filePath);
            
            const tipo = file.includes('alternativo') ? 'alternativo' : 
                        file.includes('completo') ? 'completo' : 'database';
            
            const formato = file.endsWith('.gz') ? 'compressed' : 
                           file.endsWith('.json') ? 'json' : 'sql';
            
            return {
              nome: file,
              tamanho: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
              dataCriacao: stats.birthtime,
              caminho: filePath,
              tipo: tipo,
              formato: formato,
              podeRestaurar: file.endsWith('.sql.gz') || file.endsWith('.sql')
            };
          })
      );

      // Ordenar por data (mais recente primeiro)
      backups.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

      return {
        success: true,
        backups: backups,
        total: backups.length,
        diretorio: this.backupDir
      };

    } catch (error) {
      console.error('❌ Erro ao listar backups:', error);
      return {
        success: false,
        backups: [],
        error: error.message
      };
    }
  }

  // =========== RESTAURAR BACKUP ===========
  async restoreBackup(fileName) {
    const backupPath = path.join(this.backupDir, fileName);

    try {
      console.log(`🔄 Restaurando backup: ${fileName}`);

      if (!fsSync.existsSync(backupPath)) {
        throw new Error('Arquivo de backup não encontrado');
      }

      if (fileName.endsWith('.json')) {
        throw new Error('Backups JSON não podem ser restaurados automaticamente');
      }

      // Descompactar se necessário
      let sqlPath = backupPath;
      if (fileName.endsWith('.gz')) {
        sqlPath = backupPath.replace('.gz', '');
        const decompressCommand = `gunzip -c "${backupPath}" > "${sqlPath}"`;
        await execPromise(decompressCommand);
      }

      // Configurações do banco
      const dbConfig = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'controle_estoque_ti'
      };

      // Restaurar banco
      const restoreCommand = `mysql \
        -h ${dbConfig.host} \
        -P ${dbConfig.port} \
        -u ${dbConfig.user} \
        ${dbConfig.password ? `-p${dbConfig.password}` : ''} \
        ${dbConfig.database} < "${sqlPath}"`;

      await execPromise(restoreCommand);

      // Limpar arquivo temporário
      if (fileName.endsWith('.gz')) {
        await fs.unlink(sqlPath);
      }

      console.log(`✅ Backup restaurado com sucesso: ${fileName}`);

      await this.logRestore({
        fileName: fileName,
        status: 'success',
        timestamp: new Date()
      });

      return {
        success: true,
        message: `Backup ${fileName} restaurado com sucesso!`
      };

    } catch (error) {
      console.error('❌ Erro ao restaurar:', error);
      
      await this.logRestore({
        fileName: fileName,
        status: 'error',
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // =========== DELETAR BACKUP ===========
  async deleteBackup(fileName) {
    try {
      const backupPath = path.join(this.backupDir, fileName);
      
      if (!fsSync.existsSync(backupPath)) {
        throw new Error('Backup não encontrado');
      }

      await fs.unlink(backupPath);
      console.log(`🗑️ Backup removido: ${fileName}`);

      return {
        success: true,
        message: `Backup ${fileName} removido com sucesso`
      };
    } catch (error) {
      console.error('❌ Erro ao remover:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =========== DOWNLOAD BACKUP ===========
  async getBackupForDownload(fileName) {
    const backupPath = path.join(this.backupDir, fileName);
    
    if (!fsSync.existsSync(backupPath)) {
      throw new Error('Arquivo não encontrado');
    }

    return {
      path: backupPath,
      fileName: fileName,
      size: (await fs.stat(backupPath)).size
    };
  }

  // =========== ROTAÇÃO DE BACKUPS ===========
  async rotateBackups() {
    try {
      const { backups } = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          await fs.unlink(backup.caminho);
          console.log(`🗑️ Backup antigo removido: ${backup.nome}`);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Erro na rotação:', error);
      return false;
    }
  }

  // =========== LOGS ===========
  async logBackup(data) {
    try {
      let logs = [];
      
      if (fsSync.existsSync(this.logFile)) {
        const content = await fs.readFile(this.logFile, 'utf8');
        logs = JSON.parse(content);
      }

      logs.push({
        ...data,
        timestamp: new Date().toISOString()
      });

      // Manter apenas últimos 100 logs
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }

      await fs.writeFile(this.logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar log:', error);
    }
  }

  async logRestore(data) {
    try {
      const restoreLogFile = path.join(this.backupDir, 'restore-logs.json');
      let logs = [];
      
      if (fsSync.existsSync(restoreLogFile)) {
        const content = await fs.readFile(restoreLogFile, 'utf8');
        logs = JSON.parse(content);
      }

      logs.push({
        ...data,
        timestamp: new Date().toISOString()
      });

      await fs.writeFile(restoreLogFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar log de restauração:', error);
    }
  }

  // =========== HEALTH CHECK ===========
  async healthCheck() {
    try {
      await this.ensureBackupDir();
      
      const podeEscrever = await (async () => {
        try {
          const testFile = path.join(this.backupDir, 'test.txt');
          await fs.writeFile(testFile, 'test');
          await fs.unlink(testFile);
          return true;
        } catch {
          return false;
        }
      })();

      const { backups } = await this.listBackups();

      return {
        success: true,
        status: 'operacional',
        diretorio: {
          path: this.backupDir,
          existe: true,
          podeEscrever: podeEscrever,
          espacoLivre: await this.getFreeSpace()
        },
        backups: {
          total: backups.length,
          ultimo: backups[0] || null
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: 'erro',
        error: error.message
      };
    }
  }

  async getFreeSpace() {
    try {
      const stats = await fs.statfs(this.backupDir);
      const freeGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
      return `${freeGB.toFixed(2)} GB`;
    } catch {
      return 'desconhecido';
    }
  }
}

module.exports = new BackupService();