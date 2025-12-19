import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Storage as StorageIcon,
  Update as UpdateIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const BackupStats = ({ backups }) => {
  const totalSize = backups.reduce((sum, backup) => sum + (backup.tamanho || 0), 0);
  const totalBackups = backups.length;
  const latestBackup = backups[0];
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

  const stats = [
    {
      label: 'Total de Backups',
      value: totalBackups,
      icon: <StorageIcon color="primary" />,
      color: 'primary'
    },
    {
      label: 'Tamanho Total',
      value: `${sizeInMB} MB`,
      icon: <TimelineIcon color="secondary" />,
      color: 'secondary'
    },
    {
      label: 'Backup Mais Recente',
      value: latestBackup ? new Date(latestBackup.dataCriacao).toLocaleDateString('pt-BR') : 'N/A',
      icon: <UpdateIcon color="success" />,
      color: 'success'
    },
    {
      label: 'Status do Sistema',
      value: totalBackups > 0 ? 'Protegido' : 'Não Protegido',
      icon: <SecurityIcon color={totalBackups > 0 ? 'success' : 'warning'} />,
      color: totalBackups > 0 ? 'success' : 'warning'
    }
  ];

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        📊 Estatísticas de Backup
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Capacidade Utilizada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sizeInMB} MB
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={Math.min((totalSize / (100 * 1024 * 1024)) * 100, 100)} 
          color={totalSize > 50 * 1024 * 1024 ? 'warning' : 'primary'}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      <Grid container spacing={2}>
        {stats.map((stat, index) => (
          <Grid item xs={12} key={index}>
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: 'background.default'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  {stat.icon}
                  <Typography variant="body2" sx={{ ml: 1, fontWeight: 'medium' }}>
                    {stat.label}
                  </Typography>
                </Box>
                <Chip
                  label={stat.value}
                  color={stat.color}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* DICAS DE BACKUP */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.light', borderRadius: 2 }}>
        <Typography variant="body2" color="info.contrastText">
          💡 <strong>Dica:</strong> Mantenha backups regulares e armazene em local seguro.
        </Typography>
      </Box>
    </Paper>
  );
};

export default BackupStats;