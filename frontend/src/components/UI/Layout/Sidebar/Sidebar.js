// components/UI/Sidebar.js - ATUALIZADO COM HISTÓRICO
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, flagsUteis, permissoesResumo, temPermissao, podeRealizar } = useAuth();
  const location = useLocation();

  // 🎯 MENU COMPLETO COM NOVAS PERMISSÕES (ADICIONANDO HISTÓRICO)
  const menuItems = [
    // 📊 DASHBOARD - Todos podem ver (se tiverem permissão)
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Dashboard',
      mostrar: () => flagsUteis?.temAcessoDashboard || false,
      tooltip: 'Visão geral do sistema'
    },

    // 📦 ITENS - Depende das permissões
    {
      path: '/itens',
      icon: '📦',
      label: 'Itens',
      mostrar: () => temPermissao('pode_consultar') || false,
      tooltip: 'Gerenciar itens do estoque',
      subItems: [
        {
          path: '/itens/lista',
          label: 'Ver Itens',
          mostrar: () => temPermissao('pode_consultar'),
          badge: 'view'
        },
        {
          path: '/itens/novo',
          label: 'Novo Item',
          mostrar: () => flagsUteis?.podeCadastrarItem || false,
          badge: 'new'
        },
        {
          path: '/itens/estoque-baixo',
          label: 'Estoque Baixo',
          mostrar: () => temPermissao('pode_consultar'),
          badge: 'alert'
        },
        {
          path: '/itens/cadastro-rapido',
          label: 'Cadastro Rápido',
          mostrar: () => flagsUteis?.podeCadastrarItem || false,
          badge: 'fast'
        }
      ]
    },

    // 📝 SOLICITAÇÕES - Sistema completo
    {
      path: '/solicitacoes',
      icon: '📝',
      label: 'Solicitações',
      mostrar: () => flagsUteis?.podeCriarSolicitacao || flagsUteis?.podeAprovarSolicitacao,
      tooltip: 'Solicitar e aprovar itens',
      subItems: [
        {
          path: '/solicitacoes/nova',
          label: 'Nova Solicitação',
          mostrar: () => flagsUteis?.podeCriarSolicitacao,
          badge: 'new'
        },
        {
          path: '/solicitacoes/minhas',
          label: 'Minhas Solicitações',
          mostrar: () => flagsUteis?.podeCriarSolicitacao,
          badge: 'my'
        },
        {
          path: '/solicitacoes/pendentes',
          label: 'Pendentes de Aprovação',
          mostrar: () => flagsUteis?.podeAprovarSolicitacao,
          badge: 'pending',
          highlight: true
        },
        {
          path: '/solicitacoes/todas',
          label: 'Todas Solicitações',
          mostrar: () => flagsUteis?.podeAprovarSolicitacao || flagsUteis?.podeVerTudo,
          badge: 'all'
        }
      ]
    },

    // 📜 HISTÓRICO - SISTEMA COMPLETO DE HISTÓRICO POR PERFIL
    {
      path: '/historico',
      icon: '📜',
      label: 'Histórico',
      mostrar: () => temPermissao('pode_consultar'), // Todos que podem consultar podem ver histórico
      tooltip: 'Histórico completo de solicitações',
      subItems: [
        // 👤 HISTÓRICO PESSOAL (Técnicos)
        {
          path: '/historico/minhas-solicitacoes',
          label: 'Minhas Solicitações',
          mostrar: () => flagsUteis?.podeCriarSolicitacao, // Técnicos que podem criar
          badge: 'my',
          description: 'Tudo que você solicitou'
        },
        {
          path: '/historico/minhas-aprovacoes',
          label: 'Minhas Aprovações',
          mostrar: () => flagsUteis?.podeAprovarSolicitacao, // Aprovadores
          badge: 'approve',
          description: 'O que você aprovou/rejeitou'
        },
        {
          path: '/historico/minhas-manutencoes',
          label: 'Minhas Manutenções',
          mostrar: () => user?.perfil === 'tecnico_manutencao', // Técnico de manutenção
          badge: 'maintenance',
          description: 'Histórico de manutenções'
        },
        
        // 👔 HISTÓRICO DE APROVADORES (Coordenadores/Gerentes)
        {
          path: '/historico/aprovacoes',
          label: 'Aprovações da Equipe',
          mostrar: () => ['coordenador', 'gerente'].includes(user?.perfil),
          badge: 'team',
          description: 'Todas aprovações da sua equipe'
        },
        {
          path: '/historico/rejeicoes',
          label: 'Rejeições',
          mostrar: () => flagsUteis?.podeAprovarSolicitacao,
          badge: 'reject',
          description: 'Solicitações rejeitadas'
        },
        
        // 👑 HISTÓRICO ADMIN (Admin/Admin Estoque)
        {
          path: '/historico/completo',
          label: 'Histórico Completo',
          mostrar: () => user?.eh_admin || user?.perfil === 'admin_estoque',
          badge: 'admin',
          description: 'Histórico completo do sistema'
        },
        {
          path: '/historico/auditoria',
          label: 'Auditoria',
          mostrar: () => user?.eh_admin,
          badge: 'audit',
          description: 'Logs de todas as ações'
        },
        {
          path: '/historico/exportar',
          label: 'Exportar Relatórios',
          mostrar: () => user?.eh_admin || user?.perfil === 'admin_estoque',
          badge: 'export',
          description: 'Exportar relatórios em PDF/Excel'
        }
      ]
    },

    // 🔄 MOVIMENTAÇÕES - Se pode consultar
    {
      path: '/movimentacoes',
      icon: '🔄',
      label: 'Movimentações',
      mostrar: () => temPermissao('pode_consultar'),
      tooltip: 'Registrar entradas e saídas',
      subItems: [
        {
          path: '/movimentacoes/registrar',
          label: 'Nova Movimentação',
          mostrar: () => podeRealizar('cadastrar', 'movimentacoes'),
          badge: 'new'
        },
        {
          path: '/movimentacoes/historico',
          label: 'Histórico',
          mostrar: () => temPermissao('pode_consultar'),
          badge: 'history'
        }
      ]
    },

    // 🛠️ MANUTENÇÕES - Se pode consultar
    {
      path: '/manutencoes',
      icon: '🛠️',
      label: 'Manutenções',
      mostrar: () => temPermissao('pode_consultar'),
      tooltip: 'Registrar manutenções',
      subItems: [
        {
          path: '/manutencoes/nova',
          label: 'Nova Manutenção',
          mostrar: () => podeRealizar('cadastrar', 'manutencoes'),
          badge: 'new'
        },
        {
          path: '/manutencoes/minhas',
          label: 'Minhas Manutenções',
          mostrar: () => temPermissao('pode_consultar'),
          badge: 'my'
        }
      ]
    },

    // 👥 USUÁRIOS - Apenas quem pode gerenciar
    {
      path: '/usuarios',
      icon: '👥',
      label: 'Usuários',
      mostrar: () => flagsUteis?.ehResponsavelEquipe || user?.eh_admin,
      tooltip: 'Gerenciar usuários e equipe',
      subItems: [
        {
          path: '/usuarios/lista',
          label: 'Todos Usuários',
          mostrar: () => user?.eh_admin,
          badge: 'admin'
        },
        {
          path: '/usuarios/minha-equipe',
          label: 'Minha Equipe',
          mostrar: () => flagsUteis?.ehResponsavelEquipe,
          badge: 'team'
        }
      ]
    },

    // 📈 RELATÓRIOS - Se tem permissão
    {
      path: '/relatorios',
      icon: '📈',
      label: 'Relatórios',
      mostrar: () => temPermissao('pode_relatorios_completos') || user?.eh_admin,
      tooltip: 'Relatórios e estatísticas'
    },

    // 🏷️ CATEGORIAS - Apenas coordenador/admin
    {
      path: '/categorias',
      icon: '🏷️',
      label: 'Categorias',
      mostrar: () => user?.eh_coordenador || user?.eh_admin,
      tooltip: 'Gerenciar categorias'
    },

    // 💾 BACKUP - Apenas admin
    {
      path: '/backup',
      icon: '💾',
      label: 'Backup',
      mostrar: () => user?.eh_admin,
      tooltip: 'Backup do sistema',
      restricted: true
    },

    // ⚙️ CONFIGURAÇÕES - Apenas admin
    {
      path: '/configuracoes',
      icon: '⚙️',
      label: 'Configurações',
      mostrar: () => user?.eh_admin,
      tooltip: 'Configurações do sistema',
      restricted: true
    }
  ];

  // 🔍 VERIFICAR SE ITEM ESTÁ ATIVO (incluindo subitens)
  const isItemActive = (item) => {
    if (location.pathname === item.path) return true;
    
    if (item.subItems) {
      return item.subItems.some(subItem => 
        location.pathname === subItem.path
      );
    }
    
    return false;
  };

  // 🏷️ OBTER BADGE PARA ITEM
  const getBadgeClass = (badgeType) => {
    const badges = {
      new: 'sidebar__badge--new',
      pending: 'sidebar__badge--pending',
      alert: 'sidebar__badge--alert',
      my: 'sidebar__badge--my',
      all: 'sidebar__badge--all',
      team: 'sidebar__badge--team',
      admin: 'sidebar__badge--admin',
      view: 'sidebar__badge--view',
      history: 'sidebar__badge--history',
      fast: 'sidebar__badge--fast',
      // 🆕 Novos badges para histórico
      approve: 'sidebar__badge--approve',
      maintenance: 'sidebar__badge--maintenance',
      reject: 'sidebar__badge--reject',
      audit: 'sidebar__badge--audit',
      export: 'sidebar__badge--export'
    };
    return badges[badgeType] || '';
  };

  // 🎯 RENDERIZAR DESCRIÇÃO DE SUBITEM (se houver)
  const renderSubItemDescription = (description) => {
    if (!description) return null;
    
    return (
      <span className="sidebar__subitem-description" title={description}>
        <i className="fas fa-info-circle"></i>
      </span>
    );
  };

  return (
    <aside className="sidebar">
      {/* 🎪 CABEÇALHO */}
      <div className="sidebar__header">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user?.nome || 'Usuário'}</span>
            <span className="sidebar__user-role">
              {user?.perfil ? user.perfil.toUpperCase() : 'N/D'}
            </span>
            <span className="sidebar__user-department">
              {user?.departamento || 'TI'}
            </span>
          </div>
        </div>

        {/* 🏷️ BADGE DE PERMISSÕES */}
        <div className="sidebar__permissions-badge">
          <div className="permissions-summary">
            <span className={`permission-dot ${temPermissao('pode_consultar') ? 'active' : ''}`} 
                  title="Consultar"></span>
            <span className={`permission-dot ${temPermissao('pode_solicitar') ? 'active' : ''}`} 
                  title="Solicitar"></span>
            <span className={`permission-dot ${temPermissao('pode_cadastrar') ? 'active' : ''}`} 
                  title="Cadastrar"></span>
            <span className={`permission-dot ${temPermissao('pode_editar') ? 'active' : ''}`} 
                  title="Editar"></span>
            <span className={`permission-dot ${temPermissao('pode_aprovar') ? 'active' : ''}`} 
                  title="Aprovar"></span>
          </div>
        </div>
      </div>

      {/* 🧭 MENU PRINCIPAL */}
      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          {menuItems.map((item) => {
            // 🔒 VERIFICAR SE DEVE MOSTRAR ITEM
            if (!item.mostrar()) return null;

            const isActive = isItemActive(item);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <li key={item.path} className="sidebar__menu-item">
                <div className="sidebar__item-wrapper">
                  <NavLink
                    to={item.path}
                    className={({ isActive: navActive }) => 
                      `sidebar__link ${(navActive || isActive) ? 'sidebar__link--active' : ''}`
                    }
                    title={item.tooltip}
                  >
                    <span className="sidebar__icon">{item.icon}</span>
                    <span className="sidebar__label">{item.label}</span>
                    
                    {/* 🏷️ BADGES */}
                    {item.restricted && (
                      <span className="sidebar__restricted-badge" title="Acesso restrito">
                        🔒
                      </span>
                    )}
                    
                    {hasSubItems && (
                      <span className="sidebar__chevron">
                        {isActive ? '▲' : '▼'}
                      </span>
                    )}
                  </NavLink>

                  {/* 📋 SUBITEMS */}
                  {hasSubItems && isActive && (
                    <ul className="sidebar__submenu">
                      {item.subItems.map((subItem) => {
                        if (!subItem.mostrar()) return null;
                        
                        return (
                          <li key={subItem.path} className="sidebar__submenu-item">
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) => 
                                `sidebar__sublink ${isActive ? 'sidebar__sublink--active' : ''}`
                              }
                            >
                              <span className="sidebar__sublabel">{subItem.label}</span>
                              
                              {subItem.badge && (
                                <span className={`sidebar__badge ${getBadgeClass(subItem.badge)}`}>
                                  {subItem.highlight ? '!' : ''}
                                </span>
                              )}
                              
                              {/* ℹ️ DESCRIÇÃO DO SUBITEM */}
                              {renderSubItemDescription(subItem.description)}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 🏁 RODAPÉ */}
      <div className="sidebar__footer">
        <div className="sidebar__stats">
          {/* 📊 ESTATÍSTICAS DE PERMISSÕES */}
          <div className="stat-section">
            <h4 className="stat-title">Suas Permissões</h4>
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-label">Consultar:</span>
                <span className={`stat-value ${permissoesResumo?.pode?.consultar ? 'active' : 'inactive'}`}>
                  {permissoesResumo?.pode?.consultar ? '✅' : '❌'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Solicitar:</span>
                <span className={`stat-value ${permissoesResumo?.pode?.solicitar ? 'active' : 'inactive'}`}>
                  {permissoesResumo?.pode?.solicitar ? '✅' : '❌'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cadastrar:</span>
                <span className={`stat-value ${permissoesResumo?.pode?.cadastrar ? 'active' : 'inactive'}`}>
                  {permissoesResumo?.pode?.cadastrar ? '✅' : '❌'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Editar:</span>
                <span className={`stat-value ${permissoesResumo?.pode?.editar ? 'active' : 'inactive'}`}>
                  {permissoesResumo?.pode?.editar ? '✅' : '❌'}
                </span>
              </div>
            </div>
          </div>

          {/* 📈 LIMITES */}
          {user?.eh_tecnico_analista && (
            <div className="stat-section">
              <h4 className="stat-title">Seus Limites</h4>
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-label">Máx. Itens:</span>
                  <span className="stat-value highlight">
                    {permissoesResumo?.limites?.max_itens || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Limite Valor:</span>
                  <span className="stat-value highlight">
                    R$ {permissoesResumo?.limites?.valor_max?.toFixed(2) || '0,00'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ℹ️ INFO DO SISTEMA */}
        <div className="sidebar__system-info">
          <small className="text-muted">
            Sistema de Controle de Estoque TI v2.0
            <br />
            Permissões atualizadas: {new Date().toLocaleDateString()}
          </small>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;