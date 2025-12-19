const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// 🔧 Configuração do Redis para rate limiting distribuído (opcional)
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
}

// 📊 Obter IP real mesmo atrás de proxy/reverse proxy
const getRealIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.ip;
};

// 🔐 LIMITE DE TENTATIVAS DE LOGIN - MAIS RESTRITIVO
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas
  skipSuccessfulRequests: true, // ✅ NÃO conta logins bem-sucedidos
  keyGenerator: getRealIP, // Usa IP real
  message: {
    success: false,
    error: 'TOO_MANY_ATTEMPTS',
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: 900 // segundos
  },
  standardHeaders: true, // Adiciona headers RateLimit-*
  legacyHeaders: false, // Remove headers X-RateLimit-*
  // Store para ambientes distribuídos (opcional)
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }) : undefined,
  handler: (req, res, next, options) => {
    // Log de tentativas suspeitas
    console.warn(`[SECURITY] Muitas tentativas de login do IP: ${getRealIP(req)}`);
    
    res.status(429).json(options.message);
  }
});

// 📧 LIMITE PARA REQUISIÇÕES GERAIS - COM DIFERENCIAÇÃO
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: (req) => {
    // ✅ Limites diferentes por tipo de endpoint
    if (req.path.includes('/api/auth/')) return 20;
    if (req.path.includes('/api/upload')) return 10;
    if (req.path.includes('/api/admin')) return 50;
    return 100; // Limite padrão
  },
  keyGenerator: getRealIP,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // ✅ Pular rate limit para IPs confiáveis (ex: serviços internos)
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    return trustedIPs.includes(getRealIP(req));
  },
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }) : undefined,
});

// 🚀 LIMITE ESPECÍFICO PARA UPLOAD/ENVIO DE ARQUIVOS
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 uploads por hora
  message: {
    success: false,
    error: 'UPLOAD_LIMIT_EXCEEDED',
    message: 'Limite de upload excedido. Tente novamente em 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 📝 LIMITE PARA CRIAÇÃO DE CONTEÚDO/COMMENTS
const creationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 30, // 30 criações por 10 minutos
  skipFailedRequests: false,
  message: {
    success: false,
    error: 'CREATION_LIMIT_EXCEEDED',
    message: 'Muitas criações recentes. Aguarde alguns minutos.'
  }
});

// 🔍 DETECÇÃO DE COMPORTAMENTO SUSPEITO (Middleware adicional)
const suspiciousBehaviorDetection = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = getRealIP(req);
  
  // Lista de User-Agents suspeitos
  const suspiciousPatterns = [
    'sqlmap', 'nikto', 'havij', 'zap', 'w3af', 
    'metasploit', 'nessus', 'hydra', 'burpsuite'
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isSuspicious) {
    console.warn(`[SECURITY] User-Agent suspeito detectado: ${userAgent} - IP: ${ip}`);
    // Poderia adicionar o IP a uma lista temporária de bloqueio
  }
  
  next();
};

// 📈 METRICS MIDDLEWARE (para monitoramento)
const rateLimitMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const ip = getRealIP(req);
    
    // Log para análise (pode enviar para Elasticsearch, etc.)
    console.log(`[METRICS] ${req.method} ${req.path} - IP: ${ip} - Status: ${res.statusCode} - Time: ${duration}ms`);
  });
  
  next();
};

module.exports = {
  loginLimiter,
  apiLimiter,
  uploadLimiter,
  creationLimiter,
  suspiciousBehaviorDetection,
  rateLimitMetrics,
  
  // Helper para uso em testes
  getRealIP,
  
  // Configuração recomendada para diferentes rotas
  securityConfig: {
    authRoutes: [suspiciousBehaviorDetection, loginLimiter],
    apiRoutes: [rateLimitMetrics, apiLimiter],
    uploadRoutes: [uploadLimiter],
    contentRoutes: [creationLimiter]
  }
};