// Tipos para os dados de usuário
export interface User {
  id?: number;
  nome: string;
  email: string;
  phone: string;
}

// Tipos para dados criptografados recebidos do endpoint
export interface EncryptedData {
  encryptedData: string;
  iv: string;
  key: string;
}

// Tipos para resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos para configuração do servidor
export interface ServerConfig {
  port: number;
  nodeEnv: string;
  encryptedDataUrl: string;
  n8nWebhookUrl: string;
  n8nClearWebhookUrl: string;
  corsOrigin: string;
  logLevel: string;
  fixedToken: string;
}

// Tipos para logs
export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

