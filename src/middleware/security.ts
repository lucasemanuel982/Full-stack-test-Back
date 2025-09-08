import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// Configuração do CORS
export const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista de permitidas
    const allowedOrigins = config.corsOrigin.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('Tentativa de acesso de origin não permitida', { origin });
      callback(new Error('Não permitido pelo CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Configuração do rate limiting
export const rateLimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP por janela
  message: {
    success: false,
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    
    res.status(429).json({
      success: false,
      error: 'Muitas requisições deste IP, tente novamente em 15 minutos'
    });
  }
});

// Configuração específica para endpoints críticos
export const criticalRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // máximo 10 requisições por IP por janela
  message: {
    success: false,
    error: 'Muitas tentativas de execução, aguarde 5 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware de segurança personalizado
export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Adicionar headers de segurança personalizados
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Log de requisições suspeitas
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.info('Requisição de bot/crawler detectada', {
      userAgent,
      ip: req.ip,
      url: req.url
    });
  }
  
  next();
};

// Middleware para validar tamanho do payload
export const payloadSizeLimit = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('Content-Length') || '0', 10);
    
    if (contentLength > maxSize) {
      logger.warn('Payload muito grande', {
        contentLength,
        maxSize,
        url: req.url,
        ip: req.ip
      });
      
      res.status(413).json({
        success: false,
        error: 'Payload muito grande'
      });
      return;
    }
    
    next();
  };
};

// Middleware para detectar tentativas de ataque
export const attackDetection = (req: Request, res: Response, next: NextFunction): void => {
  const url = req.url.toLowerCase();
  const body = JSON.stringify(req.body).toLowerCase();
  
  const attackPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /eval\s*\(/i
  ];
  
  const isAttack = attackPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body)
  );
  
  if (isAttack) {
    logger.error('Tentativa de ataque detectada', {
      url: req.url,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(403).json({
      success: false,
      error: 'Acesso negado'
    });
    return;
  }
  
  next();
};

