const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AlertConfig = sequelize.define('AlertConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  tipo_alerta: {
    type: DataTypes.ENUM(
      'estoque_baixo',
      'estoque_critico',
      'estoque_zero', 
      'movimentacao_suspeita',
      'vencimento_garantia'
    ),
    allowNull: false
  },
  canal: {
    type: DataTypes.ENUM('email', 'slack', 'dashboard', 'todos'),
    defaultValue: 'dashboard'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'alert_configs',
  timestamps: true
});

module.exports = AlertConfig;