// models/Manutencao.js - VERSÃO CORRIGIDA
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Manutencao = sequelize.define('Manutencao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Item é obrigatório'
      },
      min: {
        args: [1],
        msg: 'Item ID deve ser válido'
      }
    }
  },
  
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Usuário é obrigatório'
      },
      min: {
        args: [1],
        msg: 'Usuário ID deve ser válido'
      }
    }
  },
  
  tipo_manutencao: {
    type: DataTypes.ENUM('preventiva', 'corretiva', 'instalacao'),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tipo de manutenção é obrigatório'
      }
    }
  },
  
  descricao_problema: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Descrição do problema é obrigatória'
      },
      len: {
        args: [10, 2000],
        msg: 'Descrição do problema deve ter entre 10 e 2000 caracteres'
      }
    }
  },
  
  descricao_solucao: {
    type: DataTypes.TEXT,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Descrição da solução deve ter até 2000 caracteres'
      }
    }
  },
  
  data_abertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  data_conclusao: {
    type: DataTypes.DATE
  },
  
  custo_manutencao: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: {
        args: [0],
        msg: 'Custo não pode ser negativo'
      }
    }
  },
  
  fornecedor_manutencao: {
    type: DataTypes.STRING(100),
    validate: {
      len: {
        args: [0, 100],
        msg: 'Fornecedor deve ter até 100 caracteres'
      }
    }
  },
  
  status: {
    type: DataTypes.ENUM('aberta', 'em_andamento', 'concluida', 'cancelada'),
    defaultValue: 'aberta'
  }

  // 🔥 REMOVIDO: campo prioridade que não existe no banco
}, {
  tableName: 'manutencoes',
  timestamps: false // Desativado porque temos data_abertura manual
});

module.exports = Manutencao;