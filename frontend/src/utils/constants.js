// src/utils/constants.js - VERSÃO TOTALMENTE CORRIGIDA
// =============================================
// CONSTANTES BASEADAS NO SEU BANCO DE DADOS
// =============================================

// 👥 PERFIS DE USUÁRIO (SEU ENUM)
export const PERFIS_USUARIO = {
  ADMIN: 'admin',
  COORDENADOR: 'coordenador', 
  TECNICO: 'tecnico',
  ESTAGIARIO: 'estagiario'
};

// 📦 STATUS DOS ITENS (SEU ENUM)
export const ITEM_STATUS = {
  DISPONIVEL: 'disponivel',
  EM_USO: 'em_uso',
  MANUTENCAO: 'manutencao', 
  DESCARTE: 'descarte',
  RESERVADO: 'reservado'
};

// 🔧 ESTADO DOS ITENS (SEU ENUM)
export const ITEM_ESTADO = {
  NOVO: 'novo',
  USADO: 'usado',
  DANIFICADO: 'danificado',
  IRRECUPERAVEL: 'irrecuperavel'
};

// 🔄 TIPOS DE MOVIMENTAÇÃO (SEU ENUM)
export const TIPO_MOVIMENTACAO = {
  ENTRADA: 'entrada',
  SAIDA: 'saida',
  DEVOLUCAO: 'devolucao',
  AJUSTE: 'ajuste',
  TRANSFERENCIA: 'transferencia'
};

// 🛠️ TIPOS DE MANUTENÇÃO (SEU ENUM)
export const TIPO_MANUTENCAO = {
  PREVENTIVA: 'preventiva',
  CORRETIVA: 'corretiva',
  INSTALACAO: 'instalacao'
};

// 📊 STATUS DAS MANUTENÇÕES (SEU ENUM) - ✅ CORREÇÃO: REMOVIDA CHAVE DUPLICADA
export const STATUS_MANUTENCAO = {
  ABERTA: 'aberta',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada'
};

// 🗂️ CATEGORIAS DO SEU BANCO (DOS SEUS DADOS INICIAIS)
export const CATEGORIAS = {
  1: 'Notebooks',
  2: 'Periféricos', 
  3: 'Rede e Conectividade',
  4: 'Hardware',
  5: 'Software',
  6: 'Cabos e Adaptadores',
  7: 'Telefonia',
  8: 'Segurança',
  9: 'Componentes'
};

// 🎨 CORES PARA STATUS (VISUAL)
export const STATUS_COLORS = {
  // Status dos Itens
  disponivel: { bg: '#10b981', text: 'white' },
  em_uso: { bg: '#3b82f6', text: 'white' },
  manutencao: { bg: '#f59e0b', text: 'white' },
  descarte: { bg: '#6b7280', text: 'white' },
  reservado: { bg: '#8b5cf6', text: 'white' },
  
  // Estado dos Itens
  novo: { bg: '#10b981', text: 'white' },
  usado: { bg: '#3b82f6', text: 'white' },
  danificado: { bg: '#ef4444', text: 'white' },
  irrecuperavel: { bg: '#6b7280', text: 'white' },
  
  // Tipos de Movimentação
  entrada: { bg: '#10b981', text: 'white' },
  saida: { bg: '#ef4444', text: 'white' },
  devolucao: { bg: '#3b82f6', text: 'white' },
  ajuste: { bg: '#8b5cf6', text: 'white' },
  transferencia: { bg: '#f59e0b', text: 'white' },
  
  // Tipos de Manutenção
  preventiva: { bg: '#10b981', text: 'white' },
  corretiva: { bg: '#ef4444', text: 'white' },
  instalacao: { bg: '#3b82f6', text: 'white' },
  
  // Status das Manutenções
  aberta: { bg: '#ef4444', text: 'white' },
  em_andamento: { bg: '#f59e0b', text: 'white' },
  concluida: { bg: '#10b981', text: 'white' },
  cancelada: { bg: '#6b7280', text: 'white' }
};

// 📝 LABELS EM PORTUGUÊS
export const LABELS = {
  // Perfis
  admin: 'Administrador',
  coordenador: 'Coordenador',
  tecnico: 'Técnico',
  estagiario: 'Estagiário',
  
  // Status Itens
  disponivel: 'Disponível',
  em_uso: 'Em Uso',
  manutencao: 'Manutenção',
  descarte: 'Descarte',
  reservado: 'Reservado',
  
  // Estado Itens
  novo: 'Novo',
  usado: 'Usado',
  danificado: 'Danificado',
  irrecuperavel: 'Irrecuperável',
  
  // Movimentações
  entrada: 'Entrada',
  saida: 'Saída',
  devolucao: 'Devolução',
  ajuste: 'Ajuste',
  transferencia: 'Transferência',
  
  // Manutenções - Tipos
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
  instalacao: 'Instalação',
  
  // Manutenções - Status
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

// 🔐 CONFIGURAÇÕES DO JWT (SUA CHAVE)
export const JWT_CONFIG = {
  SECRET_KEY: "controle_estoque_ti_secret_key_2024_definitivo",
  EXPIRES_IN: "30d"
};

// 📊 CONFIGURAÇÕES DA API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  TIMEOUT: 10000,
  UPLOAD_PATH: '/uploads'
};

// 🎯 PERMISSÕES POR PERFIL
export const PERMISSOES = {
  admin: ['create', 'read', 'update', 'delete', 'manage_users', 'export'],
  coordenador: ['create', 'read', 'update', 'delete', 'export'],
  tecnico: ['create', 'read', 'update'],
  estagiario: ['read']
};

// 📞 FORMATO DE RESPOSTA DA SUA API
export const API_RESPONSE_FORMAT = {
  SUCCESS: 'success',
  MESSAGE: 'message',
  DATA: 'data',
  ERROR: 'error',
  PAGINATION: 'pagination'
};

// 📈 CONFIGURAÇÕES DE PAGINAÇÃO
export const PAGINACAO = {
  LIMITE_PADRAO: 10,
  LIMITE_MAXIMO: 100,
  PAGINA_INICIAL: 1
};

// 🔔 CONFIGURAÇÕES DE NOTIFICAÇÃO
export const NOTIFICACOES = {
  TEMPO_EXIBICAO: 5000,
  POSICAO: 'top-right'
};

// 🎨 CORES DO TEMA
export const CORES = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#6b7280',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#06b6d4',
  
  // Cores de texto
  TEXT_PRIMARY: '#1f2937',
  TEXT_SECONDARY: '#6b7280',
  TEXT_LIGHT: '#9ca3af',
  
  // Cores de fundo
  BG_PRIMARY: '#ffffff',
  BG_SECONDARY: '#f9fafb',
  BG_DARK: '#111827',
  
  // Cores de borda
  BORDER: '#e5e7eb',
  BORDER_LIGHT: '#f3f4f6'
};

// 📱 BREAKPOINTS RESPONSIVOS
export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1280px'
};

// 📅 CONFIGURAÇÕES DE DATA
export const DATA_CONFIG = {
  FORMATO_DATA: 'dd/MM/yyyy',
  FORMATO_DATA_HORA: 'dd/MM/yyyy HH:mm',
  FORMATO_DATA_ISO: 'yyyy-MM-dd',
  LOCALE: 'pt-BR'
};

// 💰 CONFIGURAÇÕES MONETÁRIAS
export const MONETARIO = {
  MOEDA: 'BRL',
  LOCALE: 'pt-BR',
  CASAS_DECIMAIS: 2
};

// 🎯 VALIDAÇÕES
export const VALIDACOES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SENHA_MIN_LENGTH: 6,
  TELEFONE: /^(\+\d{1,3})?\s?\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
};

// 🔧 CONFIGURAÇÕES DO SISTEMA
export const SISTEMA = {
  NOME: 'Sistema de Controle de Estoque - TI',
  VERSAO: '2.0.0',
  DESCRICAO: 'Sistema completo de gestão de patrimônio e estoque do setor de TI',
  ANO: '2024'
};

// =============================================
// 🆕 CONSTANTES ADICIONADAS PARA MOVIMENTAÇÕES
// =============================================

// 📋 TIPOS DE MOVIMENTAÇÃO (PARA FRONTEND)
export const MOVIMENTACOES_TIPOS = {
  entrada: 'Entrada no Estoque',
  saida: 'Saída do Estoque', 
  devolucao: 'Devolução',
  ajuste: 'Ajuste de Estoque',
  transferencia: 'Transferência'
};

// 🏷️ STATUS DE MOVIMENTAÇÃO
export const MOVIMENTACOES_STATUS = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

// 📊 CORES E ÍCONES PARA TIPOS DE MOVIMENTAÇÃO
export const MOVIMENTACOES_CONFIG = {
  entrada: { cor: '#28a745', icone: '📥', label: 'Entrada' },
  saida: { cor: '#ffc107', icone: '📤', label: 'Saída' },
  devolucao: { cor: '#17a2b8', icone: '🔄', label: 'Devolução' },
  ajuste: { cor: '#6c757d', icone: '⚙️', label: 'Ajuste' },
  transferencia: { cor: '#007bff', icone: '🔄', label: 'Transferência' }
};

// 📅 PRAZOS DE DEVOLUÇÃO (dias)
export const PRAZOS_DEVOLUCAO = {
  CURTO: 7,
  PADRAO: 15,
  LONGO: 30
};

// 🏢 DEPARTAMENTOS COMUNS
export const DEPARTAMENTOS = [
  'TI',
  'Administrativo',
  'Financeiro',
  'Marketing',
  'Vendas',
  'RH',
  'Operações',
  'Atendimento',
  'Desenvolvimento',
  'Suporte'
];

// 🔄 AÇÕES DE MOVIMENTAÇÃO
export const MOVIMENTACOES_ACOES = {
  REGISTRAR_SAIDA: 'registrar_saida',
  REGISTRAR_DEVOLUCAO: 'registrar_devolucao',
  VER_DETALHES: 'ver_detalhes',
  EDITAR: 'editar',
  CANCELAR: 'cancelar'
};

// 📈 ESTATÍSTICAS DE MOVIMENTAÇÕES
export const MOVIMENTACOES_ESTATISTICAS = {
  TOTAL_MOVIMENTACOES: 'total_movimentacoes',
  SAIDAS_MES: 'saidas_mes',
  DEVOLUCOES_ATRASADAS: 'devolucoes_atrasadas',
  MOVIMENTACOES_POR_TIPO: 'movimentacoes_por_tipo'
};

// 🔍 FILTROS DE MOVIMENTAÇÕES
export const MOVIMENTACOES_FILTROS = {
  TIPO: 'tipo',
  ITEM_ID: 'item_id',
  DATA_INICIO: 'data_inicio',
  DATA_FIM: 'data_fim',
  USUARIO_ID: 'usuario_id'
};

// =============================================
// 🆕 CONSTANTES ADICIONADAS PARA MANUTENÇÕES
// =============================================

// 🛠️ CONFIGURAÇÕES DE MANUTENÇÃO
export const MANUTENCOES_CONFIG = {
  preventiva: { cor: '#28a745', icone: '🛡️', label: 'Preventiva' },
  corretiva: { cor: '#dc3545', icone: '🔧', label: 'Corretiva' },
  instalacao: { cor: '#007bff', icone: '💻', label: 'Instalação' }
};

export const STATUS_MANUTENCAO_CONFIG = {
  aberta: { cor: '#dc3545', icone: '⏳', label: 'Aberta' },
  em_andamento: { cor: '#ffc107', icone: '🔧', label: 'Em Andamento' },
  concluida: { cor: '#28a745', icone: '✅', label: 'Concluída' },
  cancelada: { cor: '#6c757d', icone: '❌', label: 'Cancelada' }
};

// 🏢 FORNECEDORES COMUNS
export const FORNECEDORES_MANUTENCAO = [
  'Assistência Técnica Autorizada',
  'Fornecedor Original',
  'Terceirizada Local',
  'Equipe Interna TI',
  'Outro'
];

// 📅 PRIORIDADES DE MANUTENÇÃO
export const PRIORIDADES_MANUTENCAO = {
  BAIXA: 'baixa',
  MEDIA: 'media', 
  ALTA: 'alta',
  URGENTE: 'urgente'
};

// 🔧 AÇÕES DE MANUTENÇÃO
export const MANUTENCOES_ACOES = {
  REGISTRAR_MANUTENCAO: 'registrar_manutencao',
  INICIAR_MANUTENCAO: 'iniciar_manutencao',
  CONCLUIR_MANUTENCAO: 'concluir_manutencao',
  CANCELAR_MANUTENCAO: 'cancelar_manutencao',
  VER_DETALHES: 'ver_detalhes',
  EDITAR: 'editar'
};

// 📊 ESTATÍSTICAS DE MANUTENÇÕES
export const MANUTENCOES_ESTATISTICAS = {
  TOTAL_MANUTENCOES: 'total_manutencoes',
  ABERTAS: 'abertas',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDAS: 'concluidas',
  MANUTENCOES_POR_TIPO: 'manutencoes_por_tipo',
  CUSTO_TOTAL: 'custo_total'
};

// 🔍 FILTROS DE MANUTENÇÕES
export const MANUTENCOES_FILTROS = {
  TIPO: 'tipo_manutencao',
  STATUS: 'status',
  ITEM_ID: 'item_id',
  DATA_INICIO: 'data_inicio',
  DATA_FIM: 'data_fim',
  TECNICO_ID: 'usuario_id'
};

// Atualizar LABELS com todas as novas entradas
Object.assign(LABELS, {
  // Ações de Movimentação
  registrar_saida: 'Registrar Saída',
  registrar_devolucao: 'Registrar Devolução',
  ver_detalhes: 'Ver Detalhes',
  
  // Estatísticas de Movimentação
  total_movimentacoes: 'Total de Movimentações',
  saidas_mes: 'Saídas no Mês',
  devolucoes_atrasadas: 'Devoluções Atrasadas',
  movimentacoes_por_tipo: 'Movimentações por Tipo',
  
  // Departamentos
  TI: 'TI',
  Administrativo: 'Administrativo',
  Financeiro: 'Financeiro',
  Marketing: 'Marketing',
  Vendas: 'Vendas',
  RH: 'Recursos Humanos',
  Operações: 'Operações',
  Atendimento: 'Atendimento',
  Desenvolvimento: 'Desenvolvimento',
  Suporte: 'Suporte',
  
  // Tipos de Manutenção
  preventiva: 'Preventiva',
  corretiva: 'Corretiva', 
  instalacao: 'Instalação',
  
  // Status de Manutenção
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  
  // Prioridades
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
  
  // Ações de Manutenção
  registrar_manutencao: 'Registrar Manutenção',
  iniciar_manutencao: 'Iniciar Manutenção',
  concluir_manutencao: 'Concluir Manutenção',
  cancelar_manutencao: 'Cancelar Manutenção',
  
  // Estatísticas de Manutenção
  total_manutencoes: 'Total de Manutenções',
  abertas: 'Abertas',
  em_andamento: 'Em Andamento',
  concluidas: 'Concluídas',
  manutencoes_por_tipo: 'Manutenções por Tipo',
  custo_total: 'Custo Total'
});

// ✅ CORREÇÃO: Exportar como objeto nomeado em vez de default
const CONSTANTS = {
  PERFIS_USUARIO,
  ITEM_STATUS,
  ITEM_ESTADO,
  TIPO_MOVIMENTACAO,
  TIPO_MANUTENCAO,
  STATUS_MANUTENCAO,
  CATEGORIAS,
  STATUS_COLORS,
  LABELS,
  JWT_CONFIG,
  API_CONFIG,
  PERMISSOES,
  API_RESPONSE_FORMAT,
  PAGINACAO,
  NOTIFICACOES,
  CORES,
  BREAKPOINTS,
  DATA_CONFIG,
  MONETARIO,
  VALIDACOES,
  SISTEMA,
  // Constantes de Movimentações
  MOVIMENTACOES_TIPOS,
  MOVIMENTACOES_STATUS,
  MOVIMENTACOES_CONFIG,
  PRAZOS_DEVOLUCAO,
  DEPARTAMENTOS,
  MOVIMENTACOES_ACOES,
  MOVIMENTACOES_ESTATISTICAS,
  MOVIMENTACOES_FILTROS,
  // Constantes de Manutenções
  MANUTENCOES_CONFIG,
  STATUS_MANUTENCAO_CONFIG,
  FORNECEDORES_MANUTENCAO,
  PRIORIDADES_MANUTENCAO,
  MANUTENCOES_ACOES,
  MANUTENCOES_ESTATISTICAS,
  MANUTENCOES_FILTROS
};

export default CONSTANTS;