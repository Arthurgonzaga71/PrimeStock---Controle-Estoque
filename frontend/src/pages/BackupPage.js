import React from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Home as HomeIcon,
  Backup as BackupIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

import BackupManager from '../components/Backup/BackupManager';

const BackupPage = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* BREADCRUMB */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 4 }}>
        <Link
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <BackupIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Backup do Sistema
        </Typography>
      </Breadcrumbs>

      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <BackupIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Sistema de Backup e Restauração
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
          Proteja seus dados com backups completos e incrementais. 
          Restaure o sistema para estados anteriores em caso de problemas.
          Mantenha cópias de segurança regulares para garantir a continuidade do negócio.
        </Typography>
      </Box>

      {/* COMPONENTE PRINCIPAL */}
      <BackupManager />
    </Container>
  );
};

export default BackupPage;