  const { body, param, query, validationResult } = require('express-validator');

  // 🎯 VALIDAÇÃO DE USUÁRIOS
  const validateUsuario = [
    body('nome')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres')
      .trim()
      .escape(),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    
    body('senha')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter no mínimo 6 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve conter letras maiúsculas, minúsculas e números'),
    
    body('perfil')
      .isIn(['admin', 'coordenador', 'tecnico', 'estagiario'])
      .withMessage('Perfil inválido')
  ];

  // 📦 VALIDAÇÃO DE ITENS
  const validateItem = [
    body('nome')
      .isLength({ min: 2, max: 200 })
      .withMessage('Nome do item deve ter entre 2 e 200 caracteres')
      .trim()
      .escape(),
    
    body('quantidade_estoque')
      .isInt({ min: 0 })
      .withMessage('Quantidade deve ser um número positivo'),
    
    body('valor_unitario')
      .isFloat({ min: 0 })
      .withMessage('Valor unitário deve ser um número positivo'),
    
    body('status')
      .isIn(['disponivel', 'em_uso', 'manutencao', 'descarte', 'reservado'])
      .withMessage('Status inválido')
  ];

  // 🔄 VALIDAÇÃO DE MOVIMENTAÇÕES
  const validateMovimentacao = [
    body('tipo')
      .isIn(['entrada', 'saida', 'devolucao', 'ajuste', 'transferencia'])
      .withMessage('Tipo de movimentação inválido'),
    
    body('quantidade')
      .isInt({ min: 1 })
      .withMessage('Quantidade deve ser um número positivo'),
    
    body('item_id')
      .isInt({ min: 1 })
      .withMessage('ID do item inválido')
  ];

  // 🛠️ VALIDAÇÃO DE MANUTENÇÕES
  const validateManutencao = [
    body('tipo_manutencao')
      .isIn(['preventiva', 'corretiva', 'instalacao'])
      .withMessage('Tipo de manutenção inválido'),
    
    body('status')
      .isIn(['aberta', 'em_andamento', 'concluida', 'cancelada'])
      .withMessage('Status inválido'),
    
    body('custo_manutencao')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Custo deve ser um número positivo')
  ];

  // 🎯 MIDDLEWARE DE VALIDAÇÃO
  const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }
    
    next();
  };

  module.exports = {
    validateUsuario,
    validateItem,
    validateMovimentacao,
    validateManutencao,
    handleValidationErrors
  };