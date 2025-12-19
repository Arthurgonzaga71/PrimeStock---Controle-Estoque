const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Solicitacao = sequelize.define('Solicitacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo_solicitacao: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  usuario_solicitante_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_aprovador_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usuario_estoque_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prioridade: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'urgente'),
    defaultValue: 'media'
  },
  tipo: {
    type: DataTypes.ENUM('equipamento', 'material', 'software', 'manutencao'),
    defaultValue: 'equipamento'
  },
  tipo_solicitacao: {
    type: DataTypes.ENUM('retirada_estoque', 'compra_novo'),
    defaultValue: 'retirada_estoque'
  },
  orcamento_estimado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  fornecedor_sugerido: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  link_referencia: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  urgencia_compra: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'imediata'),
    defaultValue: 'media'
  },
  status: {
    type: DataTypes.ENUM(
      'rascunho',
      'pendente_aprovacao',
      'aprovada',
      'rejeitada_coordenador',
      'em_processo_estoque',
      'entregue',
      'rejeitada_estoque',
      'cancelada'
    ),
    defaultValue: 'rascunho'
  },
  nivel_aprovacao_atual: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  motivo_rejeicao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observacoes_estoque: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data_aprovacao_coordenador: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_envio_estoque: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_processamento_estoque: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_entrega: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_devolucao_prevista: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  data_devolucao_efetiva: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // 🔥 NOVO CAMPO: Valor total calculado da solicitação
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  // 🔥 NOVO CAMPO: Quantidade total de itens
  quantidade_total_itens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'solicitacoes',
  timestamps: true,
  createdAt: 'data_solicitacao',
  updatedAt: 'data_atualizacao',
  hooks: {
    beforeValidate: async (solicitacao, options) => {
      console.log('🔧 Hook beforeValidate executando...');
      
      // 🔥 MELHORIA: Só gerar se realmente NÃO HOUVER código
      if (!solicitacao.codigo_solicitacao || solicitacao.codigo_solicitacao.trim() === '') {
        const ano = new Date().getFullYear();
        
        try {
          // 🔥 CÓDIGO MELHORADO: Consulta mais eficiente
          const [result] = await sequelize.query(
            `SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_solicitacao, 9) AS UNSIGNED)), 0) + 1 AS nova_sequencia
             FROM solicitacoes 
             WHERE codigo_solicitacao LIKE CONCAT('SOL-', ?, '-%')`,
            {
              replacements: [ano],
              type: sequelize.QueryTypes.SELECT
            }
          );
          
          const sequencia = result.nova_sequencia || 1;
          
          // 🔥 CÓDIGO CURTO E PADRONIZADO: SOL-2025-001
          solicitacao.codigo_solicitacao = `SOL-${ano}-${sequencia.toString().padStart(3, '0')}`;
          console.log(`✅ Código gerado: ${solicitacao.codigo_solicitacao}`);
          
        } catch (error) {
          console.error('❌ Erro ao gerar código:', error.message);
          // 🔥 FALLBACK MELHORADO
          const random = Math.floor(Math.random() * 900) + 100; // 100-999
          solicitacao.codigo_solicitacao = `SOL-${ano}-${random}`;
          console.log(`✅ Código fallback: ${solicitacao.codigo_solicitacao}`);
        }
      } else {
        console.log(`✅ Código já definido: ${solicitacao.codigo_solicitacao}`);
      }
    },
    
    // 🔥 NOVO HOOK: AfterCreate para logs
    afterCreate: async (solicitacao, options) => {
      console.log(`✅ Solicitação criada: ${solicitacao.codigo_solicitacao}`);
    },
    
    // 🔥 NOVO HOOK: AfterUpdate para logs
    afterUpdate: async (solicitacao, options) => {
      console.log(`🔄 Solicitação atualizada: ${solicitacao.codigo_solicitacao}, Status: ${solicitacao.status}`);
    }
  }
});

// 🔥 NOVO MÉTODO: Verificar se pode ser editada (sem limite de itens)
Solicitacao.prototype.podeSerEditada = function(usuarioId) {
  // ✅ SEM LIMITE DE ITENS - apenas verifica status
  const podeEditar = this.status === 'rascunho' && this.usuario_solicitante_id === usuarioId;
  console.log(`🔍 Solicitação ${this.codigo_solicitacao} pode ser editada? ${podeEditar}`, {
    status: this.status,
    solicitante_id: this.usuario_solicitante_id,
    usuario_atual: usuarioId
  });
  return podeEditar;
};

// 🔥 NOVO MÉTODO: Verificar se pode ser enviada para aprovação
Solicitacao.prototype.podeSerEnviadaAprovacao = function() {
  // ✅ SEM VERIFICAÇÃO DE LIMITE DE ITENS
  const podeEnviar = this.status === 'rascunho' && this.usuario_solicitante_id;
  console.log(`🔍 Solicitação ${this.codigo_solicitacao} pode ser enviada? ${podeEnviar}`);
  return podeEnviar;
};

// 🔥 NOVO MÉTODO: Obter status legível para frontend
Solicitacao.prototype.getStatusLegivel = function() {
  const statusMap = {
    'rascunho': '📝 Rascunho',
    'pendente_aprovacao': '⏳ Aguardando Aprovação',
    'aprovada': '✅ Aprovada',
    'rejeitada_coordenador': '❌ Rejeitada pelo Coordenador',
    'em_processo_estoque': '📦 Em Processamento no Estoque',
    'entregue': '🎉 Entregue',
    'rejeitada_estoque': '❌ Rejeitada pelo Estoque',
    'cancelada': '🚫 Cancelada'
  };
  return statusMap[this.status] || this.status;
};

// 🔥 NOVO MÉTODO: Atualizar valores totais (chamar após adicionar/remover itens)
Solicitacao.prototype.atualizarValores = async function() {
  try {
    const SolicitacaoItem = sequelize.models.SolicitacaoItem || require('./SolicitacaoItem');
    
    // 🔥 CALCULAR VALOR TOTAL E QUANTIDADE DE ITENS
    const itens = await SolicitacaoItem.findAll({
      where: { solicitacao_id: this.id },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantidade_solicitada')), 'total_itens'],
        [sequelize.fn('SUM', sequelize.literal('quantidade_solicitada * COALESCE(valor_unitario_estimado, 0)')), 'valor_total']
      ],
      raw: true
    });
    
    const resultado = itens[0] || {};
    this.quantidade_total_itens = parseInt(resultado.total_itens) || 0;
    this.valor_total = parseFloat(resultado.valor_total) || 0.00;
    
    console.log(`💰 Solicitação ${this.codigo_solicitacao}: ${this.quantidade_total_itens} itens, R$ ${this.valor_total.toFixed(2)}`);
    
    await this.save();
    return { quantidade_total_itens: this.quantidade_total_itens, valor_total: this.valor_total };
    
  } catch (error) {
    console.error('❌ Erro ao atualizar valores:', error.message);
    return { quantidade_total_itens: 0, valor_total: 0.00 };
  }
};

// 🔥 MÉTODO: Retornar dados públicos para frontend
Solicitacao.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // 🔥 ADICIONAR INFORMAÇÕES EXTRAS
  values.status_legivel = this.getStatusLegivel();
  values.pode_editar = this.status === 'rascunho';
  values.pode_cancelar = ['rascunho', 'pendente_aprovacao'].includes(this.status);
  values.pode_aprovar = ['pendente_aprovacao'].includes(this.status);
  
  console.log(`📤 Retornando dados da solicitação ${values.codigo_solicitacao}`, {
    quantidade_itens: values.quantidade_total_itens,
    valor_total: values.valor_total,
    pode_editar: values.pode_editar
  });
  
  return values;
};

module.exports = Solicitacao;