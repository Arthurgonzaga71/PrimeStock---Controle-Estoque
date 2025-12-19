import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const RestoreModal = ({ open, onClose, onRestore, backup, loading }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const steps = ['Confirmação', 'Avisos Importantes', 'Executando Restauração'];

  if (!backup) return null;

  const handleRestore = () => {
    onRestore(backup.nome);
    setActiveStep(2);
  };

  const handleClose = () => {
    onClose();
    setActiveStep(0);
    setConfirmed(false);
  };

  // Formatar dados do backup
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
  };

  const getBackupType = (nome) => {
    return nome.includes('incremental') ? 'Incremental' : 'Completo';
  };

  const stats = backup.metadata?.totalRegistros || {};

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <RestoreIcon sx={{ mr: 2, color: 'warning.main' }} />
          Restaurar Sistema from Backup
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* STEPPER */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* PASSO 1: INFORMAÇÕES DO BACKUP */}
        {activeStep === 0 && (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <WarningIcon />
              <strong>ATENÇÃO:</strong> Esta operação é irreversível e substituirá todos os dados atuais do sistema.
            </Alert>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📋 Backup Selecionado
              </Typography>
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body1">
                  <strong>Arquivo:</strong> {backup.nome}
                </Typography>
                <Typography variant="body1">
                  <strong>Tipo:</strong> 
                  <Chip 
                    label={getBackupType(backup.nome)} 
                    color={getBackupType(backup.nome) === 'Completo' ? 'primary' : 'secondary'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body1">
                  <strong>Data do Backup:</strong> {formatDate(backup.dataCriacao)}
                </Typography>
                <Typography variant="body1">
                  <strong>Tamanho:</strong> {formatSize(backup.tamanho)}
                </Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 Dados que Serão Restaurados
              </Typography>
              
              <List dense>
                {stats.usuarios > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${stats.usuarios} Usuários`} 
                    />
                  </ListItem>
                )}
                
                {stats.categorias > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${stats.categorias} Categorias`} 
                    />
                  </ListItem>
                )}
                
                {stats.itens > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${stats.itens} Itens de Estoque`} 
                    />
                  </ListItem>
                )}
                
                {stats.movimentacoes > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${stats.movimentacoes} Movimentações`} 
                    />
                  </ListItem>
                )}
                
                {stats.manutencoes > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${stats.manutencoes} Manutenções`} 
                    />
                  </ListItem>
                )}
              </List>
            </Paper>

            {/* CONFIRMAÇÃO */}
            <Paper sx={{ p: 2, backgroundColor: 'error.light' }}>
              <Box display="flex" alignItems="center">
                <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="body2" color="error.contrastText">
                  <strong>Confirmo que entendi os riscos e desejo prosseguir com a restauração.</strong>
                </Typography>
              </Box>
              
              <Button
                variant="outlined"
                color="error"
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => setConfirmed(true)}
                disabled={confirmed}
              >
                {confirmed ? '✅ Confirmado' : 'Clique para Confirmar'}
              </Button>
            </Paper>
          </Box>
        )}

        {/* PASSO 2: AVISOS FINAIS */}
        {activeStep === 1 && (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              <ErrorIcon />
              <strong>ALERTA CRÍTICO</strong>
            </Alert>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom color="error">
                ⚠️ Impactos da Restauração
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Todos os dados atuais serão PERDIDOS"
                    secondary="Itens, movimentações e manutenções criadas após este backup serão excluídas permanentemente"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sistema ficará indisponível"
                    secondary="O sistema será reiniciado automaticamente após a restauração"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Operação irreversível"
                    secondary="Não é possível desfazer esta ação"
                  />
                </ListItem>
              </List>
            </Paper>

            <Paper sx={{ p: 2, backgroundColor: 'success.light' }}>
              <Box display="flex" alignItems="center">
                <InfoIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  <strong>Recomendação:</strong> Faça um backup dos dados atuais antes de prosseguir.
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {/* PASSO 3: EXECUTANDO */}
        {activeStep === 2 && (
          <Box textAlign="center" py={4}>
            {loading ? (
              <>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Restaurando Sistema...
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Esta operação pode levar vários minutos. Não feche o navegador.
                </Typography>
                
                <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    🔄 Limpando dados atuais...
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom>
                    📥 Restaurando usuários e categorias...
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom>
                    📦 Restaurando itens e movimentações...
                  </Typography>
                  <Typography variant="caption" display="block">
                    ✅ Finalizando restauração...
                  </Typography>
                </Box>
              </>
            ) : (
              <Alert severity="success">
                Restauração concluída com sucesso! O sistema será reiniciado.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {activeStep === 0 && (
          <>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button 
              variant="contained" 
              color="warning"
              onClick={() => setActiveStep(1)}
              disabled={!confirmed}
              startIcon={<WarningIcon />}
            >
              Continuar
            </Button>
          </>
        )}

        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>Voltar</Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleRestore}
              disabled={loading}
              startIcon={<RestoreIcon />}
            >
              Confirmar Restauração
            </Button>
          </>
        )}

        {activeStep === 2 && !loading && (
          <Button 
            variant="contained" 
            onClick={handleClose}
          >
            Concluir
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RestoreModal;