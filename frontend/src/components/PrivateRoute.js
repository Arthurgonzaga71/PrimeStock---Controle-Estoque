// frontend/src/components/PrivateRoutes.js - VERSÃO CORRIGIDA
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from './UI';

const PrivateRoute = ({ 
  children, 
  allowedProfiles = [], 
  requiredPermission = null,
  requiredAction = null,
  requiredResource = null,
  customCheck = null 
}) => {
  const { 
    user, 
    loading, 
    isAuthenticated, 
    temPermissao, 
    podeRealizar,
    flagsUteis 
  } = useAuth();
  
  const location = useLocation();

  if (loading) {
    return <Loading text="Verificando autenticação..." />;
  }

  // 🔥 1. VERIFICAR AUTENTICAÇÃO
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🔥 2. VERIFICAÇÃO CUSTOMIZADA (se fornecida)
  if (customCheck && typeof customCheck === 'function') {
    if (!customCheck(user)) {
      return <Navigate to="/acesso-negado" state={{ from: location }} replace />;
    }
    return children;
  }

  // 🔥 3. VERIFICAÇÃO POR AÇÃO + RECURSO (novo sistema)
  if (requiredAction && requiredResource) {
    const podeRealizarAcao = podeRealizar(requiredAction, requiredResource);
    
    if (!podeRealizarAcao) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Ação Não Permitida!</h4>
            <p>
              Você não tem permissão para <strong>{requiredAction}</strong> em <strong>{requiredResource}</strong>.
              <br />
              <strong>Seu perfil:</strong> {user.perfil}
              <br />
              <strong>Ação requerida:</strong> {requiredAction}
              <br />
              <strong>Recurso:</strong> {requiredResource}
            </p>
            <hr />
            <button 
              className="btn btn-primary" 
              onClick={() => window.history.back()}
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
    return children;
  }

  // 🔥 4. VERIFICAÇÃO POR PERMISSÃO ESPECÍFICA (novo sistema)
  if (requiredPermission) {
    const temPermissaoRequerida = temPermissao(requiredPermission);
    
    if (!temPermissaoRequerida) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Permissão Negada!</h4>
            <p>
              Você não tem a permissão: <strong>{requiredPermission}</strong>
              <br />
              <strong>Seu perfil:</strong> {user.perfil}
              <br />
              <strong>Permissão requerida:</strong> {requiredPermission}
            </p>
            <hr />
            <button 
              className="btn btn-primary" 
              onClick={() => window.history.back()}
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
    return children;
  }

  // 🔥 5. VERIFICAÇÃO POR PERFIL (sistema antigo - CORRIGIDO)
  if (allowedProfiles.length > 0 && !allowedProfiles.includes(user.perfil)) {
    // 🔥 PERFIS ESPECIAIS: Técnico/Analista podem acessar se tiverem permissão
    if (['tecnico', 'analista'].includes(user.perfil)) {
      // Verificar se tem permissões específicas para a rota
      const permissaoPorRota = {
        '/dashboard': 'pode_acesso_dashboard',
        '/itens': 'pode_consultar',
        '/itens/novo': 'pode_cadastrar',
        '/itens/editar/:id': 'pode_editar',
        '/solicitacoes': 'pode_solicitar',
        '/solicitacoes/nova': 'pode_solicitar',
        '/movimentacoes': 'pode_consultar',
        '/movimentacoes/registrar-saida': 'pode_cadastrar',
        '/movimentacoes/devolucao/:id': 'pode_cadastrar',
        '/movimentacoes/nova': 'pode_cadastrar',
        '/manutencoes': 'pode_consultar',
        '/manutencoes/nova': 'pode_cadastrar',
        '/manutencoes/registrar': 'pode_cadastrar',
        '/manutencoes/editar/:id': 'pode_editar'
      };
      
      const rotaAtual = location.pathname;
      let permissaoRequerida = permissaoPorRota[rotaAtual];
      
      // Verificar padrões dinâmicos
      if (!permissaoRequerida) {
        if (rotaAtual.startsWith('/itens/editar/')) {
          permissaoRequerida = 'pode_editar';
        } else if (rotaAtual.startsWith('/movimentacoes/devolucao/')) {
          permissaoRequerida = 'pode_cadastrar';
        } else if (rotaAtual.startsWith('/manutencoes/editar/')) {
          permissaoRequerida = 'pode_editar';
        } else if (rotaAtual.startsWith('/manutencoes/registrar/')) {
          permissaoRequerida = 'pode_cadastrar';
        }
      }
      
      if (permissaoRequerida && temPermissao(permissaoRequerida)) {
        console.log('✅ Técnico/Analista autorizado por permissão:', {
          rota: rotaAtual,
          permissao: permissaoRequerida,
          temPermissao: true
        });
        return children;
      }
    }
    
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Acesso Negado!</h4>
          <p>
            Você não tem permissão para acessar esta página.
            <br />
            <strong>Seu perfil:</strong> {user.perfil}
            <br />
            <strong>Perfis permitidos:</strong> {allowedProfiles.join(', ')}
            <br />
            <strong>Página:</strong> {location.pathname}
          </p>
          <hr />
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary" 
              onClick={() => window.history.back()}
            >
              Voltar
            </button>
            <button 
              className="btn btn-outline-primary" 
              onClick={() => window.location.href = '/dashboard'}
            >
              Ir para Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔥 6. VERIFICAÇÃO DE ACESSO AO DASHBOARD
  if (location.pathname === '/dashboard' && !flagsUteis.temAcessoDashboard) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Dashboard Não Disponível</h4>
          <p>
            Seu perfil não tem acesso ao dashboard completo.
            <br />
            Contate o administrador para liberar acesso.
          </p>
          <hr />
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.href = '/solicitacoes'}
          >
            Ver Solicitações
          </button>
        </div>
      </div>
    );
  }

  // ✅ 7. ACESSO PERMITIDO
  return children;
};

// 🏷️ COMPONENTES PRÁTICOS PRÉ-DEFINIDOS
export const SomenteAdminRoute = ({ children }) => (
  <PrivateRoute allowedProfiles={['admin']}>
    {children}
  </PrivateRoute>
);

export const SomenteCoordenadorRoute = ({ children }) => (
  <PrivateRoute allowedProfiles={['coordenador', 'gerente']}>
    {children}
  </PrivateRoute>
);

export const SomenteTecnicoAnalistaRoute = ({ children }) => (
  <PrivateRoute allowedProfiles={['tecnico', 'analista']}>
    {children}
  </PrivateRoute>
);

export const SomenteAprovadoresRoute = ({ children }) => (
  <PrivateRoute allowedProfiles={['coordenador', 'gerente', 'admin_estoque', 'admin']}>
    {children}
  </PrivateRoute>
);

export const PermissaoCadastrarRoute = ({ children }) => (
  <PrivateRoute requiredPermission="pode_cadastrar">
    {children}
  </PrivateRoute>
);

export const PermissaoAprovarRoute = ({ children }) => (
  <PrivateRoute requiredAction="aprovar" requiredResource="solicitacoes">
    {children}
  </PrivateRoute>
);

export default PrivateRoute;