import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de tratamento de erros
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Erro interno do servidor';

  // Log do erro
  logger.error('Erro capturado pelo middleware', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
    isOperational: error.isOperational
  });

  // Tratamento específico para diferentes tipos de erro
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Dados de entrada inválidos';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Formato de dados inválido';
  } else if (error.name === 'SyntaxError') {
    statusCode = 400;
    message = 'Erro de sintaxe nos dados';
  } else if (error.name === 'TypeError') {
    statusCode = 400;
    message = 'Tipo de dados inválido';
  }

  // Resposta de erro
  const response: ApiResponse = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  };

  res.status(statusCode).json(response);
};

// Middleware para capturar erros não tratados
export const unhandledErrorHandler = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Exceção não capturada', {
      error: error.message,
      stack: error.stack
    });
    
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Promise rejeitada não tratada', {
      reason: reason?.message || reason,
      promise: promise.toString()
    });
    
    process.exit(1);
  });
};

// Middleware para rotas não encontradas
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Rota não encontrada: ${req.method} ${req.path}`
  };

  logger.warn('Rota não encontrada', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json(response);
};

