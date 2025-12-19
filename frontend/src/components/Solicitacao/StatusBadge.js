// frontend/src/components/Solicitacao/StatusBadge.js
import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, showIcon = true, size = 'medium' }) => {
  const getStatusInfo = () => {
    const statusMap = {
      // Status do modelo de solicitações
      'rascunho': { text: 'Rascunho', className: 'status-rascunho', icon: '📝' },
      'pendente_aprovacao': { text: 'Pendente Aprovação', className: 'status-pendente', icon: '⏳' },
      'aprovada': { text: 'Aprovada', className: 'status-aprovada', icon: '✅' },
      'rejeitada_coordenador': { text: 'Rejeitada Coord.', className: 'status-rejeitada', icon: '❌' },
      'em_processo_estoque': { text: 'Em Processo', className: 'status-processo', icon: '🔄' },
      'entregue': { text: 'Entregue', className: 'status-entregue', icon: '🎁' },
      'rejeitada_estoque': { text: 'Rejeitada Estoque', className: 'status-rejeitada-estoque', icon: '🚫' },
      'cancelada': { text: 'Cancelada', className: 'status-cancelada', icon: '🗑️' },
      
      // Status antigos (para compatibilidade)
      'pendente': { text: 'Pendente', className: 'status-pendente', icon: '⏳' },
      'rejeitada': { text: 'Rejeitada', className: 'status-rejeitada', icon: '❌' },
    };
    
    return statusMap[status] || { text: status, className: 'status-default', icon: '⚪' };
  };

  const statusInfo = getStatusInfo();
  
  const sizeClass = {
    small: 'status-badge-sm',
    medium: 'status-badge-md',
    large: 'status-badge-lg'
  }[size] || 'status-badge-md';

  return (
    <span className={`status-badge ${statusInfo.className} ${sizeClass}`}>
      {showIcon && <span className="status-icon">{statusInfo.icon}</span>}
      <span className="status-text">{statusInfo.text}</span>
    </span>
  );
};

export default StatusBadge;