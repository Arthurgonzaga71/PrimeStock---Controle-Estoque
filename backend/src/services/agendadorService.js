// 📁 backend/src/services/agendadorService.js - VERSÃO COMPLETA INTEGRADA
const cron = require('node-cron');
const AlertaService = require('./alertaService');
const BackupService = require('./backupService');

class AgendadorService {
  static iniciar() {
    console.log('⏰ Iniciando todos os agendadores...');
    
    // ======================
    // 1. AGENDADOR DE ALERTAS
    // ======================
    
    // Verificar alertas a cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Executando verificações automáticas de alertas...');
      try {
        await AlertaService.executarVerificacoes();
        console.log('✅ Verificações de alertas concluídas');
      } catch (error) {
        console.error('❌ Erro no agendador de alertas:', error);
      }
    });

    console.log('✅ Agendador de alertas configurado (executa a cada hora)');
    
    // ======================
    // 2. AGENDADOR DE BACKUPS
    // ======================
    
    // BACKUP DIÁRIO às 02:00 AM (Horário de menor uso)
    cron.schedule('0 2 * * *', async () => {
      console.log('🌙 Iniciando backup diário automático (02:00 AM)...');
      try {
        const result = await BackupService.createDatabaseBackup(null, 'diario');
        if (result.success) {
          console.log(`✅ Backup diário criado: ${result.backup.nome}`);
          
          // Notificar se necessário
          await this.notificarBackupDiario(result);
        } else {
          console.error('❌ Falha no backup diário:', result.message);
          await this.notificarFalhaBackup(result);
        }
      } catch (error) {
        console.error('❌ Erro crítico no backup diário:', error);
      }
    }, {
      timezone: "America/Sao_Paulo"
    });

    // BACKUP SEMANAL COMPLETO aos Domingos às 03:00 AM
    cron.schedule('0 3 * * 0', async () => {
      console.log('📦 Iniciando backup semanal completo (Domingo 03:00 AM)...');
      try {
        const result = await BackupService.createDatabaseBackup(null, 'semanal');
        if (result.success) {
          console.log(`✅ Backup semanal criado: ${result.backup.nome}`);
        } else {
          console.error('❌ Falha no backup semanal:', result.message);
        }
      } catch (error) {
        console.error('❌ Erro crítico no backup semanal:', error);
      }
    }, {
      timezone: "America/Sao_Paulo"
    });

    // ROTAÇÃO DE BACKUPS às 04:00 AM (Remove backups antigos)
    cron.schedule('0 4 * * *', async () => {
      console.log('🧹 Executando rotação automática de backups...');
      try {
        await BackupService.rotateBackups();
        console.log('✅ Rotação de backups concluída');
      } catch (error) {
        console.error('❌ Erro na rotação de backups:', error);
      }
    }, {
      timezone: "America/Sao_Paulo"
    });

    // VERIFICAÇÃO DE SAÚDE DO BACKUP a cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔍 Verificando saúde do sistema de backup...');
      try {
        const health = await BackupService.healthCheck();
        if (!health.success) {
          console.error('⚠️ Problema detectado no sistema de backup:', health.error);
          await this.notificarProblemaBackup(health);
        } else {
          console.log('✅ Sistema de backup saudável');
        }
      } catch (error) {
        console.error('❌ Erro na verificação de saúde:', error);
      }
    });

    // VERIFICAÇÃO DE ESPAÇO EM DISCO uma vez ao dia às 05:00 AM
    cron.schedule('0 5 * * *', async () => {
      console.log('💾 Verificando espaço em disco para backups...');
      try {
        await this.verificarEspacoDisco();
      } catch (error) {
        console.error('❌ Erro na verificação de espaço:', error);
      }
    }, {
      timezone: "America/Sao_Paulo"
    });

    console.log('✅ Agendador de backups configurado');
    
    // ======================
    // 3. AGENDADOR DE MANUTENÇÃO
    // ======================
    
    // LIMPEZA DE LOGS ANTIGOS uma vez por semana (Sábado 01:00 AM)
    cron.schedule('0 1 * * 6', async () => {
      console.log('🧹 Executando limpeza de logs antigos...');
      try {
        await this.limparLogsAntigos();
      } catch (error) {
        console.error('❌ Erro na limpeza de logs:', error);
      }
    }, {
      timezone: "America/Sao_Paulo"
    });

    console.log('✅ Agendador de manutenção configurado');
    
    // ======================
    // 4. AGENDADOR DE TESTE (Apenas para desenvolvimento)
    // ======================
    
    if (process.env.NODE_ENV === 'development') {
      console.log('⚡ MODO DESENVOLVIMENTO: Agendadores de teste ativados');
      
      // Teste rápido de backup a cada 30 minutos (apenas dev)
      cron.schedule('*/30 * * * *', async () => {
        console.log('🧪 [DEV] Teste de backup automático...');
        try {
          const result = await BackupService.createDatabaseBackup(null, 'teste');
          if (result.success) {
            console.log(`🧪 [DEV] Backup de teste OK: ${result.backup.nome}`);
          }
        } catch (error) {
          console.error('🧪 [DEV] Erro no backup de teste:', error);
        }
      });
    }

    console.log('🚀 Todos os agendadores foram iniciados com sucesso!');
    console.log('📅 Agendamentos ativos:');
    console.log('   • Alertas: A cada hora');
    console.log('   • Backup diário: 02:00 AM');
    console.log('   • Backup semanal: Domingos 03:00 AM');
    console.log('   • Rotação: 04:00 AM');
    console.log('   • Saúde: A cada 6 horas');
    console.log('   • Espaço em disco: 05:00 AM');
    console.log('   • Limpeza de logs: Sábados 01:00 AM');
  }

  // ======================
  // MÉTODOS AUXILIARES
  // ======================
  
  static async notificarBackupDiario(resultado) {
    try {
      // Aqui você pode integrar com seu emailService ou notificationService
      console.log('📧 Backup diário concluído com sucesso');
      console.log(`   Arquivo: ${resultado.backup.nome}`);
      console.log(`   Tamanho: ${resultado.backup.tamanho}`);
      console.log(`   Data: ${new Date().toLocaleString()}`);
      
      // Exemplo de integração com email (descomente se tiver emailService)
      /*
      if (emailService) {
        await emailService.send({
          to: 'admin@estoque.com',
          subject: '✅ Backup Diário Concluído',
          text: `Backup criado: ${resultado.backup.nome}\nTamanho: ${resultado.backup.tamanho}`
        });
      }
      */
    } catch (error) {
      console.error('❌ Erro na notificação:', error);
    }
  }

  static async notificarFalhaBackup(resultado) {
    try {
      console.error('🚨 FALHA NO BACKUP AUTOMÁTICO');
      console.error(`   Motivo: ${resultado.message}`);
      console.error(`   Erro: ${resultado.error || 'N/A'}`);
      
      // Exemplo de notificação de falha
      /*
      if (emailService) {
        await emailService.send({
          to: 'admin@estoque.com',
          subject: '🚨 FALHA NO BACKUP AUTOMÁTICO',
          text: `Falha: ${resultado.message}\nErro: ${resultado.error || 'N/A'}`
        });
      }
      */
    } catch (error) {
      console.error('❌ Erro na notificação de falha:', error);
    }
  }

  static async notificarProblemaBackup(health) {
    try {
      console.warn('⚠️ PROBLEMA NO SISTEMA DE BACKUP DETECTADO');
      console.warn(`   Status: ${health.status}`);
      console.warn(`   Erro: ${health.error}`);
      
      /*
      if (emailService) {
        await emailService.send({
          to: 'admin@estoque.com',
          subject: '⚠️ Problema no Sistema de Backup',
          text: `Status: ${health.status}\nErro: ${health.error}`
        });
      }
      */
    } catch (error) {
      console.error('❌ Erro na notificação de problema:', error);
    }
  }

  static async verificarEspacoDisco() {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // Verificar espaço em disco
      const { stdout } = await execPromise('df -h .');
      const lines = stdout.split('\n');
      
      if (lines.length > 1) {
        const diskLine = lines[1];
        const parts = diskLine.split(/\s+/);
        
        const usoPercentual = parseInt(parts[4].replace('%', ''));
        
        console.log(`💾 Espaço em disco: ${parts[3]} disponíveis (${parts[4]} usado)`);
        
        // Alertar se uso for acima de 90%
        if (usoPercentual > 90) {
          console.warn('🚨 ALERTA: Espaço em disco crítico!');
          /*
          if (emailService) {
            await emailService.send({
              to: 'admin@estoque.com',
              subject: '🚨 Espaço em Disco Crítico',
              text: `Uso de disco: ${parts[4]}\nDisponível: ${parts[3]}\nTotal: ${parts[1]}`
            });
          }
          */
        } else if (usoPercentual > 80) {
          console.warn('⚠️ Atenção: Espaço em disco acima de 80%');
        }
      }
    } catch (error) {
      console.error('❌ Erro na verificação de espaço:', error);
    }
  }

  static async limparLogsAntigos() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const logsDir = path.join(__dirname, '../../backups');
      const logFiles = ['backup-logs.json', 'restore-logs.json'];
      
      for (const logFile of logFiles) {
        const logPath = path.join(logsDir, logFile);
        
        try {
          const stats = await fs.stat(logPath);
          const fileAgeDays = (Date.now() - stats.mtime) / (1000 * 60 * 60 * 24);
          
          // Se arquivo tiver mais de 30 dias
          if (fileAgeDays > 30) {
            // Manter apenas os últimos 1000 registros
            const content = await fs.readFile(logPath, 'utf8');
            const logs = JSON.parse(content);
            
            if (logs.length > 1000) {
              const novosLogs = logs.slice(-1000);
              await fs.writeFile(logPath, JSON.stringify(novosLogs, null, 2));
              console.log(`🧹 ${logFile}: Reduzido de ${logs.length} para 1000 registros`);
            }
          }
        } catch (err) {
          // Arquivo não existe, ignorar
        }
      }
      
      console.log('✅ Limpeza de logs concluída');
    } catch (error) {
      console.error('❌ Erro na limpeza de logs:', error);
    }
  }

  // ======================
  // CONTROLE DOS AGENDADORES
  // ======================
  
  static async status() {
    return {
      agendadores: {
        alertas: {
          descricao: 'Verificação de alertas de estoque',
          frequencia: 'A cada hora',
          status: 'ativo'
        },
        backup_diario: {
          descricao: 'Backup automático diário',
          frequencia: '02:00 AM todos os dias',
          status: 'ativo',
          timezone: 'America/Sao_Paulo'
        },
        backup_semanal: {
          descricao: 'Backup completo semanal',
          frequencia: '03:00 AM aos domingos',
          status: 'ativo',
          timezone: 'America/Sao_Paulo'
        },
        rotacao: {
          descricao: 'Rotação de backups antigos',
          frequencia: '04:00 AM todos os dias',
          status: 'ativo',
          timezone: 'America/Sao_Paulo'
        },
        health_check: {
          descricao: 'Verificação de saúde do sistema',
          frequencia: 'A cada 6 horas',
          status: 'ativo'
        },
        espaco_disco: {
          descricao: 'Verificação de espaço em disco',
          frequencia: '05:00 AM todos os dias',
          status: 'ativo',
          timezone: 'America/Sao_Paulo'
        },
        limpeza_logs: {
          descricao: 'Limpeza de logs antigos',
          frequencia: '01:00 AM aos sábados',
          status: 'ativo',
          timezone: 'America/Sao_Paulo'
        }
      },
      ambiente: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }

  static async executarBackupManual() {
    console.log('🔄 Executando backup manual via agendador...');
    try {
      const resultado = await BackupService.createDatabaseBackup(null, 'manual');
      return resultado;
    } catch (error) {
      console.error('❌ Erro no backup manual:', error);
      throw error;
    }
  }
}

module.exports = AgendadorService;