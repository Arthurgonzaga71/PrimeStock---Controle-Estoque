const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Nome do item é obrigatório'
      }
    }
  },
  descricao: {
    type: DataTypes.TEXT
  },
  numero_serie: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  patrimonio: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true
  },
  codigo_barras: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  localizacao: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('disponivel', 'em_uso', 'manutencao', 'descarte', 'reservado'),
    defaultValue: 'disponivel'
  },
  estado: {
    type: DataTypes.ENUM('novo', 'usado', 'danificado', 'irrecuperavel'),
    defaultValue: 'novo'
  },
  data_aquisicao: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  valor_compra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  fornecedor: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  nota_fiscal: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  especificacoes: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('especificacoes');
      if (!rawValue) return {};
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch {
          return {};
        }
      }
      return rawValue;
    }
  },
  qr_code: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  foto: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  quantidade: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: {
        args: [0],
        msg: 'Quantidade não pode ser negativa'
      }
    }
  },
  estoque_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  criado_por: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
  // ❌ REMOVIDO: valor_atual_estimado (não existe no banco)
  // ❌ REMOVIDO: ultima_movimentacao (não existe no banco)
}, {
  tableName: 'itens',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  hooks: {
    beforeSave: (item, options) => {
      // Stringify apenas se for objeto
      if (item.especificacoes && typeof item.especificacoes === 'object') {
        item.especificacoes = JSON.stringify(item.especificacoes);
      }
      
      // ❌ REMOVIDO: Atualizar valor atual estimado (não existe)
      // if (!item.valor_atual_estimado && item.valor_compra) {
      //   item.valor_atual_estimado = item.valor_compra;
      // }
    },
    
    beforeCreate: async (item, options) => {
      // Gerar código de barras mais significativo
      if (!item.codigo_barras) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        const nomeAbrev = item.nome.substring(0, 3).toUpperCase();
        item.codigo_barras = `IT${nomeAbrev}-${timestamp}-${random}`.toUpperCase();
      }
      
      // ❌ REMOVIDO: Definir data de última movimentação (não existe)
      // if (!item.ultima_movimentacao) {
      //   item.ultima_movimentacao = new Date();
      // }
    },
    
    afterCreate: async (item, options) => {
      console.log(`✅ Item criado: ${item.nome} (ID: ${item.id})`);
    }
  }
});

// 🔥 MÉTODO DE INSTÂNCIA: Verificar disponibilidade
Item.prototype.verificarDisponibilidade = function(quantidadeRequerida = 1) {
  const disponivel = this.status === 'disponivel' && this.quantidade >= quantidadeRequerida;
  
  return {
    disponivel,
    quantidade_disponivel: this.quantidade,
    status: this.status,
    estado: this.estado,
    mensagem: disponivel 
      ? `✅ Disponível (${this.quantidade} unidades)` 
      : `❌ Indisponível - ${this.status === 'disponivel' 
          ? `Estoque insuficiente (${this.quantidade} disponíveis)` 
          : `Status: ${this.status}`}`
  };
};

// 🔥 MÉTODO DE INSTÂNCIA: Reservar item (CORRIGIDO)
Item.prototype.reservar = async function(quantidade = 1, motivo = 'Solicitação') {
  if (this.status !== 'disponivel' || this.quantidade < quantidade) {
    throw new Error(`Não é possível reservar: ${this.verificarDisponibilidade(quantidade).mensagem}`);
  }
  
  this.quantidade -= quantidade;
  if (this.quantidade === 0) {
    this.status = 'reservado';
  }
  // ❌ REMOVIDO: this.ultima_movimentacao = new Date(); (não existe)
  
  await this.save();
  console.log(`🔒 Item reservado: ${this.nome} (${quantidade} unidades)`);
  
  return {
    sucesso: true,
    quantidade_restante: this.quantidade,
    status_atual: this.status
  };
};

// 🔥 MÉTODO DE INSTÂNCIA: Liberar item (CORRIGIDO)
Item.prototype.liberar = async function(quantidade = 1) {
  if (this.status === 'reservado' || this.status === 'em_uso') {
    this.quantidade += quantidade;
    this.status = 'disponivel';
    // ❌ REMOVIDO: this.ultima_movimentacao = new Date(); (não existe)
    
    await this.save();
    console.log(`🔓 Item liberado: ${this.nome} (${quantidade} unidades)`);
    
    return {
      sucesso: true,
      quantidade_atual: this.quantidade,
      status_atual: this.status
    };
  }
  
  throw new Error(`Item não está reservado/em uso. Status atual: ${this.status}`);
};

// 🔥 MÉTODO DE INSTÂNCIA: Verificar se precisa de reposição
Item.prototype.precisarReposicao = function() {
  const precisaRepor = this.quantidade <= this.estoque_minimo;
  const nivel = this.quantidade === 0 ? 'zero' : 
                this.quantidade <= 2 ? 'critico' : 
                this.quantidade <= this.estoque_minimo ? 'baixo' : 'normal';
  
  return {
    precisa_repor: precisaRepor,
    nivel_alerta: nivel,
    quantidade_atual: this.quantidade,
    estoque_minimo: this.estoque_minimo,
    diferenca: this.estoque_minimo - this.quantidade,
    mensagem: precisaRepor 
      ? `⚠️ Necessita reposição! (${this.quantidade}/${this.estoque_minimo})`
      : `✅ Estoque OK (${this.quantidade}/${this.estoque_minimo})`
  };
};

// 🔥 MÉTODO DE INSTÂNCIA: Obter informações para exibição (CORRIGIDO)
Item.prototype.obterInformacoesCompletas = async function() {
  try {
    let categoria = null;
    if (this.categoria_id) {
      const Categoria = require('./Categoria');
      const cat = await Categoria.findByPk(this.categoria_id, {
        attributes: ['id', 'nome', 'descricao']
      });
      if (cat) {
        categoria = cat.toJSON();
      }
    }
    
    let criador = null;
    if (this.criado_por) {
      const Usuario = require('./Usuario');
      const user = await Usuario.findByPk(this.criado_por, {
        attributes: ['id', 'nome', 'email', 'perfil']
      });
      if (user) {
        criador = user.toJSON();
      }
    }
    
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      codigos: {
        patrimonio: this.patrimonio,
        numero_serie: this.numero_serie,
        codigo_barras: this.codigo_barras
      },
      estoque: {
        quantidade: this.quantidade,
        estoque_minimo: this.estoque_minimo,
        disponibilidade: this.verificarDisponibilidade(),
        necessidade_reposicao: this.precisarReposicao()
      },
      estado: {
        status: this.status,
        status_legivel: this.getStatusLegivel(),
        estado: this.estado,
        estado_legivel: this.getEstadoLegivel()
      },
      localizacao: this.localizacao,
      valores: {
        valor_compra: this.valor_compra
        // ❌ REMOVIDO: valor_atual_estimado: this.valor_atual_estimado
      },
      datas: {
        data_aquisicao: this.data_aquisicao,
        // ❌ REMOVIDO: ultima_movimentacao: this.ultima_movimentacao,
        criado_em: this.criado_em
      },
      categorias: categoria,
      criador: criador,
      especificacoes: this.especificacoes,
      pode_reservar: this.status === 'disponivel' && this.quantidade > 0,
      pode_editar: true // 🔥 SEM LIMITE DE ITENS
    };
    
  } catch (error) {
    console.error('❌ Erro ao obter informações completas:', error.message);
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      quantidade: this.quantidade,
      status: this.status,
      error: 'Não foi possível carregar todas as informações'
    };
  }
};

// 🔥 MÉTODO DE INSTÂNCIA: Status legível
Item.prototype.getStatusLegivel = function() {
  const statusMap = {
    'disponivel': '✅ Disponível',
    'em_uso': '🔧 Em Uso',
    'manutencao': '🛠️ Em Manutenção',
    'descarte': '🗑️ Para Descarte',
    'reservado': '🔒 Reservado'
  };
  return statusMap[this.status] || this.status;
};

// 🔥 MÉTODO DE INSTÂNCIA: Estado legível
Item.prototype.getEstadoLegivel = function() {
  const estadoMap = {
    'novo': '🆕 Novo',
    'usado': '👌 Usado',
    'danificado': '⚠️ Danificado',
    'irrecuperavel': '💀 Irrecuperável'
  };
  return estadoMap[this.estado] || this.estado;
};

// 🔥 MÉTODO DE INSTÂNCIA: Retornar dados públicos
Item.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  values.status_legivel = this.getStatusLegivel();
  values.estado_legivel = this.getEstadoLegivel();
  values.disponibilidade = this.verificarDisponibilidade();
  values.precisar_reposicao = this.precisarReposicao();
  
  delete values.especificacoes_raw;
  
  return values;
};

// 🔥 MÉTODO ESTÁTICO: Verificar estoque baixo
Item.verificarEstoqueBaixo = function() {
  return this.findAll({
    where: {
      quantidade: {
        [sequelize.Op.lte]: sequelize.col('estoque_minimo')
      },
      status: 'disponivel'
    },
    order: [['quantidade', 'ASC']]
  });
};

// 🔥 MÉTODO ESTÁTICO: Buscar por código
Item.buscarPorCodigo = function(codigo) {
  return this.findOne({
    where: {
      [sequelize.Op.or]: [
        { patrimonio: codigo },
        { numero_serie: codigo },
        { codigo_barras: codigo }
      ]
    }
  });
};

// 🔥 MÉTODO ESTÁTICO: Itens mais solicitados
Item.itensMaisSolicitados = async function(limit = 10) {
  try {
    const [result] = await sequelize.query(`
      SELECT 
        i.id,
        i.nome,
        i.codigo_barras,
        i.quantidade,
        i.estoque_minimo,
        COUNT(si.id) as total_solicitacoes,
        SUM(si.quantidade_solicitada) as total_solicitado
      FROM itens i
      LEFT JOIN solicitacao_itens si ON i.id = si.item_id
      WHERE si.status_item IN ('aprovado', 'entregue')
      GROUP BY i.id
      ORDER BY total_solicitado DESC
      LIMIT ?
    `, {
      replacements: [limit],
      type: sequelize.QueryTypes.SELECT
    });
    
    return result || [];
  } catch (error) {
    console.error('❌ Erro ao buscar itens mais solicitados:', error.message);
    return [];
  }
};

// 🔥 MÉTODO ESTÁTICO: Estatísticas de estoque
Item.estatisticasEstoque = async function() {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_itens,
        SUM(quantidade) as total_quantidade,
        SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as itens_disponiveis,
        SUM(CASE WHEN status = 'em_uso' THEN 1 ELSE 0 END) as itens_em_uso,
        SUM(CASE WHEN status = 'manutencao' THEN 1 ELSE 0 END) as itens_manutencao,
        SUM(CASE WHEN quantidade <= estoque_minimo AND status = 'disponivel' THEN 1 ELSE 0 END) as itens_baixo_estoque,
        SUM(valor_compra) as valor_total_estoque
      FROM itens
      WHERE status != 'descarte'
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    return stats || {};
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error.message);
    return {};
  }
};

module.exports = Item;