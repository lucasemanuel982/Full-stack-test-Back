import { Request, Response, NextFunction } from 'express';
import { ApiResponse, User } from '@/types';
import { encryptionService } from '@/services/encryptionService';
import { n8nService } from '@/services/n8nService';
import { logger } from '@/utils/logger';
import { CustomError } from '@/middleware/errorHandler';

export class DataController {
  /**
   * Executa o fluxo completo: busca dados criptografados, descriptografa e envia para N8N
   */
  public async executeDataFlow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Iniciando fluxo de execução de dados');

      // 1. Buscar dados criptografados do endpoint externo
      const encryptedData = await n8nService.fetchEncryptedData();
      
      // 2. Validar estrutura dos dados criptografados
      if (!encryptionService.validateEncryptedData(encryptedData)) {
        throw new CustomError('Dados criptografados inválidos', 400);
      }

      // 3. Descriptografar dados
      const users = await encryptionService.processEncryptedData(encryptedData);

      // 4. Enviar dados para N8N
      const n8nResponse = await n8nService.sendDataToN8N(users);

      if (!n8nResponse.success) {
        throw new CustomError(n8nResponse.error || 'Erro ao processar dados no N8N', 500);
      }

      // 5. Resposta de sucesso
      const response: ApiResponse<User[]> = {
        success: true,
        data: users,
        message: `Fluxo executado com sucesso. ${users.length} usuários processados.`
      };

      logger.info('Fluxo de execução concluído com sucesso', {
        usersCount: users.length,
        n8nSuccess: n8nResponse.success
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Erro no fluxo de execução de dados', {
        error: errorMessage,
        stack: errorStack
      });
      next(error);
    }
  }

  /**
   * Limpa os dados no N8N e no banco de dados
   */
  public async clearData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Iniciando limpeza de dados');

      // Solicitar limpeza no N8N
      const n8nResponse = await n8nService.clearDataInN8N();

      if (!n8nResponse.success) {
        throw new CustomError(n8nResponse.error || 'Erro ao limpar dados no N8N', 500);
      }

      // Resposta de sucesso
      const response: ApiResponse = {
        success: true,
        message: 'Dados limpos com sucesso'
      };

      logger.info('Limpeza de dados concluída com sucesso');

      res.status(200).json(response);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Erro na limpeza de dados', {
        error: errorMessage,
        stack: errorStack
      });
      next(error);
    }
  }

  /**
   * Verifica o status dos serviços
   */
  public async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('Verificando status dos serviços');

      // Verificar conectividade com N8N
      const n8nAvailable = await n8nService.checkN8NHealth();

      const response: ApiResponse = {
        success: true,
        data: {
          status: 'healthy',
          services: {
            n8n: n8nAvailable ? 'available' : 'unavailable',
            encryption: 'available',
            database: 'unknown' // Será verificado pelo N8N
          },
          timestamp: new Date().toISOString()
        },
        message: 'Serviços verificados'
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      logger.error('Erro na verificação de saúde', {
        error: errorMessage
      });
      next(error);
    }
  }

  /**
   * Busca dados do webhook externo
   */
  public async getData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Iniciando busca de dados do webhook externo');

      // Buscar dados do webhook externo
      const data = await n8nService.fetchDataFromExternalWebhook();

      // Resposta de sucesso
      const response: ApiResponse = {
        success: true,
        data: data,
        message: 'Dados obtidos com sucesso do webhook externo'
      };

      logger.info('Busca de dados concluída com sucesso', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : []
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Erro na busca de dados', {
        error: errorMessage,
        stack: errorStack
      });
      next(error);
    }
  }

  /**
   * Obtém informações sobre a API
   */
  public async getApiInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: ApiResponse = {
        success: true,
        data: {
          name: 'Fullstack N8N Backend API',
          version: '1.0.0',
          description: 'API para integração com N8N, descriptografia AES-256-GCM e PostgreSQL',
          endpoints: {
            'POST /api/data/execute': 'Executa fluxo completo de dados',
            'POST /api/data/clear': 'Limpa dados no N8N e banco',
            'GET /api/data/get-data': 'Busca dados do webhook externo',
            'GET /api/health': 'Verifica status dos serviços',
            'GET /api/info': 'Informações da API'
          },
          features: [
            'Descriptografia AES-256-GCM',
            'Integração com N8N',
            'Validação de dados',
            'Logs estruturados',
            'Tratamento de erros',
            'Rate limiting',
            'CORS configurado'
          ]
        },
        message: 'Informações da API'
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      logger.error('Erro ao obter informações da API', {
        error: errorMessage
      });
      next(error);
    }
  }
}

export const dataController = new DataController();
