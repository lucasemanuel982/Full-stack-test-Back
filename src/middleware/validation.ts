import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

// Schema de validação para dados de usuário
const userSchema = Joi.object({
  nome: Joi.string().min(1).max(128).required().messages({
    'string.empty': 'Nome é obrigatório',
    'string.min': 'Nome deve ter pelo menos 1 caractere',
    'string.max': 'Nome deve ter no máximo 128 caracteres'
  }),
  email: Joi.string().email().max(255).required().messages({
    'string.empty': 'Email é obrigatório',
    'string.email': 'Email deve ter um formato válido',
    'string.max': 'Email deve ter no máximo 255 caracteres'
  }),
  phone: Joi.string().min(1).max(20).required().messages({
    'string.empty': 'Telefone é obrigatório',
    'string.min': 'Telefone deve ter pelo menos 1 caractere',
    'string.max': 'Telefone deve ter no máximo 20 caracteres'
  })
});

// Schema de validação para array de usuários
const usersArraySchema = Joi.array().items(userSchema).min(1).required().messages({
  'array.min': 'Deve haver pelo menos 1 usuário',
  'array.base': 'Dados devem ser um array de usuários'
});

// Middleware de validação genérico
export const validateRequest = (schema: Joi.ObjectSchema | Joi.ArraySchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      
      logger.warn('Erro de validação', {
        errors: errorMessages,
        body: req.body,
        url: req.url,
        method: req.method
      });

      const response: ApiResponse = {
        success: false,
        error: 'Dados de entrada inválidos',
        data: errorMessages
      };

      res.status(400).json(response);
      return;
    }

    // Substituir req.body pelos dados validados
    req.body = value;
    next();
  };
};

// Middleware específico para validação de usuários
export const validateUsers = validateRequest(usersArraySchema);

// Middleware para validação de parâmetros de query
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      
      logger.warn('Erro de validação de query', {
        errors: errorMessages,
        query: req.query,
        url: req.url,
        method: req.method
      });

      const response: ApiResponse = {
        success: false,
        error: 'Parâmetros de query inválidos',
        data: errorMessages
      };

      res.status(400).json(response);
      return;
    }

    req.query = value;
    next();
  };
};

// Middleware para sanitização de entrada
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

