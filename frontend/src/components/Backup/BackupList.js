import React from 'react';
import {
  Paper,
  List,
  Typography,
  Box,
  Chip,
  Alert
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import BackupCard from './BackupCard';

const BackupList = ({ backups, onRestore, onDownload, onDelete, loading }) => {
  if (!backups || backups.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom component="div">
          📭 Nenhum Backup Encontrado
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          Crie seu primeiro backup para proteger os dados do sistema.
        </Typography>
      </Paper>
    );
  }

  // Ordenar backups por data (mais recente primeiro)
  const sortedBackups = [...backups].sort((a, b) => 
    new Date(b.dataCriacao) - new Date(a.dataCriacao)
  );

  // Separar backups por tipo
  const backupsCompletos = sortedBackups.filter(b => 
    b.nome.includes('completo') || b.nome.includes('backup-') && !b.nome.includes('incremental')
  );
  const backupsIncrementais = sortedBackups.filter(b => b.nome.includes('incremental'));
  const backupsOutros = sortedBackups.filter(b => 
    !b.nome.includes('completo') && !b.nome.includes('incremental') && !b.nome.includes('backup-')
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" component="div">
          📦 Backups do Sistema
        </Typography>
        
        <Box display="flex" gap={1}>
          <Chip 
            label={`${backupsCompletos.length} Completos`} 
            color="primary" 
            variant="outlined"
            size="small"
          />
          <Chip 
            label={`${backupsIncrementais.length} Incrementais`} 
            color="secondary" 
            variant="outlined"
            size="small"
          />
          {backupsOutros.length > 0 && (
            <Chip 
              label={`${backupsOutros.length} Outros`} 
              color="default" 
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* BACKUPS COMPLETOS */}
      {backupsCompletos.length > 0 && (
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }} component="div">
            <ScheduleIcon sx={{ mr: 1 }} />
            Backups Completos
          </Typography>
          
          <List dense>
            {backupsCompletos.map((backup, index) => (
              <BackupCard
                key={backup.nome}
                backup={backup}
                onRestore={onRestore}
                onDownload={onDownload}
                onDelete={onDelete}
                loading={loading}
                isLatest={index === 0}
              />
            ))}
          </List>
        </Box>
      )}

      {/* BACKUPS INCREMENTAIS */}
      {backupsIncrementais.length > 0 && (
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }} component="div">
            <ScheduleIcon sx={{ mr: 1 }} />
            Backups Incrementais
          </Typography>
          
          <List dense>
            {backupsIncrementais.map((backup, index) => (
              <BackupCard
                key={backup.nome}
                backup={backup}
                onRestore={onRestore}
                onDownload={onDownload}
                onDelete={onDelete}
                loading={loading}
                isLatest={index === 0 && backupsCompletos.length === 0}
              />
            ))}
          </List>
        </Box>
      )}

      {/* OUTROS BACKUPS */}
      {backupsOutros.length > 0 && (
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }} component="div">
            <ScheduleIcon sx={{ mr: 1 }} />
            Outros Backups
          </Typography>
          
          <List dense>
            {backupsOutros.map((backup) => (
              <BackupCard
                key={backup.nome}
                backup={backup}
                onRestore={onRestore}
                onDownload={onDownload}
                onDelete={onDelete}
                loading={loading}
              />
            ))}
          </List>
        </Box>
      )}

      {/* LEGENDA DE AÇÕES */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom component="div">
          🎯 Ações Disponíveis:
        </Typography>
        <Box display="flex" gap={3} flexWrap="wrap">
          <Box display="flex" alignItems="center">
            <RestoreIcon color="primary" sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="caption" component="span">Restaurar Sistema</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <DownloadIcon color="secondary" sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="caption" component="span">Download</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <InfoIcon color="info" sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="caption" component="span">Informações</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <DeleteIcon color="error" sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="caption" component="span">Deletar</Typography>
          </Box>
        </Box>
      </Box>

      {/* DICA IMPORTANTE */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Dica:</strong> Mantenha pelo menos 3 backups completos em locais diferentes para maior segurança.
      </Alert>
    </Paper>
  );
};

export default BackupList;