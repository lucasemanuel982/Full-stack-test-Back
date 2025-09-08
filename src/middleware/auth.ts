import { Request, Response, NextFunction } from 'express';

// Token fixo simples para autenticação
const FIXED_TOKEN = 'n8n-api-token-2024-fixed-access';

/**
 * Middleware de autenticação simples
 * Verifica se o token fornecido é o token fixo
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Obter o token do header Authorization ou x-access-token
    const authHeader = req.headers.authorization;
    const xAccessToken = req.headers['x-access-token'] as string;
    
    let token = '';
    
    // Verificar primeiro o header Authorization
    if (authHeader) {
      token = authHeader.split(' ')[1]; // Bearer TOKEN
    }
    // Se não houver Authorization, verificar x-access-token
    else if (xAccessToken) {
      token = xAccessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso requerido',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    // Verificar se é o token fixo
    if (token === FIXED_TOKEN) {
      next();
      return;
    }

    // Token inválido
    res.status(403).json({
      success: false,
      message: 'Token inválido',
      error: 'INVALID_TOKEN'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware opcional de autenticação (não falha se não houver token)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const xAccessToken = req.headers['x-access-token'] as string;
    
    let token = '';
    
    if (authHeader) {
      token = authHeader.split(' ')[1];
    } else if (xAccessToken) {
      token = xAccessToken;
    }

    if (token && token === FIXED_TOKEN) {
      // Token válido, continua
      next();
    } else {
      // Sem token ou token inválido, continua sem autenticação
      next();
    }
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    next();
  }
};

// Exportar o token fixo para uso em outros lugares
export { FIXED_TOKEN };
