const helmet = require('helmet');
const cors = require('cors');
const { body, query, validationResult } = require('express-validator');

// 🛡️ CONFIGURAÇÃO HELMET MELHORADA
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Remova se possível
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// 🌐 CORS - ADICIONE VALIDAÇÃO DE ORIGEM DINÂMICA
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requests sem origin (como mobile apps ou curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// 🧹 SANITIZAÇÃO SEGURA E FLEXÍVEL
const sanitizeInput = (req, res, next) => {
  // Função básica para prevenir XSS (menos agressiva)
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove ou codifica apenas tags HTML perigosas
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Mantém aspas para JSON, mas previne script injection
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/expression\(/gi, '');
  };

  // NÃO modifica os dados originais - cria cópias
  const originalBody = req.body;
  const originalQuery = req.query;
  const originalParams = req.params;

  // Cria objetos sanitizados separados
  req.sanitizedBody = {};
  req.sanitizedQuery = {};
  req.sanitizedParams = {};

  if (originalBody && typeof originalBody === 'object') {
    Object.keys(originalBody).forEach(key => {
      if (typeof originalBody[key] === 'string') {
        req.sanitizedBody[key] = sanitizeString(originalBody[key]);
      } else {
        req.sanitizedBody[key] = originalBody[key];
      }
    });
  }

  if (originalQuery && typeof originalQuery === 'object') {
    Object.keys(originalQuery).forEach(key => {
      if (typeof originalQuery[key] === 'string') {
        req.sanitizedQuery[key] = sanitizeString(originalQuery[key]);
      } else {
        req.sanitizedQuery[key] = originalQuery[key];
      }
    });
  }

  if (originalParams && typeof originalParams === 'object') {
    Object.keys(originalParams).forEach(key => {
      if (typeof originalParams[key] === 'string') {
        req.sanitizedParams[key] = sanitizeString(originalParams[key]);
      } else {
        req.sanitizedParams[key] = originalParams[key];
      }
    });
  }

  next();
};

// ✅ MIDDLEWARE DE VALIDAÇÃO COM EXPRESS-VALIDATOR (RECOMENDADO)
const validateInput = (rules) => {
  return async (req, res, next) => {
    await Promise.all(rules.map(rule => rule.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    next();
  };
};

// Exemplo de regras de validação para usuário
const userValidationRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim(),
  body('name').trim().escape() // Escape HTML characters
];

module.exports = {
  securityHeaders,
  corsMiddleware: cors(corsOptions),
  sanitizeInput,
  validateInput,
  userValidationRules,
  
  // Middleware de segurança adicional
  securityMiddleware: [
    securityHeaders,
    cors(corsOptions),
    sanitizeInput
  ]
};