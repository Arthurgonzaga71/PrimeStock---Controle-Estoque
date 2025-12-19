// 📁 frontend/src/pages/EstoqueBaixo/EstoqueBaixo.js
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip,
  Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Tabs, Tab,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField
} from '@mui/material';
import {
  Warning, Error, Inventory2, Add, TrendingDown,
  LocalShipping, Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const EstoqueBaixo = () => {
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [itensCompletos, setItensCompletos] = useState([]); // 🆕 Guarda todos os itens da API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState('todos');
  const [estatisticas, setEstatisticas] = useState({
    critico: 0,
    baixo: 0,
    zero: 0,
    total: 0
  });
  const [dialogAberto, setDialogAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');

  const tabs = [
    { value: 'todos', label: 'Todos', cor: 'warning', icone: <Warning /> },
    { value: 'critico', label: 'Crítico', cor: 'error', icone: <Error /> },
    { value: 'baixo', label: 'Baixo', cor: 'warning', icone: <TrendingDown /> },
    { value: 'zero', label: 'Zero', cor: 'info', icone: <Inventory2 /> }
  ];

  // 📥 CARREGAR TODOS OS ITENS COM ESTOQUE BAIXO (UMA VEZ SÓ)
  const carregarTodosItensEstoqueBaixo = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/itens/alerta/estoque-baixo-detailed?nivel=todos');
      
      if (response.data.success) {
        const resposta = response.data.data;
        const itensRecebidos = resposta.itens || [];
        
        console.log(`✅ Recebidos ${itensRecebidos.length} itens da API`);
        
        // 🎯 SALVA TODOS OS ITENS
        setItensCompletos(itensRecebidos);
        
        // 🎯 CALCULA ESTATÍSTICAS GERAIS
        const estatisticasGerais = calcularEstatisticasReais(itensRecebidos);
        console.log('📊 Estatísticas gerais:', estatisticasGerais);
        
        setEstatisticas(estatisticasGerais);
        
        // 🎯 INICIALMENTE MOSTRA TODOS OS ITENS
        setItens(itensRecebidos);
      } else {
        setError('Erro na resposta da API');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estoque baixo:', error);
      setError('Erro ao carregar itens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 FUNÇÃO PARA CALCULAR ESTATÍSTICAS CORRETAMENTE
  const calcularEstatisticasReais = (itens) => {
    let critico = 0;
    let baixo = 0;
    let zero = 0;
    
    itens.forEach(item => {
      const estoqueMinimo = item.estoque_minimo || 0;
      const quantidade = item.quantidade || 0;
      
      // 🎯 REGRAS CLARAS E SIMPLES:
      
      // 1. ZERO: quantidade = 0
      if (quantidade === 0) {
        zero++;
        return;
      }
      
      // 2. Se não tem estoque mínimo definido (0), NÃO é alerta
      if (estoqueMinimo === 0) {
        return;
      }
      
      // 3. Se está acima do mínimo, NÃO é alerta
      if (quantidade > estoqueMinimo) {
        return;
      }
      
      // 4. Se está abaixo ou igual ao mínimo, verifica o nível
      const porcentagem = (quantidade / estoqueMinimo) * 100;
      
      // CRÍTICO: menos de 2 unidades OU menos de 30% do mínimo
      if (quantidade <= 2 || porcentagem <= 30) {
        critico++;
      } 
      // BAIXO: mais de 2 unidades E entre 31% e 100% do mínimo
      else if (quantidade > 2 && porcentagem <= 100) {
        baixo++;
      }
    });
    
    const total = critico + baixo + zero;
    
    return {
      critico,
      baixo,
      zero,
      total
    };
  };

  // 🎯 FUNÇÃO PARA FILTRAR ITENS POR NÍVEL (USA itensCompletos)
  const filtrarItensPorNivel = (nivel) => {
    if (!itensCompletos || itensCompletos.length === 0) return [];
    
    return itensCompletos.filter(item => {
      const estoqueMinimo = item.estoque_minimo || 0;
      const quantidade = item.quantidade || 0;
      
      switch(nivel) {
        case 'zero':
          return quantidade === 0;
        
        case 'critico':
          if (quantidade === 0) return false;
          if (estoqueMinimo === 0) return false;
          if (quantidade > estoqueMinimo) return false;
          
          const porcentagemCritico = (quantidade / estoqueMinimo) * 100;
          return quantidade <= 2 || porcentagemCritico <= 30;
        
        case 'baixo':
          if (quantidade === 0) return false;
          if (estoqueMinimo === 0) return false;
          if (quantidade > estoqueMinimo) return false;
          
          const porcentagemBaixo = (quantidade / estoqueMinimo) * 100;
          return quantidade > 2 && porcentagemBaixo > 30 && porcentagemBaixo <= 100;
        
        case 'todos':
        default:
          return true;
      }
    });
  };

  // 🎯 MUDAR ABA - FILTRA OS ITENS
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    if (newValue === 'todos') {
      setItens(itensCompletos);
    } else {
      const itensFiltrados = filtrarItensPorNivel(newValue);
      setItens(itensFiltrados);
    }
  };

  // 🎨 OBTER COR DO NÍVEL DE ALERTA
  const getNivelAlerta = (quantidade, estoqueMinimo) => {
    const min = estoqueMinimo || 0;
    const qtd = quantidade || 0;
    
    // ZERO
    if (qtd === 0) {
      return { nivel: 'ZERO', cor: 'error', icone: <Error /> };
    }
    
    // Se não tem mínimo ou está acima do mínimo
    if (min === 0 || qtd > min) {
      return { nivel: 'NORMAL', cor: 'success', icone: <Inventory2 /> };
    }
    
    // Está abaixo ou igual ao mínimo
    const porcentagem = min > 0 ? (qtd / min) * 100 : 0;
    
    // CRÍTICO
    if (qtd <= 2 || porcentagem <= 30) {
      return { nivel: 'CRÍTICO', cor: 'error', icone: <Error /> };
    }
    
    // BAIXO
    return { nivel: 'BAIXO', cor: 'warning', icone: <Warning /> };
  };

  // 📦 REGISTRAR ENTRADA DE ESTOQUE
  const handleRegistrarEntrada = async () => {
    if (!quantidadeEntrada || quantidadeEntrada <= 0) {
      setError('Informe uma quantidade válida');
      return;
    }

    try {
      const response = await api.post('/movimentacoes/registrar-entrada', {
        item_id: itemSelecionado.id,
        quantidade: parseInt(quantidadeEntrada),
        observacao: `Reposição de estoque - Alerta ${tabValue}`
      });

      if (response.data.success) {
        setDialogAberto(false);
        setQuantidadeEntrada('');
        setItemSelecionado(null);
        // Recarrega todos os itens
        carregarTodosItensEstoqueBaixo();
      }
    } catch (error) {
      setError('Erro ao registrar entrada de estoque');
    }
  };

  // 📊 CARDS DE ESTATÍSTICAS - SEMPRE MOSTRA AS GERAIS
  const EstatisticasCards = () => {
    const { critico = 0, baixo = 0, zero = 0, total = 0 } = estatisticas || {};
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Error color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {critico}
                  </Typography>
                  <Typography color="textSecondary">
                    Crítico
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Warning color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {baixo}
                  </Typography>
                  <Typography color="textSecondary">
                    Estoque Baixo
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'info.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Inventory2 color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {zero}
                  </Typography>
                  <Typography color="textSecondary">
                    Estoque Zero
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <LocalShipping color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {total}
                  </Typography>
                  <Typography color="textSecondary">
                    Total de Alertas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // CARREGA APENAS UMA VEZ NO INÍCIO
  useEffect(() => {
    carregarTodosItensEstoqueBaixo();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* 🚨 CABEÇALHO */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          <Warning sx={{ mr: 2, color: 'warning.main' }} />
          Alertas de Estoque
        </Typography>
        <Typography color="textSecondary" sx={{ mb: 3 }}>
          Monitoramento de itens com estoque baixo, crítico ou zerado
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Atenção:</strong> Itens com estoque abaixo do mínimo configurado necessitam de reposição urgente.
        </Alert>
      </Box>

      {/* 📊 ESTATÍSTICAS GERAIS */}
      <EstatisticasCards />

      {/* 🎯 ABAS DE FILTRO */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {tab.icone}
                    {tab.label}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 🔄 LOADING */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* ❌ ERRO */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 📋 TABELA DE ITENS */}
      {!loading && itens.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Itens com Estoque {tabs.find(t => t.value === tabValue)?.label}
                <Typography variant="caption" sx={{ ml: 1 }}>
                  ({itens.length} itens)
                </Typography>
              </Typography>
              
              <Button
                startIcon={<Refresh />}
                onClick={() => carregarTodosItensEstoqueBaixo()}
              >
                Atualizar
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Item</strong></TableCell>
                    <TableCell><strong>Categoria</strong></TableCell>
                    <TableCell><strong>Estoque Atual</strong></TableCell>
                    <TableCell><strong>Mínimo</strong></TableCell>
                    <TableCell><strong>Nível</strong></TableCell>
                    <TableCell><strong>Localização</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itens.map((item) => {
                    const alerta = getNivelAlerta(item.quantidade, item.estoque_minimo);
                    
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Box>
                            <Typography fontWeight="600">
                              {item.nome}
                            </Typography>
                            {item.patrimonio && (
                              <Typography variant="caption" color="textSecondary">
                                {item.patrimonio}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Chip 
                            label={item.categoria?.nome} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Typography 
                            fontWeight="bold"
                            color={alerta.cor}
                          >
                            {item.quantidade}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography color="textSecondary">
                            {item.estoque_minimo}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            icon={alerta.icone}
                            label={alerta.nivel}
                            color={alerta.cor}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {item.localizacao || 'Não informada'}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Box display="flex" gap={1}>
                          
                            
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => navigate(`/itens/editar/${item.id}`)}
                            >
                              Editar
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* 📭 ESTADO VAZIO */}
      {!loading && itens.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Inventory2 sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {tabValue === 'todos' ? '🎉 Nenhum alerta de estoque!' : '📭 Nenhum item nesta categoria'}
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              {tabValue === 'todos' 
                ? 'Todos os itens estão com estoque adequado.'
                : `Não há itens classificados como "${tabs.find(t => t.value === tabValue)?.label}".`
              }
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => tabValue !== 'todos' ? setTabValue('todos') : navigate('/itens')}
            >
              {tabValue !== 'todos' ? 'Ver Todos os Alertas' : 'Ver Todos os Itens'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 📦 DIALOG DE REPOSIÇÃO */}
      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)}>
        <DialogTitle>
          <Add sx={{ mr: 1 }} />
          Repor Estoque
        </DialogTitle>
        
        <DialogContent>
          {itemSelecionado && (
            <>
              <Typography gutterBottom>
                <strong>Item:</strong> {itemSelecionado.nome}
              </Typography>
              
              <Box display="flex" gap={2} mb={2}>
                <Typography variant="body2">
                  <strong>Estoque Atual:</strong> {itemSelecionado.quantidade}
                </Typography>
                <Typography variant="body2">
                  <strong>Mínimo:</strong> {itemSelecionado.estoque_minimo}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Quantidade para adicionar"
                type="number"
                value={quantidadeEntrada}
                onChange={(e) => setQuantidadeEntrada(e.target.value)}
                inputProps={{ min: 1 }}
                helperText="Informe a quantidade que está entrando no estoque"
              />
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRegistrarEntrada}
            variant="contained"
            disabled={!quantidadeEntrada || quantidadeEntrada <= 0}
          >
            Confirmar Entrada
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EstoqueBaixo;