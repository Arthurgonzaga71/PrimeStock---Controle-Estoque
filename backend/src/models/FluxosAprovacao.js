const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FluxosAprovacao = sequelize.define('FluxosAprovacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  condicoes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  niveis: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'fluxos_aprovacao',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: false
});

// Método estático para buscar fluxo ativo
FluxosAprovacao.buscarFluxoAtivo = async function() {
  return await this.findOne({
    where: { ativo: true }
  });
};

// Método para verificar se usuário tem permissão de aprovação em determinado nível
FluxosAprovacao.prototype.usuarioPodeAprovar = function(usuario, nivel) {
  const niveis = this.niveis || [];
  const nivelConfig = niveis.find(n => n.nivel === nivel);
  
  if (!nivelConfig) return false;
  
  if (nivelConfig.perfil === usuario.perfil) return true;
  
  // Verificar perfis alternativos
  if (nivelConfig.perfis_alternativos && 
      Array.isArray(nivelConfig.perfis_alternativos) &&
      nivelConfig.perfis_alternativos.includes(usuario.perfil)) {
    return true;
  }
  
  return false;
};

module.exports = FluxosAprovacao;