import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { corsOptions, rateLimitOptions, securityMiddleware } from '@/middleware/security';
import { errorHandler, notFoundHandler, unhandledErrorHandler } from '@/middleware/errorHandler';
import routes from '@/routes';

// Configurar tratamento de erros não capturados
unhandledErrorHandler();

// Criar aplicação Express
const app = express();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors(corsOptions));

// Rate limiting
app.use(rateLimitOptions);

// Middleware de segurança personalizado
app.use(securityMiddleware);

// Compressão de resposta
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging de requisições
app.use((req, res, next) => {
  logger.debug('Requisição recebida', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rotas da API
app.use('/api', routes);

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

// Middleware de logging de erros finais
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro não tratado pelo middleware de erro', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  next(error);
});

export default app;

