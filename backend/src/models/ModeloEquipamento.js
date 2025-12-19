const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ModeloEquipamento = sequelize.define('ModeloEquipamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome_modelo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fabricante: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  especificacoes_padrao: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  codigos_conhecidos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('codigos_conhecidos');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('codigos_conhecidos', JSON.stringify(value || []));
    }
  }
}, {
  tableName: 'modelos_equipamentos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: false,
  
  // Hooks
  hooks: {
    beforeCreate: (modelo) => {
      if (!modelo.especificacoes_padrao) {
        modelo.especificacoes_padrao = {};
      }
      if (!modelo.codigos_conhecidos) {
        modelo.codigos_conhecidos = [];
      }
    }
  }
});

// Métodos de instância
ModeloEquipamento.prototype.adicionarCodigoConhecido = function(codigo) {
  const codigos = this.codigos_conhecidos || [];
  if (!codigos.includes(codigo)) {
    codigos.push(codigo);
    this.codigos_conhecidos = codigos;
  }
  return this;
};

ModeloEquipamento.prototype.removerCodigoConhecido = function(codigo) {
  const codigos = this.codigos_conhecidos || [];
  const index = codigos.indexOf(codigo);
  if (index > -1) {
    codigos.splice(index, 1);
    this.codigos_conhecidos = codigos;
  }
  return this;
};

// Métodos estáticos
ModeloEquipamento.buscarPorCodigo = async function(codigo) {
  return await this.findOne({
    where: sequelize.where(
      sequelize.fn('JSON_CONTAINS', 
        sequelize.col('codigos_conhecidos'), 
        JSON.stringify(codigo)
      ),
      true
    )
  });
};

ModeloEquipamento.buscarPorCategoria = async function(categoriaId) {
  return await this.findAll({
    where: { categoria_id: categoriaId }
  });
};

module.exports = ModeloEquipamento;