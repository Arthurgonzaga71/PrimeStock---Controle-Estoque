const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Solicitacao = require('./Solicitacao');
const Item = require('./Item');
const ModeloEquipamento = require('./ModeloEquipamento');

const SolicitacaoItens = sequelize.define('SolicitacaoItens', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Solicitacao,
      key: 'id'
    }
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Item,
      key: 'id'
    }
  },
  modelo_equipamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: ModeloEquipamento,
      key: 'id'
    }
  },
  nome_item: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  quantidade_solicitada: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  quantidade_aprovada: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  quantidade_entregue: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  tipo_item: {
    type: DataTypes.ENUM('estoque', 'novo'),
    defaultValue: 'estoque'
  },
  valor_unitario_estimado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  fornecedor: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  link_produto: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  especificacoes_tecnicas: {
    type: DataTypes.JSON,
    allowNull: true
  },
  especificacoes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  motivo_uso: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  urgencia: {
    type: DataTypes.ENUM('normal', 'urgente', 'critico'),
    defaultValue: 'normal'
  },
  status_item: {
    type: DataTypes.ENUM('pendente', 'aprovado', 'rejeitado', 'entregue', 'devolvido'),
    defaultValue: 'pendente'
  },
  observacao_aprovador: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // 🔥 NOVO CAMPO: Valor total deste item (quantidade * valor unitário)
  valor_total_item: {
    type: DataTypes.VIRTUAL,
    get() {
      return (this.quantidade_solicitada * (this.valor_unitario_estimado || 0)).toFixed(2);
    }
  },
  // 🔥 NOVO CAMPO: Status legível
  status_item_legivel: {
    type: DataTypes.VIRTUAL,
    get() {
      const statusMap = {
        'pendente': '⏳ Pendente',
        'aprovado': '✅ Aprovado',
        'rejeitado': '❌ Rejeitado',
        'entregue': '🎉 Entregue',
        'devolvido': '↩️ Devolvido'
      };
      return statusMap[this.status_item] || this.status_item;
    }
  }
}, {
  tableName: 'solicitacao_itens',
  timestamps: true, // 🔥 ADICIONADO: createdAt e updatedAt
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  hooks: {
    // 🔥 NOVO HOOK: AfterCreate para atualizar valores da solicitação
    afterCreate: async (itemSolicitacao, options) => {
      try {
        console.log(`➕ Item adicionado à solicitação: ${itemSolicitacao.nome_item}`);
        
        // Atualizar valores totais da solicitação
        const solicitacao = await Solicitacao.findByPk(itemSolicitacao.solicitacao_id);
        if (solicitacao) {
          await solicitacao.atualizarValores();
        }
      } catch (error) {
        console.error('❌ Erro ao processar item criado:', error.message);
      }
    },
    
    // 🔥 NOVO HOOK: AfterUpdate para atualizar valores da solicitação
    afterUpdate: async (itemSolicitacao, options) => {
      try {
        console.log(`✏️ Item atualizado: ${itemSolicitacao.nome_item}`);
        
        // Se quantidade ou valor mudou, atualizar solicitação
        if (itemSolicitacao.changed('quantidade_solicitada') || 
            itemSolicitacao.changed('valor_unitario_estimado')) {
          const solicitacao = await Solicitacao.findByPk(itemSolicitacao.solicitacao_id);
          if (solicitacao) {
            await solicitacao.atualizarValores();
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar item atualizado:', error.message);
      }
    },
    
    // 🔥 NOVO HOOK: AfterDestroy para atualizar valores da solicitação
    afterDestroy: async (itemSolicitacao, options) => {
      try {
        console.log(`➖ Item removido da solicitação: ${itemSolicitacao.nome_item}`);
        
        // Atualizar valores totais da solicitação
        const solicitacao = await Solicitacao.findByPk(itemSolicitacao.solicitacao_id);
        if (solicitacao) {
          await solicitacao.atualizarValores();
        }
      } catch (error) {
        console.error('❌ Erro ao processar item removido:', error.message);
      }
    }
  }
});

// 🔥 MÉTODO: Verificar se item está disponível (para itens do estoque)
SolicitacaoItens.prototype.verificarDisponibilidadeEstoque = async function() {
  if (this.tipo_item === 'estoque' && this.item_id) {
    try {
      const item = await Item.findByPk(this.item_id);
      if (item) {
        const disponivel = item.quantidade >= this.quantidade_solicitada;
        return {
          disponivel,
          quantidade_disponivel: item.quantidade,
          necessidade: this.quantidade_solicitada,
          mensagem: disponivel 
            ? `✅ Disponível (${item.quantidade} unidades)` 
            : `❌ Indisponível (${item.quantidade} disponíveis, ${this.quantidade_solicitada} solicitados)`
        };
      }
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade:', error.message);
    }
  }
  return { disponivel: true, mensagem: '✅ Item novo (não verifica estoque)' };
};

// 🔥 MÉTODO: Obter informações completas do item
SolicitacaoItens.prototype.obterInformacoesCompletas = async function() {
  try {
    let informacoes = {
      id: this.id,
      nome_item: this.nome_item,
      quantidade_solicitada: this.quantidade_solicitada,
      tipo_item: this.tipo_item,
      status_item: this.status_item,
      status_item_legivel: this.status_item_legivel,
      valor_unitario: this.valor_unitario_estimado,
      valor_total: this.valor_total_item,
      urgencia: this.urgencia
    };
    
    // 🔥 BUSCAR INFORMAÇÕES ADICIONAIS
    if (this.tipo_item === 'estoque' && this.item_id) {
      const item = await Item.findByPk(this.item_id, {
        attributes: ['id', 'nome', 'numero_serie', 'patrimonio', 'quantidade', 'status']
      });
      if (item) {
        informacoes.item = {
          id: item.id,
          nome: item.nome,
          numero_serie: item.numero_serie,
          patrimonio: item.patrimonio,
          estoque_atual: item.quantidade,
          status: item.status
        };
        
        // Verificar disponibilidade
        const disponibilidade = await this.verificarDisponibilidadeEstoque();
        informacoes.disponibilidade = disponibilidade;
      }
    }
    
    if (this.modelo_equipamento_id) {
      const modelo = await ModeloEquipamento.findByPk(this.modelo_equipamento_id, {
        attributes: ['id', 'nome_modelo', 'fabricante']
      });
      if (modelo) {
        informacoes.modelo = {
          id: modelo.id,
          nome_modelo: modelo.nome_modelo,
          fabricante: modelo.fabricante
        };
      }
    }
    
    return informacoes;
    
  } catch (error) {
    console.error('❌ Erro ao obter informações do item:', error.message);
    return {
      id: this.id,
      nome_item: this.nome_item,
      quantidade_solicitada: this.quantidade_solicitada,
      tipo_item: this.tipo_item,
      status_item: this.status_item,
      error: 'Não foi possível carregar informações completas'
    };
  }
};

// 🔥 MÉTODO: Aprovar item
SolicitacaoItens.prototype.aprovar = async function(quantidade, observacao = null) {
  try {
    this.quantidade_aprovada = quantidade || this.quantidade_solicitada;
    this.status_item = 'aprovado';
    if (observacao) {
      this.observacao_aprovador = observacao;
    }
    
    await this.save();
    console.log(`✅ Item aprovado: ${this.nome_item}, Quantidade: ${this.quantidade_aprovada}`);
    
    return { sucesso: true, mensagem: 'Item aprovado com sucesso' };
  } catch (error) {
    console.error('❌ Erro ao aprovar item:', error.message);
    return { sucesso: false, erro: error.message };
  }
};

// 🔥 MÉTODO: Rejeitar item
SolicitacaoItens.prototype.rejeitar = async function(motivo) {
  try {
    this.quantidade_aprovada = 0;
    this.status_item = 'rejeitado';
    this.observacao_aprovador = motivo || 'Item rejeitado';
    
    await this.save();
    console.log(`❌ Item rejeitado: ${this.nome_item}, Motivo: ${motivo}`);
    
    return { sucesso: true, mensagem: 'Item rejeitado' };
  } catch (error) {
    console.error('❌ Erro ao rejeitar item:', error.message);
    return { sucesso: false, erro: error.message };
  }
};

// 🔥 MÉTODO: Retornar dados públicos para frontend
SolicitacaoItens.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // 🔥 ADICIONAR CAMPOS VIRTUAIS
  values.valor_total_item = this.valor_total_item;
  values.status_item_legivel = this.status_item_legivel;
  
  // 🔥 FLAGS ÚTEIS
  values.pode_aprovar = this.status_item === 'pendente';
  values.pode_rejeitar = this.status_item === 'pendente';
  values.pode_entregar = this.status_item === 'aprovado' && this.quantidade_entregue < this.quantidade_aprovada;
  
  return values;
};

// Relações
SolicitacaoItens.belongsTo(Solicitacao, {
  foreignKey: 'solicitacao_id',
  as: 'solicitacao'
});

SolicitacaoItens.belongsTo(Item, {
  foreignKey: 'item_id',
  as: 'item'
});

SolicitacaoItens.belongsTo(ModeloEquipamento, {
  foreignKey: 'modelo_equipamento_id',
  as: 'modelo_equipamento'
});

module.exports = SolicitacaoItens;