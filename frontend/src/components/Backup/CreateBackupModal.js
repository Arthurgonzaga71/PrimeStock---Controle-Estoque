import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  Backup as BackupIcon,
  Update as UpdateIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const CreateBackupModal = ({ open, onClose, onCreate, loading }) => {
  const [tipoBackup, setTipoBackup] = useState('completo');
  const [diasIncremental, setDiasIncremental] = useState(7);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Selecionar Tipo', 'Confirmar', 'Executando'];

  const handleSubmit = () => {
    onCreate(tipoBackup, diasIncremental);
    setActiveStep(2);
  };

  const handleClose = () => {
    onClose();
    setActiveStep(0);
    setTipoBackup('completo');
    setDiasIncremental(7);
  };

  const getBackupDescription = (tipo) => {
    const descriptions = {
      completo: {
        title: 'Backup Completo',
        icon: <BackupIcon color="primary" />,
        description: 'Salva todos os dados do sistema incluindo usuários, itens, movimentações e manutenções.',
        advantages: [
          '✅ Todos os dados protegidos',
          '✅ Restauração completa do sistema',
          '✅ Ideal para backups regulares'
        ],
        size: 'Tamanho: 10-50MB (dependendo dos dados)',
        time: 'Tempo: 2-5 minutos'
      },
      incremental: {
        title: 'Backup Incremental',
        icon: <UpdateIcon color="secondary" />,
        description: 'Salva apenas os dados modificados nos últimos dias. Mais rápido e eficiente.',
        advantages: [
          '🚀 Backup rápido',
          '💾 Menor uso de espaço',
          '📅 Ideal para backups frequentes'
        ],
        size: 'Tamanho: 1-5MB',
        time: 'Tempo: 30-60 segundos'
      }
    };
    return descriptions[tipo] || descriptions.completo;
  };

  const desc = getBackupDescription(tipoBackup);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <BackupIcon sx={{ mr: 2 }} />
          Criar Novo Backup
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

        {/* PASSO 1: SELEÇÃO DO TIPO */}
        {activeStep === 0 && (
          <Box>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2 }}>
                Selecione o tipo de backup:
              </FormLabel>
              
              <RadioGroup
                value={tipoBackup}
                onChange={(e) => setTipoBackup(e.target.value)}
              >
                {/* OPÇÃO BACKUP COMPLETO */}
                <Paper sx={{ p: 2, mb: 2, border: 1, borderColor: 'primary.main' }}>
                  <FormControlLabel 
                    value="completo" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          <BackupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Backup Completo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Salva todos os dados do sistema. Recomendado para backups semanais.
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>

                {/* OPÇÃO BACKUP INCREMENTAL */}
                <Paper sx={{ p: 2, border: 1, borderColor: 'secondary.main' }}>
                  <FormControlLabel 
                    value="incremental" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          <UpdateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Backup Incremental
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Apenas dados recentes. Ideal para backups diários.
                        </Typography>
                        
                        {tipoBackup === 'incremental' && (
                          <Box sx={{ mt: 2 }}>
                            <TextField
                              label="Período (dias)"
                              type="number"
                              value={diasIncremental}
                              onChange={(e) => setDiasIncremental(parseInt(e.target.value) || 7)}
                              size="small"
                              inputProps={{ min: 1, max: 30 }}
                              sx={{ width: 120 }}
                            />
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </Paper>
              </RadioGroup>
            </FormControl>

            {/* DETALHES DO BACKUP SELECIONADO */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: 'grey.50' }}>
              <Box display="flex" alignItems="flex-start">
                {desc.icon}
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {desc.title}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {desc.description}
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    {desc.advantages.map((advantage, index) => (
                      <Typography component="li" variant="body2" key={index}>
                        {advantage}
                      </Typography>
                    ))}
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {desc.size}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {desc.time}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* PASSO 2: CONFIRMAÇÃO */}
        {activeStep === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <SecurityIcon sx={{ mr: 1 }} />
              <strong>Importante:</strong> O backup será criado e armazenado no servidor.
            </Alert>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Confirmação do Backup
              </Typography>
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body1">
                  <strong>Tipo:</strong> {tipoBackup === 'completo' ? 'Backup Completo' : 'Backup Incremental'}
                </Typography>
                {tipoBackup === 'incremental' && (
                  <Typography variant="body1">
                    <strong>Período:</strong> Últimos {diasIncremental} dias
                  </Typography>
                )}
                <Typography variant="body1">
                  <strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}
                </Typography>
              </Box>

              <Alert severity="warning" sx={{ mt: 2 }}>
                ⚠️ Não desligue o sistema durante o processo de backup.
              </Alert>
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
                  Criando Backup...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Isso pode levar alguns minutos. Por favor, aguarde.
                </Typography>
              </>
            ) : (
              <Alert severity="success">
                Backup criado com sucesso!
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
              onClick={() => setActiveStep(1)}
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
              onClick={handleSubmit}
              disabled={loading}
              startIcon={<BackupIcon />}
            >
              Criar Backup
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

export default CreateBackupModal;