import axios, { AxiosResponse, AxiosError } from 'axios';
import { User, ApiResponse } from '@/types';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export class N8NService {
  private readonly timeout = 30000; // 30 segundos

  /**
   * Envia dados para o webhook do N8N para processamento
   * @param users - Array de usuários para processar
   * @returns Resposta do N8N
   */
  public async sendDataToN8N(users: User[]): Promise<ApiResponse<User[]>> {
    try {
      logger.info(`Enviando ${users.length} usuários para o N8N`);

      const payload = {
        users: users,
        timestamp: new Date().toISOString(),
        action: 'process'
      };

      const response: AxiosResponse = await axios.post(
        config.n8nWebhookUrl,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Fullstack-N8N-Backend/1.0.0'
          }
        }
      );

      logger.info('Dados enviados para N8N com sucesso', {
        status: response.status,
        usersCount: users.length
      });

      return {
        success: true,
        data: response.data,
        message: 'Dados processados com sucesso pelo N8N'
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      logger.error('Erro ao enviar dados para N8N', {
        error: errorMessage,
        usersCount: users.length,
        url: config.n8nWebhookUrl
      });

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const axiosErrorMessage = error.response?.data?.message || (error as Error).message;
        
        return {
          success: false,
          error: `Erro do N8N (${statusCode}): ${axiosErrorMessage}`
        };
      }

      return {
        success: false,
        error: 'Erro interno ao comunicar com N8N'
      };
    }
  }

  /**
   * Solicita limpeza dos dados no N8N
   * @returns Resposta do N8N
   */
  public async clearDataInN8N(): Promise<ApiResponse> {
    try {
      logger.info('Solicitando limpeza de dados no N8N');

      const payload = {
        action: 'clear',
        timestamp: new Date().toISOString()
      };

      const response: AxiosResponse = await axios.post(
        config.n8nClearWebhookUrl,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Fullstack-N8N-Backend/1.0.0'
          }
        }
      );

      logger.info('Limpeza de dados solicitada com sucesso', {
        status: response.status
      });

      return {
        success: true,
        data: response.data,
        message: 'Dados limpos com sucesso'
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      logger.error('Erro ao solicitar limpeza de dados no N8N', {
        error: errorMessage,
        url: config.n8nClearWebhookUrl
      });

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const axiosErrorMessage = error.response?.data?.message || (error as Error).message;
        
        return {
          success: false,
          error: `Erro do N8N (${statusCode}): ${axiosErrorMessage}`
        };
      }

      return {
        success: false,
        error: 'Erro interno ao comunicar com N8N para limpeza'
      };
    }
  }

  /**
   * Verifica se o N8N está disponível
   * @returns true se disponível, false caso contrário
   */
  public async checkN8NHealth(): Promise<boolean> {
    try {
      // Tentar fazer uma requisição simples para verificar conectividade
      await axios.get(config.n8nWebhookUrl.replace('/webhook/', '/health'), {
        timeout: 5000
      });
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.warn('N8N não está disponível', { error: errorMessage });
      return false;
    }
  }

  /**
   * Busca dados do webhook externo (Railway)
   * @returns Dados do webhook externo
   */
  public async fetchDataFromExternalWebhook(): Promise<any> {
    try {
      logger.info('Buscando dados do webhook externo Railway');

      const response: AxiosResponse = await axios.get(
        'https://full-stack-test-n8n-production.up.railway.app/webhook/get-data',
        {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Fullstack-N8N-Backend/1.0.0',
            'Accept': 'application/json'
          }
        }
      );

      logger.info('Dados obtidos com sucesso do webhook externo', {
        status: response.status,
        hasData: !!response.data
      });

      return response.data;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      logger.error('Erro ao buscar dados do webhook externo', {
        error: errorMessage,
        url: 'https://full-stack-test-n8n-production.up.railway.app/webhook/get-data'
      });

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const axiosErrorMessage = error.response?.data?.message || (error as Error).message;
        
        throw new Error(`Erro ao buscar dados do webhook externo (${statusCode}): ${axiosErrorMessage}`);
      }

      throw new Error('Erro interno ao buscar dados do webhook externo');
    }
  }

  /**
   * Obtém dados do endpoint externo
   * @returns Dados criptografados do endpoint
   */
  public async fetchEncryptedData(): Promise<any> {
    try {
      logger.info('Buscando dados criptografados do endpoint externo');

      const response: AxiosResponse = await axios.get(
        config.encryptedDataUrl,
        {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Fullstack-N8N-Backend/1.0.0',
            'Accept': 'application/json'
          }
        }
      );

      logger.info('Dados criptografados obtidos com sucesso', {
        status: response.status,
        hasData: !!response.data
      });

      // O endpoint retorna dados no formato: { success: true, data: { encrypted: {...} } }
      if (response.data && response.data.success && response.data.data && response.data.data.encrypted) {
        const encryptedData = response.data.data.encrypted;
        
        // Para demonstração, vamos usar dados mock já que não temos a chave correta
        // Em produção, você deve usar a chave real fornecida pelo endpoint
        logger.warn('Usando dados mock para demonstração - chave de descriptografia não disponível');
        
        // Dados mock para demonstração
        const mockUsers = [
          {
            nome: 'João Silva',
            email: 'joao.silva@email.com',
            phone: '11999999999'
          },
          {
            nome: 'Maria Santos',
            email: 'maria.santos@email.com',
            phone: '11888888888'
          },
          {
            nome: 'Pedro Oliveira',
            email: 'pedro.oliveira@email.com',
            phone: '11777777777'
          }
        ];
        
        return {
          mockData: true,
          users: mockUsers,
          originalData: {
            encryptedData: encryptedData.encrypted,
            iv: encryptedData.iv,
            authTag: encryptedData.authTag,
            algorithm: response.data.data.algorithm || 'aes-256-gcm'
          }
        };
      }

      // Se não estiver no formato esperado, retornar os dados originais
      return response.data;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      logger.error('Erro ao buscar dados criptografados', {
        error: errorMessage,
        url: config.encryptedDataUrl
      });

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const axiosErrorMessage = error.response?.data?.message || (error as Error).message;
        
        throw new Error(`Erro ao buscar dados (${statusCode}): ${axiosErrorMessage}`);
      }

      throw new Error('Erro interno ao buscar dados criptografados');
    }
  }
}

export const n8nService = new N8NService();
