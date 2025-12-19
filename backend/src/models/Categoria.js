const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: 'Esta categoria já existe'
    },
    validate: {
      notEmpty: {
        msg: 'Nome da categoria é obrigatório'
      }
    }
  },
  descricao: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'categorias',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: false
});

module.exports = Categoria;