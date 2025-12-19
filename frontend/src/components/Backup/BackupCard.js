import React, { useState } from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography,
  Collapse,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const BackupCard = ({ backup, onRestore, onDownload, onDelete, loading, isLatest = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (!backup) return null;

  // ✅ CORREÇÃO: Formatar dados do backup corretamente
  const formatSize = (sizeData) => {
    console.log('📊 Dados do backup:', backup); // Debug
    
    // Se já veio formatado do backend
    if (typeof sizeData === 'string' && sizeData.includes('MB')) {
      return sizeData;
    }
    
    // Se for número (bytes)
    if (typeof sizeData === 'number') {
      const mb = sizeData / (1024 * 1024);
      return mb < 1 ? `${(sizeData / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
    }
    
    // Se for undefined ou null
    return '0.00 MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getBackupType = (nome) => {
    if (!nome) return 'Backup';
    if (nome.includes('incremental')) return 'Incremental';
    if (nome.includes('completo')) return 'Completo';
    if (nome.includes('alternativo')) return 'Alternativo';
    if (nome.includes('manual')) return 'Manual';
    return 'Backup';
  };

  const getTypeColor = (nome) => {
    if (!nome) return 'default';
    if (nome.includes('incremental')) return 'secondary';
    if (nome.includes('alternativo')) return 'warning';
    if (nome.includes('manual')) return 'info';
    return 'primary';
  };

  const backupType = getBackupType(backup.nome);
  const sizeFormatted = formatSize(backup.tamanho || backup.size);
  const dateFormatted = formatDate(backup.dataCriacao || backup.createdAt);

  return (
    <Paper sx={{ 
      mb: 1, 
      border: isLatest ? 2 : 1, 
      borderColor: isLatest ? 'success.main' : 'divider' 
    }}>
      <ListItem>
        {/* ÍCONE E TIPO */}
        <Box sx={{ mr: 2 }}>
          <Chip 
            label={backupType} 
            color={getTypeColor(backup.nome)} 
            size="small" 
            variant="outlined"
          />
          {isLatest && (
            <Chip 
              label="Mais Recente" 
              color="success" 
              size="small" 
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        {/* INFORMAÇÕES PRINCIPAIS */}
        <ListItemText
          primary={
            <Box component="div">
              <Typography variant="subtitle1" noWrap sx={{ maxWidth: 200 }}>
                {backup.nome || 'Backup sem nome'}
              </Typography>
            </Box>
          }
          secondary={
            <Box component="div">
              <Typography variant="body2" color="text.secondary" component="span">
                📅 {dateFormatted}
              </Typography>
              <br />
              <Typography variant="body2" color="text.secondary" component="span">
                💾 {sizeFormatted}
              </Typography>
            </Box>
          }
        />

        {/* AÇÕES */}
        <ListItemSecondaryAction>
          <Box display="flex" alignItems="center">
            {/* BOTÃO EXPANDIR DETALHES */}
            <Tooltip title="Detalhes">
              <IconButton 
                onClick={() => setExpanded(!expanded)}
                size="small"
                sx={{ mr: 1 }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>

            {/* BOTÃO RESTAURAR */}
            <Tooltip title="Restaurar Sistema">
              <span>
                <IconButton
                  onClick={() => onRestore(backup.nome)}
                  disabled={loading}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <RestoreIcon />
                </IconButton>
              </span>
            </Tooltip>

            {/* BOTÃO DOWNLOAD */}
            <Tooltip title="Download">
              <span>
                <IconButton
                  onClick={() => onDownload(backup.nome)}
                  disabled={loading}
                  color="secondary"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <DownloadIcon />
                </IconButton>
              </span>
            </Tooltip>

            {/* BOTÃO DELETAR */}
            <Tooltip title="Deletar Backup">
              <span>
                <IconButton
                  onClick={() => onDelete(backup.nome)}
                  disabled={loading}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </ListItemSecondaryAction>
      </ListItem>

      {/* DETALHES EXPANDIDOS */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* METADADOS */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom color="primary" component="div">
                📋 Informações do Backup
              </Typography>
              <Box sx={{ pl: 2 }} component="div">
                <Typography variant="body2" component="div">
                  <strong>Arquivo:</strong> {backup.nome || 'N/A'}
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Tamanho:</strong> {sizeFormatted}
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Criado em:</strong> {dateFormatted}
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Tipo:</strong> {backupType}
                </Typography>
                {backup.caminho && (
                  <Typography variant="body2" component="div">
                    <strong>Local:</strong> {backup.caminho}
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* INFORMAÇÕES ADICIONAIS */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom color="primary" component="div">
                📊 Detalhes Técnicos
              </Typography>
              <Box sx={{ pl: 2 }} component="div">
                <Typography variant="body2" component="div">
                  <strong>Formato:</strong> {backup.nome?.includes('.json') ? 'JSON' : 'SQL'}
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Status:</strong> {backup.tipo || 'Completo'}
                </Typography>
                {isLatest && (
                  <Typography variant="body2" component="div" color="success.main">
                    <strong>✓ Backup mais recente</strong>
                  </Typography>
                )}
                <Typography variant="body2" component="div">
                  <strong>ID:</strong> {backup.id || 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* DEBUG - Mostrar dados completos do backup */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" component="div" color="text.secondary">
              <strong>Debug - Dados completos:</strong> {JSON.stringify(backup, null, 2)}
            </Typography>
          </Box>

          {/* ALERTAS IMPORTANTES */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'warning.light', borderRadius: 1 }}>
            <Box display="flex" alignItems="center">
              <WarningIcon sx={{ mr: 1 }} />
              <Typography variant="body2" component="div">
                <strong>Atenção:</strong> A restauração substituirá todos os dados atuais. 
                Faça um backup atual antes de restaurar.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default BackupCard;