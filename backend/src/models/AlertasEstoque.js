// models/AlertasEstoque.js - VERSÃO CORRIGIDA
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // ✅ CORRIGIDO: importar do objeto

const AlertasEstoque = sequelize.define('AlertasEstoque', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'itens',
      key: 'id'
    }
  },
  nivel_alerta: {
    type: DataTypes.ENUM('baixo', 'critico', 'zero'),
    allowNull: false,
    validate: {
      isIn: [['baixo', 'critico', 'zero']]
    }
  },
  quantidade_atual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  estoque_minimo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  lido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  data_alerta: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  data_leitura: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'alertas_estoque',
  timestamps: false,
  indexes: [
    {
      fields: ['item_id']
    },
    {
      fields: ['lido']
    },
    {
      fields: ['nivel_alerta']
    },
    {
      fields: ['data_alerta']
    }
  ]
});

// Métodos de instância
AlertasEstoque.prototype.marcarComoLido = function() {
  this.lido = true;
  this.data_leitura = new Date();
  return this.save();
};

// Métodos estáticos
AlertasEstoque.buscarAlertasAtivos = function() {
  return this.findAll({
    where: { lido: false },
    include: ['item'],
    order: [
      ['nivel_alerta', 'DESC'],
      ['data_alerta', 'DESC']
    ]
  });
};

AlertasEstoque.buscarPorNivel = function(nivel) {
  return this.findAll({
    where: { 
      nivel_alerta: nivel,
      lido: false 
    },
    include: ['item']
  });
};

AlertasEstoque.contarAlertasAtivos = function() {
  return this.count({
    where: { lido: false }
  });
};

AlertasEstoque.marcarTodosComoLidos = function() {
  return this.update(
    { 
      lido: true, 
      data_leitura: new Date() 
    },
    { 
      where: { lido: false } 
    }
  );
};

module.exports = AlertasEstoque;