import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Backup as BackupIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Cached as CachedIcon
} from '@mui/icons-material';

import BackupService from '../../services/backupService';
import BackupList from './BackupList';
import BackupStats from './BackupStats';
import CreateBackupModal from './CreateBackupModal';
import RestoreModal from './RestoreModal';

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ CARREGAR BACKUPS
  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await BackupService.listBackups();
      setBackups(response.backups || []);
      setError('');
    } catch (error) {
      setError('Erro ao carregar backups: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // ✅ CRIAR BACKUP COMPLETO
  const handleCreateBackup = async (tipo = 'completo', dias = 7) => {
    try {
      setActionLoading(true);
      setError('');

      let result;
      if (tipo === 'completo') {
        result = await BackupService.createBackupCompleto();
      } else {
        result = await BackupService.createBackupIncremental(null, dias);
      }

      if (result.success) {
        setSuccess(`Backup ${tipo} criado com sucesso!`);
        await loadBackups();
        setCreateModalOpen(false);
      } else {
        setError('Erro ao criar backup: ' + result.error);
      }
    } catch (error) {
      setError('Erro ao criar backup: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ RESTAURAR BACKUP
  const handleRestoreBackup = async (backupName) => {
    try {
      setActionLoading(true);
      setError('');

      const result = await BackupService.restoreBackup(backupName);

      if (result.success) {
        setSuccess('Backup restaurado com sucesso! O sistema será atualizado.');
        setRestoreModalOpen(false);
        setSelectedBackup(null);
        
        // Recarregar dados após restauração
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError('Erro ao restaurar backup: ' + result.error);
      }
    } catch (error) {
      setError('Erro ao restaurar backup: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ DOWNLOAD BACKUP
  const handleDownloadBackup = async (backupName) => {
    try {
      setActionLoading(true);
      await BackupService.downloadBackup(backupName);
      setSuccess('Download iniciado!');
    } catch (error) {
      setError('Erro ao fazer download: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ DELETAR BACKUP
  const handleDeleteBackup = async (backupName) => {
    if (!window.confirm('Tem certeza que deseja deletar este backup?')) {
      return;
    }

    try {
      setActionLoading(true);
      const result = await BackupService.deleteBackup(backupName);

      if (result.success) {
        setSuccess('Backup deletado com sucesso!');
        await loadBackups();
      } else {
        setError('Erro ao deletar backup: ' + result.error);
      }
    } catch (error) {
      setError('Erro ao deletar backup: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ EXPORTAR CSV
  const handleExportCSV = async () => {
    try {
      setActionLoading(true);
      const result = await BackupService.exportToCSV();

      if (result.success) {
        setSuccess('Exportação CSV concluída! Verifique a pasta de exports.');
      } else {
        setError('Erro ao exportar CSV: ' + result.error);
      }
    } catch (error) {
      setError('Erro ao exportar CSV: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ LIMPAR MENSAGENS
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Carregando backups...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            <BackupIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Gerenciamento de Backup
          </Typography>
          
          <Chip 
            label={`${backups.length} Backups`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph>
          Gerencie backups completos e incrementais do sistema. 
          Crie, restaure e faça download de backups de segurança.
        </Typography>

        {/* BOTÕES DE AÇÃO */}
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            disabled={actionLoading}
          >
            Novo Backup
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={actionLoading}
          >
            Exportar CSV
          </Button>

          <Button
            variant="outlined"
            startIcon={<CachedIcon />}
            onClick={loadBackups}
            disabled={actionLoading}
          >
            Atualizar
          </Button>
        </Box>
      </Paper>

      {/* MENSAGENS */}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={clearMessages} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* CONTEÚDO - GRID V2 CORRIGIDO */}
      <Grid container spacing={3}>
        {/* ESTATÍSTICAS */}
        <Grid size={{ xs: 12, md: 4 }}>
          <BackupStats backups={backups} />
        </Grid>

        {/* LISTA DE BACKUPS */}
        <Grid size={{ xs: 12, md: 8 }}>
          <BackupList
            backups={backups}
            onRestore={(backup) => {
              setSelectedBackup(backup);
              setRestoreModalOpen(true);
            }}
            onDownload={handleDownloadBackup}
            onDelete={handleDeleteBackup}
            loading={actionLoading}
          />
        </Grid>
      </Grid>

      {/* MODAIS */}
      <CreateBackupModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateBackup}
        loading={actionLoading}
      />

      <RestoreModal
        open={restoreModalOpen}
        onClose={() => {
          setRestoreModalOpen(false);
          setSelectedBackup(null);
        }}
        onRestore={handleRestoreBackup}
        backup={selectedBackup}
        loading={actionLoading}
      />
    </Box>
  );
};

export default BackupManager;