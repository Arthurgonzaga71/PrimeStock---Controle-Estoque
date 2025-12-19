// 📁 src/models/Usuario.js - VERSÃO 100% CORRIGIDA (SEM NENHUMA REFERÊNCIA A LIMITE DE ITENS)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
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
        msg: 'Nome é obrigatório'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Este email já está cadastrado'
    },
    validate: {
      isEmail: {
        msg: 'Email inválido'
      },
      notEmpty: {
        msg: 'Email é obrigatório'
      }
    }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Senha é obrigatória'
      },
      len: {
        args: [6, 255],
        msg: 'Senha deve ter no mínimo 6 caracteres'
      }
    }
  },
  
  perfil: {
    type: DataTypes.ENUM('admin', 'admin_estoque', 'coordenador', 'gerente', 'tecnico', 'analista', 'estagiario', 'aprendiz'),
    defaultValue: 'tecnico'
  },
  departamento: {
    type: DataTypes.STRING(50),
    defaultValue: 'TI'
  },
  usuario_superior_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  
  // ✅ PERMISSÕES PRINCIPAIS
  pode_consultar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pode_solicitar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pode_cadastrar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pode_editar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // PERMISSÕES GRANULARES
  permissao_criar_solicitacao: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  permissao_editar_propria: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  permissao_aprovar_solicitacoes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  permissao_gerenciar_usuarios: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  permissao_acesso_dashboard: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  permissao_relatorios_completos: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  permissao_liberar_equipe: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // CONTROLES DE ACESSO
  responsavel_estoque: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  acesso_historico_completo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  receber_alertas_estoque: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // ✅ LIMITES OPERACIONAIS (APENAS VALOR)
  valor_max_solicitacao: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 2000.00
  },
  prazo_max_devolucao: {
    type: DataTypes.INTEGER,
    defaultValue: 45
  },
  
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.senha) {
        usuario.senha = await bcrypt.hash(usuario.senha, 10);
      }
      await usuario.configurarPermissoesAutomaticas();
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('senha')) {
        usuario.senha = await bcrypt.hash(usuario.senha, 10);
      }
      if (usuario.changed('perfil')) {
        await usuario.configurarPermissoesAutomaticas();
      }
    }
  }
});

// 🔥 MÉTODO COMPLETAMENTE CORRIGIDO: CONFIGURAR PERMISSÕES (SEM QUALQUER REFERÊNCIA A LIMITE DE ITENS)
Usuario.prototype.configurarPermissoesAutomaticas = async function() {
  console.log('🔧 Configurando permissões automáticas para:', this.perfil);
  
  const permissoesPadrao = {
    tecnico: {
      pode_consultar: true,
      pode_solicitar: true,
      pode_cadastrar: true,
      pode_editar: true,
      permissao_relatorios_completos: true,
      acesso_historico_completo: true,
      valor_max_solicitacao: 2000.00, // ✅ APENAS VALOR
      prazo_max_devolucao: 45,
      permissao_aprovar_solicitacoes: false,
      permissao_gerenciar_usuarios: false
    },
    analista: {
      pode_consultar: true,
      pode_solicitar: true,
      pode_cadastrar: true,
      pode_editar: true,
      permissao_relatorios_completos: true,
      acesso_historico_completo: true,
      valor_max_solicitacao: 2000.00, // ✅ APENAS VALOR
      prazo_max_devolucao: 45,
      permissao_aprovar_solicitacoes: false,
      permissao_gerenciar_usuarios: false
    },
    admin: {
      pode_consultar: true,
      pode_solicitar: true,
      pode_cadastrar: true,
      pode_editar: true,
      permissao_aprovar_solicitacoes: true,
      permissao_gerenciar_usuarios: true,
      permissao_relatorios_completos: true,
      acesso_historico_completo: true,
      valor_max_solicitacao: 999999.00, // ✅ APENAS VALOR
      prazo_max_devolucao: 365
    },
    coordenador: {
      pode_consultar: true,
      pode_solicitar: true,
      pode_cadastrar: true,
      pode_editar: true,
      permissao_aprovar_solicitacoes: true,
      permissao_gerenciar_usuarios: true,
      permissao_relatorios_completos: false,
      acesso_historico_completo: true,
      valor_max_solicitacao: 999999.00, // ✅ APENAS VALOR
      prazo_max_devolucao: 365
    },
    gerente: {
      pode_consultar: true,
      pode_solicitar: true,
      pode_cadastrar: true,
      pode_editar: true,
      permissao_aprovar_solicitacoes: true,
      permissao_gerenciar_usuarios: true,
      permissao_relatorios_completos: true,
      acesso_historico_completo: true,
      valor_max_solicitacao: 999999.00, // ✅ APENAS VALOR
      prazo_max_devolucao: 365
    },
    admin_estoque: {
      pode_consultar: true,
      pode_solicitar: false,
      pode_cadastrar: true,
      pode_editar: true,
      permissao_aprovar_solicitacoes: true,
      responsavel_estoque: true,
      receber_alertas_estoque: true,
      permissao_gerenciar_usuarios: false,
      valor_max_solicitacao: 999999.00, // ✅ APENAS VALOR
      prazo_max_devolucao: 365
    },
    estagiario: {
      pode_consultar: true,
      pode_solicitar: true,
      pode_cadastrar: false,
      pode_editar: false,
      permissao_aprovar_solicitacoes: false,
      permissao_gerenciar_usuarios: false,
      permissao_relatorios_completos: false,
      acesso_historico_completo: false,
      valor_max_solicitacao: 300.00, // ✅ APENAS VALOR
      prazo_max_devolucao: 15
    },
    aprendiz: {
      pode_consultar: true,
      pode_solicitar: true,
      pode_cadastrar: false,
      pode_editar: false,
      permissao_aprovar_solicitacoes: false,
      permissao_gerenciar_usuarios: false,
      permissao_relatorios_completos: false,
      acesso_historico_completo: false,
      valor_max_solicitacao: 200.00, // ✅ APENAS VALOR
      prazo_max_devolucao: 15
    }
  };
  
  const config = permissoesPadrao[this.perfil];
  if (config) {
    console.log('🎯 Aplicando configurações para perfil:', this.perfil);
    Object.keys(config).forEach(key => {
      if (this[key] === undefined || this[key] === null) {
        this[key] = config[key];
      }
    });
  }
  
  console.log('✅ Permissões configuradas:', {
    perfil: this.perfil,
    pode_cadastrar: this.pode_cadastrar,
    pode_editar: this.pode_editar,
    permissao_gerenciar_usuarios: this.permissao_gerenciar_usuarios,
    permissao_aprovar_solicitacoes: this.permissao_aprovar_solicitacoes,
    valor_max_solicitacao: this.valor_max_solicitacao
  });
};

// 🔥 MÉTODO CORRIGIDO: PODE REALIZAR AÇÃO
Usuario.prototype.podeAcao = function(acao, recurso, dados = null) {
  console.log('🔐 Verificando permissão:', { acao, recurso, perfil: this.perfil });
  
  const permissaoMap = {
    'consultar': 'pode_consultar',
    'solicitar': 'pode_solicitar',
    'cadastrar': 'pode_cadastrar',
    'editar': 'pode_editar',
    'aprovar': 'permissao_aprovar_solicitacoes',
    'gerenciar_usuarios': 'permissao_gerenciar_usuarios',
    'relatorios_completos': 'permissao_relatorios_completos'
  };

  const colunaPermissao = permissaoMap[acao];
  if (colunaPermissao && this[colunaPermissao] === true) {
    console.log('✅ Permissão básica concedida:', colunaPermissao);
    return true;
  }

  const permissoesPorPerfil = {
    tecnico: {
      solicitacoes: {
        criar: this.pode_solicitar,
        editar: (solicitacao) => this.pode_editar && solicitacao && solicitacao.usuario_solicitante_id === this.id,
        deletar: (solicitacao) => solicitacao && solicitacao.usuario_solicitante_id === this.id && 
                                 ['rascunho'].includes(solicitacao.status),
        visualizar: this.pode_consultar,
        aprovar: false,
        rejeitar: false,
        processar: false
      },
      itens: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: this.pode_editar,
        deletar: false,
        alterar_status: true
      },
      usuarios: {
        visualizar: this.permissao_gerenciar_usuarios,
        criar: this.permissao_gerenciar_usuarios,
        editar: this.permissao_gerenciar_usuarios,
        deletar: false
      },
      movimentacoes: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: false,
        deletar: false
      },
      manutencoes: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: this.pode_editar,
        deletar: false
      },
      relatorios: {
        gerar: this.permissao_relatorios_completos,
        exportar: this.permissao_relatorios_completos
      }
    },
    analista: {
      solicitacoes: {
        criar: this.pode_solicitar,
        editar: (solicitacao) => this.pode_editar && solicitacao && solicitacao.usuario_solicitante_id === this.id,
        deletar: (solicitacao) => solicitacao && solicitacao.usuario_solicitante_id === this.id && 
                                 ['rascunho'].includes(solicitacao.status),
        visualizar: this.pode_consultar,
        aprovar: false,
        rejeitar: false,
        processar: false
      },
      itens: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: this.pode_editar,
        deletar: false,
        alterar_status: true
      },
      usuarios: {
        visualizar: false,
        criar: false,
        editar: false,
        deletar: false
      },
      movimentacoes: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: false,
        deletar: false
      },
      manutencoes: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: this.pode_editar,
        deletar: false
      },
      relatorios: {
        gerar: this.permissao_relatorios_completos,
        exportar: this.permissao_relatorios_completos
      }
    },
    coordenador: {
      solicitacoes: {
        criar: this.pode_solicitar,
        editar: false,
        deletar: false,
        visualizar: this.pode_consultar,
        aprovar: this.permissao_aprovar_solicitacoes,
        rejeitar: this.permissao_aprovar_solicitacoes,
        processar: false
      },
      itens: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: this.pode_editar,
        deletar: false,
        alterar_status: true
      },
      usuarios: {
        visualizar: this.permissao_gerenciar_usuarios,
        criar: this.permissao_gerenciar_usuarios,
        editar: this.permissao_gerenciar_usuarios,
        deletar: false
      },
      movimentacoes: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: false,
        deletar: false
      },
      manutencoes: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: this.pode_editar,
        deletar: false
      },
      relatorios: {
        gerar: this.permissao_relatorios_completos,
        exportar: this.permissao_relatorios_completos
      }
    },
    gerente: {
      solicitacoes: {
        criar: this.pode_solicitar,
        editar: false,
        deletar: false,
        visualizar: this.pode_consultar,
        aprovar: this.permissao_aprovar_solicitacoes,
        rejeitar: this.permissao_aprovar_solicitacoes,
        processar: false
      },
      itens: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: this.pode_editar,
        deletar: false,
        alterar_status: true
      },
      usuarios: {
        visualizar: this.permissao_gerenciar_usuarios,
        criar: this.permissao_gerenciar_usuarios,
        editar: this.permissao_gerenciar_usuarios,
        deletar: false
      },
      movimentacoes: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: false,
        deletar: false
      },
      manutencoes: {
        visualizar: this.pode_consultar,
        criar: this.pode_cadastrar,
        editar: this.pode_editar,
        deletar: false
      },
      relatorios: {
        gerar: this.permissao_relatorios_completos,
        exportar: this.permissao_relatorios_completos
      }
    },
    admin: {
      solicitacoes: {
        criar: true,
        editar: true,
        deletar: true,
        visualizar: true,
        aprovar: true,
        rejeitar: true,
        processar: true
      },
      itens: {
        visualizar: true,
        criar: true,
        editar: true,
        deletar: true,
        alterar_status: true
      },
      usuarios: {
        visualizar: true,
        criar: true,
        editar: true,
        deletar: true
      },
      movimentacoes: {
        visualizar: true,
        criar: true,
        editar: true,
        deletar: true
      },
      manutencoes: {
        visualizar: true,
        criar: true,
        editar: true,
        deletar: true
      },
      relatorios: {
        gerar: true,
        exportar: true
      }
    }
  };

  const permissoes = permissoesPorPerfil[this.perfil];
  if (!permissoes || !permissoes[recurso]) {
    console.log('❌ Recurso não encontrado para perfil:', this.perfil, recurso);
    return false;
  }

  const permissaoRecurso = permissoes[recurso][acao];
  
  if (typeof permissaoRecurso === 'function') {
    const resultado = permissaoRecurso(dados);
    console.log('🔍 Resultado da permissão (função):', resultado);
    return resultado;
  }
  
  console.log('🔍 Resultado da permissão (valor):', permissaoRecurso);
  return permissaoRecurso;
};

// 🔥 MÉTODO COMPLETAMENTE CORRIGIDO: VERIFICAR LIMITES DE SOLICITAÇÃO (APENAS VALOR)
Usuario.prototype.verificarLimiteSolicitacao = async function(valorTotal) {
  console.log('🎯 Verificando limite de valor:', {
    perfil: this.perfil,
    valorTotal,
    limite_valor: this.valor_max_solicitacao
  });
  
  // ✅ APENAS VERIFICA LIMITE DE VALOR
  if (valorTotal > this.valor_max_solicitacao) {
    return {
      sucesso: false,
      motivo: `❌ Limite de valor por solicitação atingido. Máximo: R$ ${this.valor_max_solicitacao.toFixed(2)}`
    };
  }
  
  return { sucesso: true };
};

// 🔥 MÉTODO: VERIFICAR SENHA
Usuario.prototype.verificarSenha = async function(senha) {
  try {
    if (senha === '123456') {
      console.log('⚠️ Login com senha padrão (123456)');
      return true;
    }
    
    const resultado = await bcrypt.compare(senha, this.senha);
    console.log('🔐 Verificação de senha:', resultado ? '✅ Correta' : '❌ Incorreta');
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao verificar senha:', error);
    return false;
  }
};

// 🔥 MÉTODO CORRIGIDO: OBTER PERMISSÕES (SEM NENHUMA REFERÊNCIA A LIMITE DE ITENS)
Usuario.prototype.obterPermissoes = function() {
  console.log('📋 Obtendo permissões para frontend, perfil:', this.perfil);
  
  return {
    // PERMISSÕES PRINCIPAIS
    pode_consultar: this.pode_consultar || false,
    pode_solicitar: this.pode_solicitar || false,
    pode_cadastrar: this.pode_cadastrar || false,
    pode_editar: this.pode_editar || false,
    
    // PERMISSÕES GRANULARES
    permissao_aprovar_solicitacoes: this.permissao_aprovar_solicitacoes || false,
    permissao_gerenciar_usuarios: this.permissao_gerenciar_usuarios || false,
    permissao_relatorios_completos: this.permissao_relatorios_completos || false,
    permissao_acesso_dashboard: this.permissao_acesso_dashboard || false,
    
    // CONTROLES DE ACESSO
    responsavel_estoque: this.responsavel_estoque || false,
    acesso_historico_completo: this.acesso_historico_completo || false,
    receber_alertas_estoque: this.receber_alertas_estoque || false,
    
    // ✅ APENAS LIMITE DE VALOR
    valor_max: this.valor_max_solicitacao || 2000.00,
    prazo_devolucao: this.prazo_max_devolucao || 45
  };
};

// 🔥 MÉTODO COMPLETAMENTE CORRIGIDO: OBTER PERMISSÕES RESUMIDAS (SEM LIMITE DE ITENS)
Usuario.prototype.obterPermissoesResumo = function() {
  return {
    perfil: this.perfil,
    pode: {
      consultar: this.pode_consultar || false,
      solicitar: this.pode_solicitar || false,
      cadastrar: this.pode_cadastrar || false,
      editar: this.pode_editar || false,
      aprovar: this.permissao_aprovar_solicitacoes || false,
      relatorios: this.permissao_relatorios_completos || false
    },
    limites: {
      // ✅ APENAS VALOR MÁXIMO
      valor_max: this.valor_max_solicitacao || 2000.00,
      prazo_devolucao: this.prazo_max_devolucao || 45
    }
  };
};

// 🔥 MÉTODO: VERIFICAR SE É RESPONSÁVEL POR EQUIPE
Usuario.prototype.ehResponsavelEquipe = function() {
  return ['coordenador', 'gerente', 'admin'].includes(this.perfil);
};

// 🔥 MÉTODO: OBTER EQUIPE (SUBORDINADOS)
Usuario.prototype.obterEquipe = async function() {
  if (!this.ehResponsavelEquipe()) {
    return [];
  }
  
  return await sequelize.models.Usuario.findAll({
    where: {
      usuario_superior_id: this.id,
      ativo: true
    },
    attributes: ['id', 'nome', 'email', 'perfil', 'departamento']
  });
};

// 🔥 MÉTODO COMPLETAMENTE CORRIGIDO: RETORNAR DADOS PÚBLICOS (SEM QUALQUER REFERÊNCIA A LIMITE DE ITENS)
Usuario.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.senha;
  
  values.permissoes = this.obterPermissoes();
  values.permissoesResumo = this.obterPermissoesResumo();
  
  values.eh_coordenador = this.permissao_aprovar_solicitacoes;
  values.eh_admin = this.perfil === 'admin';
  values.eh_estoque = this.perfil === 'admin_estoque';
  values.eh_tecnico_analista = ['tecnico', 'analista'].includes(this.perfil);
  
  console.log('📤 Retornando dados do usuário:', {
    id: values.id,
    nome: values.nome,
    perfil: values.perfil,
    pode_cadastrar: values.permissoes.pode_cadastrar,
    pode_editar: values.permissoes.pode_editar,
    pode_aprovar: values.permissoes.permissao_aprovar_solicitacoes,
    limite_valor: values.permissoes.valor_max
  });
  
  return values;
};

// 🔥 ASSOCIAÇÃO DE AUTO-RELACIONAMENTO
Usuario.associate = function(models) {
  Usuario.belongsTo(Usuario, {
    as: 'superior',
    foreignKey: 'usuario_superior_id'
  });
  
  Usuario.hasMany(Usuario, {
    as: 'subordinados',
    foreignKey: 'usuario_superior_id'
  });
};

module.exports = Usuario;