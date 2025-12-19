// frontend/src/components/AccessControl/AccessControl.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../UI';

const AccessControl = ({ children, fallback: FallbackComponent }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading text="Verificando permissões..." />;
  }

  if (!user) {
    return <div>Erro: Usuário não autenticado</div>;
  }

  // Se usuário tem acesso ao dashboard, mostra o conteúdo normal
  if (user.acesso_dashboard) {
    return children;
  }

  // Se não tem acesso, mostra o componente fallback (tela restrita)
  return <FallbackComponent />;
};

export default AccessControl;