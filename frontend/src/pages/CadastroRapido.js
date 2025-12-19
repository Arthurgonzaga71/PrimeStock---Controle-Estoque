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
  Info,
  Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ConsultaCadastroRapido = () => {
  const navigate = useNavigate();
  const [codigoBarras, setCodigoBarras] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [etapaAtiva, setEtapaAtiva] = useState(0); // 0=Consulta, 1=Cadastro
  
  // Estado do formulário de cadastro
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

  // Carregar categorias
  useEffect(() => {
    carregarCategorias();
  }, []);

  // Focar no input automaticamente
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

  // 🔍 CONSULTAR CÓDIGO DE BARRAS
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
        console.log('📊 Resultado da consulta:', response.data);
        
        // SE NÃO ENCONTROU, PREPARAR CADASTRO
        if (!response.data.encontrado) {
          setEtapaAtiva(1);
          
          // SE TEM SUGESTÃO, PREENCHER AUTOMATICAMENTE
          if (response.data.sugestao_cadastro) {
            const sugestao = response.data.sugestao_cadastro;
            console.log('🎯 Sugestão automática:', sugestao);
            
            setFormData(prev => ({
              ...prev,
              nome: sugestao.nome,
              descricao: sugestao.descricao,
              categoria_id: sugestao.categoria_id,
              fornecedor: sugestao.fabricante || ''
            }));
          } else {
            // SE NÃO TEM SUGESTÃO, PREENCHER COM DADOS BÁSICOS
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
          
          // ABRIR DIALOG AUTOMATICAMENTE SE NÃO ENCONTROU
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

  // 📦 CADASTRAR ITEM
  const cadastrarItem = async () => {
    setLoading(true);
    setError('');

    try {
      const dadosCadastro = {
        codigo_barras: codigoBarras,
        ...formData
      };

      console.log('📤 Enviando dados para cadastro:', dadosCadastro);
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
        
        // Limpar para próxima consulta
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

  // 🎯 MUDANÇA NO CÓDIGO DE BARRAS
  const handleCodigoBarrasChange = (codigo) => {
    setCodigoBarras(codigo);
    setSuccess('');
    setError('');
    setResultadoConsulta(null);
    
    // Consultar automaticamente quando código for completo
    if (codigo.length >= 6) {
      consultarCodigo(codigo);
    }
  };

  // 🔄 LIMPAR TUDO
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

  // 🎨 FUNÇÕES AUXILIARES
  const getStatusColor = (status) => {
    const colors = {
      disponivel: 'success',
      em_uso: 'info',
      manutencao: 'warning',
      descarte: 'error',
      reservado: 'secondary'
    };
    return colors[status] || 'default';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      novo: 'success',
      usado: 'info',
      danificado: 'warning',
      irrecuperavel: 'error'
    };
    return colors[estado] || 'default';
  };

  const steps = ['Consulta', 'Cadastro'];

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', p: 3 }}>
      
      {/* CABEÇALHO */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          <QrCodeScanner sx={{ mr: 2, fontSize: 32 }} />
          🔍 Consulta & Cadastro Rápido
        </Typography>
        <Typography variant="subtitle1">
          Escaneie o código de barras para consultar ou cadastrar equipamentos Apenas em notebook!
          
        </Typography>
      </Paper>

      {/* STEPPER */}
      <Stepper activeStep={etapaAtiva} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* CAMPO DE CONSULTA */}
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

          {/* RESULTADO DA CONSULTA */}
          {resultadoConsulta && (
            <Box>
              <Divider sx={{ my: 2 }} />
              
              {resultadoConsulta.encontrado ? (
                // ✅ ITEM ENCONTRADO NO BANCO
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
                          color={getStatusColor(resultadoConsulta.data.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>Estado:</strong> 
                        <Chip 
                          label={resultadoConsulta.data.estado} 
                          color={getEstadoColor(resultadoConsulta.data.estado)}
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
                    {resultadoConsulta.data.numero_serie && (
                      <Grid item xs={12} md={6}>
                        <Typography><strong>Nº Série:</strong> {resultadoConsulta.data.numero_serie}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Alert>
              ) : (
                // ❌ ITEM NÃO ENCONTRADO - SUGERIR CADASTRO
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

          {/* MENSAGENS DE FEEDBACK */}
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

          {/* BOTÕES DE AÇÃO */}
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

      {/* DIALOG DE CADASTRO */}
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
                helperText="Nome descritivo do equipamento"
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
                helperText="Selecione a categoria do equipamento"
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
                helperText="Fabricante ou fornecedor"
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
                helperText="Descrição detalhada e especificações"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de Série"
                value={formData.numero_serie}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                helperText="Preenchido automaticamente se vazio"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Patrimônio"
                value={formData.patrimonio}
                onChange={(e) => setFormData(prev => ({ ...prev, patrimonio: e.target.value }))}
                helperText="Gerado automaticamente se vazio"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Localização"
                value={formData.localizacao}
                onChange={(e) => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
              >
                <MenuItem value="Almoxarifado TI">Almoxarifado TI</MenuItem>
                <MenuItem value="Sala Servidores">Sala Servidores</MenuItem>
                <MenuItem value="Setor Administrativo">Setor Administrativo</MenuItem>
                <MenuItem value="Setor Comercial">Setor Comercial</MenuItem>
                <MenuItem value="Setor Produção">Setor Produção</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="disponivel">Disponível</MenuItem>
                <MenuItem value="em_uso">Em Uso</MenuItem>
                <MenuItem value="manutencao">Manutenção</MenuItem>
                <MenuItem value="reservado">Reservado</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={formData.estado}
                onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
              >
                <MenuItem value="novo">Novo</MenuItem>
                <MenuItem value="usado">Usado</MenuItem>
                <MenuItem value="danificado">Danificado</MenuItem>
                <MenuItem value="irrecuperavel">Irrecuperável</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantidade"
                value={formData.quantidade}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Valor de Compra (R$)"
                value={formData.valor_compra}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_compra: parseFloat(e.target.value) || '' }))}
                inputProps={{ step: "0.01", min: "0" }}
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

      {/* INSTRUÇÕES */}
      <Paper elevation={1} sx={{ p: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          📋 Como usar o sistema:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li><strong>Escaneie o código de barras</strong> do equipamento</li>
          <li><strong>Se o item existir:</strong> O sistema mostra todas as informações</li>
          <li><strong>Se não existir:</strong> 
            <ul>
              <li>Reconhece automaticamente pelo prefixo do código</li>
              <li>Sugere o nome e categoria corretos</li>
              <li>Você confirma e cadastra rapidamente</li>
            </ul>
          </li>
          <li><strong>Próximo equipamento:</strong> O sistema já reconhece automaticamente!</li>
        </Box>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            🎯 Exemplos de reconhecimento automático:
          </Typography>
          <Typography variant="body2">
            <strong>3b0602749372</strong> → MikroTik Router hAP ac3<br/>
            <strong>3b060232a806</strong> → MikroTik Router hAP ac3<br/>
            <strong>DL5420ABC123</strong> → Dell Latitude<br/>
            <strong>LENT14XYZ789</strong> → Lenovo ThinkPad
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default ConsultaCadastroRapido;