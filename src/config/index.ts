import dotenv from 'dotenv';
import { ServerConfig } from '@/types';

// Carregar variáveis de ambiente
dotenv.config();

// Validação das variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'ENCRYPTED_DATA_URL',
  'N8N_WEBHOOK_URL',
  'N8N_CLEAR_WEBHOOK_URL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${envVar}`);
  }
});

// Configuração do servidor
export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  encryptedDataUrl: process.env.ENCRYPTED_DATA_URL!,
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL!,
  n8nClearWebhookUrl: process.env.N8N_CLEAR_WEBHOOK_URL!,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  // Token fixo para autenticação
  fixedToken: process.env.FIXED_TOKEN || 'n8n-api-token-2024-fixed-access'
};

// Validação da configuração
export const validateConfig = (): void => {
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Porta deve estar entre 1 e 65535');
  }

  if (!['development', 'production', 'test'].includes(config.nodeEnv)) {
    throw new Error('NODE_ENV deve ser development, production ou test');
  }

  try {
    new URL(config.encryptedDataUrl);
    new URL(config.n8nWebhookUrl);
    new URL(config.n8nClearWebhookUrl);
  } catch (error) {
    throw new Error('URLs de configuração inválidas');
  }
};

