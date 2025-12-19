// models/Movimentacao.js - VERSÃO COMPLETA CORRIGIDA
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Movimentacao = sequelize.define('Movimentacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 🔥 CORREÇÃO: Adicionar campos de relacionamento OBRIGATÓRIOS
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
  
  tipo: {
    type: DataTypes.ENUM('entrada', 'saida', 'devolucao', 'ajuste', 'transferencia'),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Tipo de movimentação é obrigatório'
      },
      isIn: {
        args: [['entrada', 'saida', 'devolucao', 'ajuste', 'transferencia']],
        msg: 'Tipo deve ser: entrada, saida, devolucao, ajuste ou transferencia'
      }
    }
  },
  
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Quantidade é obrigatória'
      },
      min: {
        args: [1],
        msg: 'Quantidade deve ser maior que zero'
      },
      isInt: {
        msg: 'Quantidade deve ser um número inteiro'
      }
    }
  },
  
  destinatario: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: {
        args: [0, 100],
        msg: 'Destinatário deve ter até 100 caracteres'
      }
    }
  },
  
  departamento_destino: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: {
        args: [0, 50],
        msg: 'Departamento deve ter até 50 caracteres'
      }
    }
  },
  
  data_devolucao_prevista: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Data de devolução prevista deve ser uma data válida'
      }
    }
  },
  
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Observação deve ter até 2000 caracteres'
      }
    }
  },
  
  // 🔥 CORREÇÃO: Campo de data de movimentação (se não usar timestamps)
  data_movimentacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Data de movimentação deve ser uma data válida'
      }
    }
  }
}, {
  tableName: 'movimentacoes',
  timestamps: false, // 🔥 CORREÇÃO: Desativado porque temos data_movimentacao manual
  indexes: [
    {
      fields: ['item_id']
    },
    {
      fields: ['usuario_id']
    },
    {
      fields: ['tipo']
    },
    {
      fields: ['data_movimentacao']
    }
  ]
});

module.exports = Movimentacao;