import React from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { LABELS } from '../../../../utils/constants';
import './Header.css';

const Header = () => {
  const { user, logout, perfilLabel } = useAuth();

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__logo">
          <div className="logo-icon-container">
            <span className="logo-icon flash-animation">⚡</span>
          </div>
          <h1 className="logo-text">PrimeStock</h1> {/* 🆕 NOME ATUALIZADO */}
        </div>
        <nav className="header__nav">
          <a href="/dashboard" className="nav-link active">
            📊 Dashboard
          </a>
          <a href="/itens" className="nav-link">
            📦 Itens
          </a>
          <a href="/movimentacoes" className="nav-link">
            🔄 Movimentações
          </a>
          <a href="/manutencoes" className="nav-link">
            🛠️ Manutenções
          </a>
        </nav>
      </div>
      
      <div className="header__right">
        <div className="header__user">
          <div className="user-avatar">
            {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.nome}</span>
            <span className="user-role">{perfilLabel}</span>
          </div>
        </div>
        
        <div className="header__actions">
          <button 
            className="header__logout"
            onClick={logout}
            title="Sair do sistema"
          >
            <span className="logout-icon">🚪</span>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;