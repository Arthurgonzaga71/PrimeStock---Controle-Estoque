// ============================================================================
// App.js - VERSÃO DEFINITIVA CORRIGIDA
// TODOS OS IMPORTS DEVEM VIR NO TOPO, ANTES DE QUALQUER CÓDIGO
// ============================================================================

// REACT & ROUTER IMPORTS
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

// CONTEXTS IMPORTS
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SolicitacaoProvider } from './contexts/SolicitacaoContext';
import { EquipeProvider } from './contexts/EquipeContext';

// COMPONENTS IMPORTS
import { Navbar } from './components/UI/Layout';
import PrivateRoute from './components/PrivateRoute';

// PAGES IMPORTS (Não lazy - usados diretamente)
import DashboardAprovacao from './pages/Dashboard/DashboardAprovacao';
import PendentesAprovacao from './pages/Solicitacoes/PendentesAprovacao';
import EstoqueDashboard from './pages/Dashboard/EstoqueDashboard';
import CadastroRapido from './pages/CadastroRapido';
import ConsultaCadastroRapido from './pages/ConsultaCadastroRapido';
import EstoqueBaixo from './pages/EstoqueBaixo';

// STYLES
import './App.css';

// ============================================================================
// LAZY IMPORTS - TODOS AQUI, NENHUM DEPOIS DESTA SEÇÃO
// ============================================================================

// 🔐 AUTH
const Login = lazy(() => import('./pages/Login/Login'));

// 📊 DASHBOARD
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));

// 📦 ITENS
const ItensList = lazy(() => import('./pages/Itens/ItensList'));
const ItemForm = lazy(() => import('./pages/Itens/ItemForm'));
const ItemView = lazy(() => import('./pages/Itens/ItemView'));

// 🔄 MOVIMENTAÇÕES
const MovimentacoesList = lazy(() => import('./pages/Movimentacoes/MovimentacoesList'));
const MovimentacaoForm = lazy(() => import('./pages/Movimentacoes/MovimentacaoForm'));
const RegistrarSaida = lazy(() => import('./pages/Movimentacoes/RegistrarSaida'));
const RegistrarDevolucao = lazy(() => import('./pages/Movimentacoes/RegistrarDevolucao'));
const MovimentacoesDashboard = lazy(() => import('./pages/Movimentacoes/MovimentacoesDashboard'));
const MovimentacaoDetails = lazy(() => import('./pages/Movimentacoes/MovimentacaoDetails'));

// 🛠️ MANUTENÇÕES
const ManutencoesList = lazy(() => import('./pages/Manutencoes/ManutencoesList'));
const ManutencaoForm = lazy(() => import('./pages/Manutencoes/ManutencaoForm'));
const RegistrarManutencao = lazy(() => import('./pages/Manutencoes/RegistrarManutencao'));
const ManutencoesDashboard = lazy(() => import('./pages/Manutencoes/ManutencoesDashboard'));
const ManutencaoDetails = lazy(() => import('./pages/Manutencoes/ManutencaoDetails'));

// 👥 USUÁRIOS
const UsuariosList = lazy(() => import('./pages/Usuarios/UsuariosList'));
const UsuarioForm = lazy(() => import('./pages/Usuarios/UsuarioForm'));

// 👥 MINHA EQUIPE
const MinhaEquipe = lazy(() => import('./pages/MinhaEquipe/MinhaEquipe'));

// 📋 SOLICITAÇÕES (Incluindo SolicitacoesParaEstoque)
const SolicitacoesParaEstoque = lazy(() => import('./pages/Solicitacoes/SolicitacoesParaEstoque'));
const ListaSolicitacoes = lazy(() => import('./pages/Solicitacoes/ListaSolicitacoes'));
const NovaSolicitacao = lazy(() => import('./pages/Solicitacoes/NovaSolicitacao'));
const DetalheSolicitacao = lazy(() => import('./pages/Solicitacoes/DetalheSolicitacao'));
const AprovarSolicitacao = lazy(() => import('./pages/Solicitacoes/AprovarSolicitacao'));

// 📊 RELATÓRIOS
const RelatorioMovimentacoes = lazy(() => import('./pages/Relatorios/RelatorioMovimentacoes'));
const RelatorioManutencoes = lazy(() => import('./pages/Relatorios/RelatorioManutencoes'));
const RelatorioItens = lazy(() => import('./pages/Relatorios/RelatorioItens'));
const AnalyticsDashboard = lazy(() => import('./pages/Relatorios/AnalyticsDashboard'));

// 🛠️ ADMIN
const ExportPage = lazy(() => import('./pages/ExportPage'));
const BackupPage = lazy(() => import('./pages/BackupPage'));

// ============================================================================
// COMPONENTES INTERNOS (DEPOIS DOS IMPORTS)
// ============================================================================

// 🎯 COMPONENTE DE LOADING OTIMIZADO
const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner"></div>
    <p>Carregando página...</p>
  </div>
);

// ⚡ LOADING GLOBAL
const GlobalLoader = () => (
  <div className="global-loader">
    <div className="global-spinner"></div>
    <h2>PrimeStock</h2>
    <p>Inicializando sistema...</p>
  </div>
);

// 🔐 COMPONENTE DE ROTA PROTEGIDA ÚNICO
const ProtectedRoute = ({ children, allowedProfiles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // 1. MOSTRAR LOADING SE ESTIVER CARREGANDO
  if (loading) {
    return <PageLoader />;
  }

  // 2. SE NÃO ESTIVER AUTENTICADO, REDIRECIONAR
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. VERIFICAR SE USUÁRIO EXISTE
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 4. SE TEM RESTRIÇÃO DE PERFIL, VERIFICAR
  if (allowedProfiles.length > 0 && !allowedProfiles.includes(user.perfil)) {
    // Admin geral tem acesso a tudo
    if (user.perfil === 'admin') {
      return children;
    }
    
    return (
      <div className="access-denied">
        <h1>🔒 Acesso Negado</h1>
        <p>Seu perfil <strong>{user.perfil}</strong> não tem acesso a esta página.</p>
        <p>Perfis permitidos: <strong>{allowedProfiles.join(', ')}</strong></p>
        <Link to="/dashboard" className="btn btn--primary">
          Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  // 5. TUDO CERTO, RENDERIZAR
  return children;
};

// 🎯 COMPONENTE DE ROTA PÚBLICA
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// 📱 LAYOUT MODERNO COM NAVBAR E SUSPENSE
const MainLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="content-wrapper">
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DO APP
// ============================================================================

function AppContent() {
  const [appLoaded, setAppLoaded] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  // ⚡ EFEITO PARA GARANTIR CARREGAMENTO COMPLETO
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoaded(true);
      document.body.classList.add('loaded');
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 🎯 MOSTRAR LOADING GLOBAL ENQUANTO O APP NÃO CARREGOU
  if (!appLoaded || loading) {
    return <GlobalLoader />;
  }

  return (
    <div className="App">
      <Router>
        <Routes>
          {/* 🚪 ROTA DE LOGIN */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Suspense fallback={<PageLoader />}>
                  <Login />
                </Suspense>
              </PublicRoute>
            } 
          />
          
          {/* 📊 DASHBOARD DE APROVAÇÃO */}
          <Route 
            path="/dashboard/aprovacao" 
            element={
              <ProtectedRoute allowedProfiles={['admin_estoque', 'admin']}>
                <MainLayout>
                  <DashboardAprovacao />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* 📦 SOLICITAÇÕES PARA ESTOQUE */}
          <Route 
            path="/solicitacoes/para-estoque" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <SolicitacoesParaEstoque />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* 📊 DASHBOARD PRINCIPAL */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista', 'estagiario', 'aprendiz']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* 📋 SOLICITAÇÕES PENDENTES */}
          <Route 
            path="/solicitacoes/pendentes" 
            element={
              <ProtectedRoute allowedProfiles={['coordenador', 'gerente', 'admin', 'admin_estoque']}>
                <MainLayout>
                  <PendentesAprovacao />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* 📊 DASHBOARD DE ESTOQUE */}
          <Route 
            path="/dashboard/estoque" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque']}>
                <MainLayout>
                  <EstoqueDashboard />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* 📦 ROTAS DE ITENS */}
          <Route 
            path="/itens" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ItensList />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/itens/novo" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'tecnico', 'analista', 'gerente', 'coordenador']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ItemForm />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/itens/editar/:id" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'tecnico', 'analista']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ItemForm />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/itens/visualizar/:id" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ItemView />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 🔄 ROTAS DE MOVIMENTAÇÕES */}
          <Route 
            path="/movimentacoes" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <MovimentacoesList />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* ... continuam todas as outras rotas exatamente como você tinha ... */}
          {/* 🔄 MOVIMENTAÇÕES - CONTINUAÇÃO */}
          <Route 
            path="/movimentacoes/detalhes/:id" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <MovimentacaoDetails />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/movimentacoes/nova" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <MovimentacaoForm />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/movimentacoes/editar/:id" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <MovimentacaoForm />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/movimentacoes/registrar-saida" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <RegistrarSaida />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/movimentacoes/devolucao/:id" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <RegistrarDevolucao />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/movimentacoes/dashboard" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <MovimentacoesDashboard />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 🛠️ ROTAS DE MANUTENÇÕES */}
          <Route 
            path="/manutencoes" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ManutencoesList />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/manutencoes/detalhes/:id" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ManutencaoDetails />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/manutencoes/nova" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ManutencaoForm />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/manutencoes/editar/:id" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ManutencaoForm />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/manutencoes/registrar" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <RegistrarManutencao />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/manutencoes/dashboard" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ManutencoesDashboard />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 👥 ROTAS DE USUÁRIOS */}
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <UsuariosList />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/usuarios/novo" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <UsuarioForm />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/usuarios/editar/:id" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <UsuarioForm />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 👥 MINHA EQUIPE */}
          <Route 
            path="/minha-equipe" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <MinhaEquipe />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 📋 SOLICITAÇÕES */}
          <Route 
            path="/solicitacoes" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ListaSolicitacoes />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/solicitacoes/nova" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente', 'tecnico', 'analista', 'estagiario', 'aprendiz']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <NovaSolicitacao />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/solicitacoes/:id" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <DetalheSolicitacao />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/solicitacoes/:id/aprovar" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <AprovarSolicitacao />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 📊 RELATÓRIOS */}
          <Route 
            path="/relatorios/itens" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <RelatorioItens />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/relatorios/movimentacoes" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <RelatorioMovimentacoes />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/relatorios/manutencoes" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <RelatorioManutencoes />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/relatorios/analytics" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <AnalyticsDashboard />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 🆕 ROTAS DE CADASTRO RÁPIDO */}
          <Route 
            path="/consulta-cadastro-rapido" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'tecnico', 'gerente']}>
                <MainLayout>
                  <ConsultaCadastroRapido />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cadastro-rapido" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'tecnico', 'gerente']}>
                <MainLayout>
                  <CadastroRapido />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 📊 ESTOQUE BAIXO */}
          <Route 
            path="/estoque-baixo" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EstoqueBaixo />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 🛠️ ROTAS ADMIN */}
          <Route 
            path="/export" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <ExportPage />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/backup" 
            element={
              <ProtectedRoute allowedProfiles={['admin', 'coordenador', 'gerente']}>
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <BackupPage />
                  </Suspense>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* 🏠 ROTA PADRÃO */}
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
          
          {/* ❌ ROTA NÃO ENCONTRADA */}
          <Route 
            path="*" 
            element={
              <div className="not-found">
                <h1>404 - Página Não Encontrada</h1>
                <p>A página que você está procurando não existe.</p>
                <Link to="/dashboard" className="btn btn--primary">
                  Voltar ao Dashboard
                </Link>
              </div>
            } 
          />
        </Routes>
      </Router>
    </div>
  );
}

// ============================================================================
// APP PRINCIPAL COM PROVIDERS
// ============================================================================

function App() {
  return (
    <AuthProvider>
      <SolicitacaoProvider>
        <EquipeProvider>
          <AppContent />
        </EquipeProvider>
      </SolicitacaoProvider>
    </AuthProvider>
  );
}

export default App;