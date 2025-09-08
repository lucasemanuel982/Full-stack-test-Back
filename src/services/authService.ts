// Token fixo simples para autenticação
const FIXED_TOKEN = 'n8n-api-token-2024-fixed-access';

/**
 * Serviço de autenticação simples
 */
export class AuthService {
  /**
   * Obtém o token fixo do sistema
   */
  static getFixedToken(): string {
    return FIXED_TOKEN;
  }

  /**
   * Verifica se um token é válido (comparação simples)
   */
  static verifyToken(token: string): boolean {
    return token === FIXED_TOKEN;
  }

  /**
   * Obtém informações do token fixo
   */
  static getTokenInfo(): { token: string; description: string } {
    return {
      token: FIXED_TOKEN,
      description: 'Token fixo para acesso à API N8N'
    };
  }
}

// Exportar o token fixo para uso em outros lugares
export const FIXED_SYSTEM_TOKEN = AuthService.getFixedToken();
