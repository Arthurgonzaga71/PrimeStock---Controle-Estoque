// Navbar.js - CORRIGIDO COM DELAY E PONTE DE MOUSE
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, perfilLabel } = useAuth();
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [closingReports, setClosingReports] = useState(false);
  const [closingTools, setClosingTools] = useState(false);
  
  const reportsTimeoutRef = useRef(null);
  const toolsTimeoutRef = useRef(null);
  const reportsMenuRef = useRef(null);
  const toolsMenuRef = useRef(null);

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/itens', icon: '📦', label: 'Itens' },
    { path: '/movimentacoes', icon: '🔄', label: 'Movimentações' },
    { path: '/manutencoes', icon: '🛠️', label: 'Manutenções' },
    { 
      path: '/solicitacoes', 
      icon: '📝', 
      label: 'Solicitações',
      roles: ['admin', 'coordenador', 'gerente', 'tecnico', 'analista', 'estagiario', 'aprendiz', 'admin_estoque']
    }
  ];

  const reportItems = [
    { path: '/relatorios/itens', icon: '📦', label: 'Relatório de Itens' },
    { path: '/relatorios/movimentacoes', icon: '📤', label: 'Relatório de Movimentações' },
    
  ];

  const toolsItems = [
    { path: '/consulta-cadastro-rapido', icon: '🔍', label: 'Consulta & Cadastro Rápido' },
    { path: '/cadastro-rapido', icon: '⚡', label: 'Cadastro Rápido' },
  ];

  const adminItems = [
    { path: '/export', icon: '📤', label: 'Exportar Dados' },
    { path: '/backup', icon: '💾', label: 'Backup' },
    
  ];

  const isActive = (path) => location.pathname === path;

  const isAdminOrCoordinator = ['admin', 'coordenador', 'gerente'].includes(user?.perfil);
  const canManageUsers = ['admin', 'coordenador', 'gerente'].includes(user?.perfil);

  // ✅ CORREÇÃO: FUNÇÕES COM DELAY PARA OS DROPDOWNS
  const handleReportsMouseEnter = () => {
    if (reportsTimeoutRef.current) {
      clearTimeout(reportsTimeoutRef.current);
    }
    if (closingReports) {
      setClosingReports(false);
    }
    setShowReportsMenu(true);
  };

  const handleReportsMouseLeave = () => {
    reportsTimeoutRef.current = setTimeout(() => {
      setClosingReports(true);
      setTimeout(() => {
        if (closingReports) {
          setShowReportsMenu(false);
          setClosingReports(false);
        }
      }, 200); // Tempo para a animação CSS
    }, 300); // Delay antes de fechar
  };

  const handleToolsMouseEnter = () => {
    if (toolsTimeoutRef.current) {
      clearTimeout(toolsTimeoutRef.current);
    }
    if (closingTools) {
      setClosingTools(false);
    }
    setShowToolsMenu(true);
  };

  const handleToolsMouseLeave = () => {
    toolsTimeoutRef.current = setTimeout(() => {
      setClosingTools(true);
      setTimeout(() => {
        if (closingTools) {
          setShowToolsMenu(false);
          setClosingTools(false);
        }
      }, 200);
    }, 300);
  };

  // Limpar timeouts quando o componente desmontar
  useEffect(() => {
    return () => {
      if (reportsTimeoutRef.current) {
        clearTimeout(reportsTimeoutRef.current);
      }
      if (toolsTimeoutRef.current) {
        clearTimeout(toolsTimeoutRef.current);
      }
    };
  }, []);

  // Filtrar itens do menu por perfil
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.perfil);
  });

  // ✅ VERIFICAR SE É ADMIN_ESTOQUE
  const isAdminEstoque = user?.perfil === 'admin_estoque';
  
  const getMenuForAdminEstoque = () => {
    if (isAdminEstoque) {
      return [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/solicitacoes/para-estoque', icon: '📝', label: 'Solicitações' }
      ];
    }
    return null;
  };

  const adminEstoqueMenu = getMenuForAdminEstoque();

  // Função para navegação com fechamento dos menus
  const handleNavigate = (path) => {
    setShowReportsMenu(false);
    setShowToolsMenu(false);
    setClosingReports(false);
    setClosingTools(false);
    navigate(path);
  };

  return (
    <nav className="navbar">
      {/* Logo e Brand */}
      <div className="navbar__brand">
        <div className="navbar__logo">
          <span className="logo-icon">⚡</span>
          <h1 className="logo-text">PrimeStock</h1>
        </div>
      </div>

      {/* Menu Principal */}
      <div className="navbar__menu">
        {/* ✅ SE FOR ADMIN_ESTOQUE - MENU ESPECIAL */}
        {isAdminEstoque && adminEstoqueMenu ? (
          adminEstoqueMenu.map((item) => (
            <button
              key={item.path}
              className={`navbar__item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              <span className="navbar__icon">{item.icon}</span>
              <span className="navbar__label">{item.label}</span>
            </button>
          ))
        ) : (
          // ✅ TODOS OS OUTROS USUÁRIOS - MENU NORMAL
          <>
            {filteredMenuItems.map((item) => (
              <button
                key={item.path}
                className={`navbar__item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
              >
                <span className="navbar__icon">{item.icon}</span>
                <span className="navbar__label">{item.label}</span>
              </button>
            ))}

            {/* ✅ USUÁRIOS - APENAS ADMIN E COORDENADOR */}
            {canManageUsers && (
              <button
                className={`navbar__item ${isActive('/usuarios') ? 'active' : ''}`}
                onClick={() => handleNavigate('/usuarios')}
              >
                <span className="navbar__icon">👤</span>
                <span className="navbar__label">Usuários</span>
              </button>
            )}

            {/* Menu Dropdown de Ferramentas Rápidas - COM CORREÇÃO */}
            <div 
              className={`navbar__item dropdown ${showToolsMenu ? 'active' : ''} ${closingTools ? 'closing' : ''}`}
              onMouseEnter={handleToolsMouseEnter}
              onMouseLeave={handleToolsMouseLeave}
              ref={toolsMenuRef}
            >
              <span className="navbar__icon">🚀</span>
              <span className="navbar__label">Ferramentas ▾</span>
              
              {showToolsMenu && (
                <div 
                  className={`dropdown__menu ${closingTools ? 'closing' : ''}`}
                  onMouseEnter={handleToolsMouseEnter}
                  onMouseLeave={handleToolsMouseLeave}
                >
                  {/* ✅ PONTE VISUAL INVISÍVEL - remove o gap */}
                  <div className="dropdown__bridge"></div>
                  
                  <button
                    className="dropdown__item highlight"
                    onClick={() => handleNavigate('/consulta-cadastro-rapido')}
                  >
                    <span className="dropdown__icon">🔍</span>
                    <div className="dropdown__item-content">
                      <span className="dropdown__label">Consulta & Cadastro Rápido</span>
                      <span className="dropdown__description">Escaneie códigos de barras</span>
                    </div>
                  </button>

                  {toolsItems
                    .filter(item => item.path !== '/consulta-cadastro-rapido')
                    .map((item) => (
                      <button
                        key={item.path}
                        className="dropdown__item"
                        onClick={() => handleNavigate(item.path)}
                      >
                        <span className="dropdown__icon">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Menu Dropdown de Relatórios - COM CORREÇÃO */}
            <div 
              className={`navbar__item dropdown ${showReportsMenu ? 'active' : ''} ${closingReports ? 'closing' : ''}`}
              onMouseEnter={handleReportsMouseEnter}
              onMouseLeave={handleReportsMouseLeave}
              ref={reportsMenuRef}
            >
              <span className="navbar__icon">📋</span>
              <span className="navbar__label">Relatórios ▾</span>
              
              {showReportsMenu && (
                <div 
                  className={`dropdown__menu ${closingReports ? 'closing' : ''}`}
                  onMouseEnter={handleReportsMouseEnter}
                  onMouseLeave={handleReportsMouseLeave}
                >
                  {/* ✅ PONTE VISUAL INVISÍVEL - remove o gap */}
                  <div className="dropdown__bridge"></div>
                  
                  {reportItems.map((item) => (
                    <button
                      key={item.path}
                      className="dropdown__item"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <span className="dropdown__icon">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  {/* Itens de Admin no menu de Relatórios */}
                  {isAdminOrCoordinator && (
                    <>
                      <div className="dropdown__divider"></div>
                      {adminItems.map((item) => (
                        <button
                          key={item.path}
                          className="dropdown__item admin-item"
                          onClick={() => handleNavigate(item.path)}
                        >
                          <span className="dropdown__icon">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Área do Usuário */}
      <div className="navbar__user">
        <div className="user__info">
          <div className="user__avatar">
            {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user__details">
            <span className="user__name">{user?.nome}</span>
            <span className="user__role">{perfilLabel}</span>
          </div>
        </div>
        
        <button 
          className="navbar__logout"
          onClick={logout}
          title="Sair do sistema"
        >
          <span className="logout-icon">🚪</span>
          Sair
        </button>
      </div>
    </nav>
  );
};

export default Navbar;