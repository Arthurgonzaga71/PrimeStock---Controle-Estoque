// frontend/src/pages/ConsultaCadastroRapido.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, Card, CardContent, Typography, Button,
  Alert, CircularProgress, Grid, MenuItem, Paper, Divider,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Stepper, Step, StepLabel
} from '@mui/material';
import {
  QrCodeScanner,
  Save,
  Clear,
  Add,
  Search,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ConsultaCadastroRapido = () => {
  const navigate = useNavigate();
  const [codigoBarras, setCodigoBarras] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [etapaAtiva, setEtapaAtiva] = useState(0);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria_id: '',
    localizacao: 'Almoxarifado TI',
    status: 'disponivel',
    estado: 'novo',
    numero_serie: '',
    patrimonio: '',
    quantidade: 1,
    estoque_minimo: 0,
    valor_compra: '',
    fornecedor: ''
  });

  const [categorias, setCategorias] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setError('Erro ao carregar categorias');
    }
  };

  const consultarCodigo = async (codigo) => {
    if (!codigo || codigo.length < 3) return;
    
    setLoading(true);
    setError('');
    setResultadoConsulta(null);
    setEtapaAtiva(0);

    try {
      console.log(`🔍 Consultando código: ${codigo}`);
      const response = await api.get(`/itens/codigo-barras/${codigo}`);
      
      if (response.data.success) {
        setResultadoConsulta(response.data);
        
        if (!response.data.encontrado) {
          setEtapaAtiva(1);
          
          if (response.data.sugestao_cadastro) {
            const sugestao = response.data.sugestao_cadastro;
            setFormData(prev => ({
              ...prev,
              nome: sugestao.nome,
              descricao: sugestao.descricao,
              categoria_id: sugestao.categoria_id,
              fornecedor: sugestao.fabricante || ''
            }));
          } else {
            setFormData({
              nome: `Equipamento ${codigo}`,
              descricao: '',
              categoria_id: '',
              localizacao: 'Almoxarifado TI',
              status: 'disponivel',
              estado: 'novo',
              numero_serie: `COD-${codigo}`,
              patrimonio: `PAT-${Date.now()}`,
              quantidade: 1,
              estoque_minimo: 0,
              valor_compra: '',
              fornecedor: ''
            });
          }
          
          setTimeout(() => {
            setDialogAberto(true);
          }, 500);
        }
      }
    } catch (error) {
      console.error('💥 Erro na consulta:', error);
      if (error.response?.status === 404) {
        setError('Código não encontrado. Você pode cadastrar um novo equipamento.');
        setEtapaAtiva(1);
        setDialogAberto(true);
      } else {
        setError('Erro ao consultar código de barras. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cadastrarItem = async () => {
    setLoading(true);
    setError('');

    try {
      const dadosCadastro = {
        codigo_barras: codigoBarras,
        ...formData
      };

      const response = await api.post('/itens/cadastro-rapido', dadosCadastro);
      
      if (response.data.success) {
        setSuccess('✅ Equipamento cadastrado com sucesso!');
        setResultadoConsulta({
          encontrado: true,
          data: response.data.data,
          mensagem: 'Item cadastrado com sucesso!'
        });
        setEtapaAtiva(0);
        setDialogAberto(false);
        
        setTimeout(() => {
          setCodigoBarras('');
          setSuccess('');
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 3000);
      }
    } catch (error) {
      console.error('💥 Erro no cadastro:', error);
      setError(error.response?.data?.message || 'Erro ao cadastrar equipamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCodigoBarrasChange = (codigo) => {
    setCodigoBarras(codigo);
    setSuccess('');
    setError('');
    setResultadoConsulta(null);
    
    if (codigo.length >= 6) {
      consultarCodigo(codigo);
    }
  };

  const limparTudo = () => {
    setCodigoBarras('');
    setResultadoConsulta(null);
    setEtapaAtiva(0);
    setSuccess('');
    setError('');
    setFormData({
      nome: '',
      descricao: '',
      categoria_id: '',
      localizacao: 'Almoxarifado TI',
      status: 'disponivel',
      estado: 'novo',
      numero_serie: '',
      patrimonio: '',
      quantidade: 1,
      estoque_minimo: 0,
      valor_compra: '',
      fornecedor: ''
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const abrirDialogCadastro = () => {
    setDialogAberto(true);
  };

  const fecharDialogCadastro = () => {
    setDialogAberto(false);
    setEtapaAtiva(0);
  };

  const steps = ['Consulta', 'Cadastro'];

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', p: 3 }}>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          <QrCodeScanner sx={{ mr: 2, fontSize: 32 }} />
          🔍 Consulta & Cadastro Rápido
        </Typography>
        <Typography variant="subtitle1">
          Escaneie o código de barras para consultar ou cadastrar equipamentos apenas em Notebook
        </Typography>
      </Paper>

      <Stepper activeStep={etapaAtiva} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            label="Código de Barras"
            variant="outlined"
            value={codigoBarras}
            onChange={(e) => handleCodigoBarrasChange(e.target.value)}
            placeholder="Escaneie o código de barras do equipamento..."
            disabled={loading}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ mb: 2 }}
            autoComplete="off"
          />

          {loading && (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Consultando...
              </Typography>
            </Box>
          )}

          {resultadoConsulta && (
            <Box>
              <Divider sx={{ my: 2 }} />
              
              {resultadoConsulta.encontrado ? (
                <Alert severity="success" icon={<CheckCircle />}>
                  <Typography variant="h6" gutterBottom>
                    ✅ Item Encontrado no Sistema
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography><strong>Nome:</strong> {resultadoConsulta.data.nome}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>Categoria:</strong> {resultadoConsulta.data.categoria?.nome}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>Status:</strong> 
                        <Chip 
                          label={resultadoConsulta.data.status} 
                          color="primary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>Localização:</strong> {resultadoConsulta.data.localizacao}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>Quantidade:</strong> {resultadoConsulta.data.quantidade}</Typography>
                    </Grid>
                  </Grid>
                </Alert>
              ) : (
                <Alert 
                  severity="info" 
                  icon={<Info />}
                  action={
                    <Button 
                      color="inherit" 
                      size="small"
                      onClick={abrirDialogCadastro}
                      startIcon={<Add />}
                    >
                      CADASTRAR
                    </Button>
                  }
                >
                  <Typography variant="h6" gutterBottom>
                    📦 Item Não Encontrado
                  </Typography>
                  <Typography>{resultadoConsulta.mensagem}</Typography>
                  {resultadoConsulta.sugestao_cadastro && (
                    <Chip 
                      label={`Sugestão: ${resultadoConsulta.sugestao_cadastro.nome}`}
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      icon={<CheckCircle />}
                    />
                  )}
                </Alert>
              )}
            </Box>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={limparTudo}
              disabled={loading}
            >
              Limpar
            </Button>
            
            <Button
              variant="contained"
              startIcon={<QrCodeScanner />}
              onClick={() => inputRef.current?.focus()}
            >
              Novo Código
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog 
        open={dialogAberto} 
        onClose={fecharDialogCadastro}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Add sx={{ mr: 1 }} />
          Cadastrar Novo Equipamento
          {resultadoConsulta?.sugestao_cadastro && (
            <Chip 
              label="Reconhecimento Automático"
              color="success"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            <strong>Código de Barras:</strong> {codigoBarras}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Equipamento *"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Categoria *"
                value={formData.categoria_id}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                required
              >
                <MenuItem value="">Selecione uma categoria...</MenuItem>
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fornecedor"
                value={formData.fornecedor}
                onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={fecharDialogCadastro} 
            disabled={loading}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={cadastrarItem}
            variant="contained"
            disabled={loading || !formData.nome || !formData.categoria_id}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper elevation={1} sx={{ p: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          📋 Como usar o sistema:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li><strong>Escaneie o código de barras</strong> do equipamento</li>
          <li><strong>Se o item existir:</strong> O sistema mostra todas as informações</li>
          <li><strong>Se não existir:</strong> Reconhece automaticamente e sugere cadastro</li>
          <li><strong>Confirme os dados</strong> e cadastre rapidamente</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConsultaCadastroRapido;