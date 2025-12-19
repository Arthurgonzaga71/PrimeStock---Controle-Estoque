import React from 'react';
import { Loading } from './UI/Loading';

// 🎯 COMPONENTE DE CARREGAMENTO PADRÃO
const LazyFallback = ({ message = "Carregando..." }) => (
  <div className="lazy-loading">
    <Loading size="large" text={message} />
  </div>
);

// ⚡ HIGHER-ORDER COMPONENT PARA LAZY LOADING
export const withLazyLoading = (Component, fallbackMessage) => {
  return (props) => (
    <React.Suspense fallback={<LazyFallback message={fallbackMessage} />}>
      <Component {...props} />
    </React.Suspense>
  );
};

export default LazyFallback;