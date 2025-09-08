import crypto from 'crypto';
import { EncryptedData, User } from '@/types';
import { logger } from '@/utils/logger';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly threshold = 1024 * 1024; // 1MB threshold para escolher entre Buffer e Streams

  /**
   * Descriptografa dados usando AES-256-GCM
   * @param encryptedData - Dados criptografados
   * @param iv - Vetor de inicialização (base64)
   * @param authTag - Tag de autenticação (base64)
   * @returns Dados descriptografados como string
   */
  private decrypt(encryptedData: string, iv: string, authTag: string): string {
    try {
      // Converter hexadecimal para Buffer (os dados vêm em hex do endpoint)
      const ivBuffer = Buffer.from(iv, 'hex');
      const encryptedBuffer = Buffer.from(encryptedData, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');

      // Criar uma chave derivada usando PBKDF2 com uma senha padrão
      // Em produção, você deve usar a chave real fornecida pelo endpoint
      const password = 'default-password-for-demo';
      const salt = Buffer.from('default-salt-for-demo', 'utf8');
      const keyBuffer = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

      // Criar decipher
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      // Descriptografar
      let decrypted = decipher.update(encryptedBuffer, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      logger.debug('Dados descriptografados com sucesso');
      return decrypted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao descriptografar dados', { error: errorMessage });
      throw new Error(`Falha na descriptografia dos dados + ${errorMessage}`);
    }
  }

  /**
   * Processa dados criptografados e retorna array de usuários
   * @param encryptedData - Objeto com dados criptografados
   * @returns Array de usuários descriptografados
   */
  public async processEncryptedData(encryptedData: any): Promise<User[]> {
    try {
      logger.info('Iniciando processamento de dados criptografados');

      // Verificar se são dados mock
      if (encryptedData.mockData && encryptedData.users) {
        logger.info('Processando dados mock para demonstração');
        return encryptedData.users;
      }

      // Validar entrada para dados reais
      if (!encryptedData.encryptedData || !encryptedData.iv || !encryptedData.authTag) {
        throw new Error('Dados criptografados incompletos');
      }

      // Descriptografar dados usando abordagem híbrida
      const decryptedString = await this.decryptHybrid(
        encryptedData.encryptedData,
        encryptedData.iv,
        encryptedData.authTag
      );

      // Parsear JSON
      let parsedData: any;
      try {
        parsedData = JSON.parse(decryptedString);
      } catch (parseError: unknown) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Erro desconhecido';
        logger.error('Erro ao fazer parse do JSON descriptografado', { 
          error: errorMessage,
          decryptedString: decryptedString.substring(0, 100) + '...'
        });
        throw new Error('Dados descriptografados não são um JSON válido');
      }

      // Validar estrutura dos dados
      if (!Array.isArray(parsedData)) {
        throw new Error('Dados descriptografados devem ser um array');
      }

      // Validar cada usuário
      const users: User[] = parsedData.map((user: any, index: number) => {
        if (!user.nome || !user.email || !user.phone) {
          throw new Error(`Usuário ${index + 1} está incompleto`);
        }

        return {
          nome: String(user.nome).trim(),
          email: String(user.email).trim().toLowerCase(),
          phone: String(user.phone).trim()
        };
      });

      logger.info(`Processados ${users.length} usuários com sucesso`);
      return users;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro no processamento de dados criptografados', { 
        error: errorMessage 
      });
      throw error;
    }
  }

  /**
   * Descriptografa dados usando abordagem híbrida (Buffer ou Streams)
   * Escolhe automaticamente baseado no tamanho dos dados
   */
  private async decryptHybrid(
    encryptedData: string, 
    iv: string, 
    authTag: string
  ): Promise<string> {
    try {
      // Converter hex para buffers
      const ivBuffer = Buffer.from(iv, 'hex');
      const encryptedBuffer = Buffer.from(encryptedData, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');

      // Criar chave derivada
      const password = 'default-password-for-demo';
      const salt = Buffer.from('default-salt-for-demo', 'utf8');
      const keyBuffer = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

      // Criar decipher
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      // Escolher método baseado no tamanho
      const dataSize = encryptedBuffer.length;
      
      if (dataSize < this.threshold) {
        // Buffer para dados pequenos (mais rápido)
        logger.debug(`🔧 Usando Buffer para dados pequenos (${dataSize} bytes)`);
        return this.decryptWithBuffer(encryptedBuffer, decipher);
      } else {
        // Streams para dados grandes (mais eficiente em memória)
        logger.debug(`🌊 Usando Streams para dados grandes (${dataSize} bytes)`);
        return this.decryptWithStreams(encryptedBuffer, decipher);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro na descriptografia híbrida', { error: errorMessage });
      throw new Error('Falha na descriptografia dos dados');
    }
  }

  /**
   * Descriptografa usando Buffer (dados pequenos)
   */
  private decryptWithBuffer(
    encryptedBuffer: Buffer, 
    decipher: crypto.DecipherGCM
  ): string {
    let decrypted = decipher.update(encryptedBuffer, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Descriptografa usando Streams (dados grandes)
   */
  private decryptWithStreams(
    encryptedBuffer: Buffer, 
    decipher: crypto.DecipherGCM
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const { Readable, Writable, Transform } = require('stream');

        // Stream de entrada
        const inputStream = new Readable({
          highWaterMark: 64 * 1024, // 64KB buffer
          read() {
            // Implementação customizada
          }
        });

        // Stream de transformação
        const decryptStream = new Transform({
          highWaterMark: 64 * 1024,
          transform(chunk: Buffer, encoding:any, callback:any) {
            try {
              const decryptedChunk = decipher.update(chunk);
              callback(null, decryptedChunk);
            } catch (error) {
              callback(error);
            }
          },
          flush(callback: any) {
            try {
              const finalChunk = decipher.final();
              callback(null, finalChunk);
            } catch (error) {
              callback(error);
            }
          }
        });

        // Stream de saída
        const outputChunks: Buffer[] = [];
        const outputStream = new Writable({
          highWaterMark: 64 * 1024,
          write(chunk: Buffer, encoding:any, callback:any) {
            outputChunks.push(chunk);
            callback();
          }
        });

        // Pipeline
        inputStream
          .pipe(decryptStream)
          .pipe(outputStream);

        // Tratamento de erros
        inputStream.on('error', reject);
        decryptStream.on('error', reject);
        outputStream.on('error', reject);

        // Finalização
        outputStream.on('finish', () => {
          const result = Buffer.concat(outputChunks).toString('utf8');
          resolve(result);
        });

        // Enviar dados em chunks
        this.sendDataInChunks(inputStream, encryptedBuffer);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Envia dados em chunks para o stream
   */
  private sendDataInChunks(stream: any, data: Buffer): void {
    const chunkSize = 64 * 1024; // 64KB
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      stream.push(chunk);
    }
    
    stream.push(null); // EOF
  }

  /**
   * Valida se os dados criptografados têm a estrutura esperada
   * @param data - Dados a serem validados
   * @returns true se válido, false caso contrário
   */
  public validateEncryptedData(data: any): boolean {
    // Aceitar dados mock
    if (data && data.mockData && data.users) {
      return true;
    }
    
    // Validar dados reais criptografados
    return (
      data &&
      typeof data === 'object' &&
      typeof data.encryptedData === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.authTag === 'string' &&
      data.encryptedData.length > 0 &&
      data.iv.length > 0 &&
      data.authTag.length > 0
    );
  }

  /**
   * Obtém estatísticas de performance e configuração
   */
  public getPerformanceStats(): any {
    return {
      threshold: this.threshold,
      algorithm: this.algorithm,
      chunkSize: 64 * 1024,
      description: 'Abordagem híbrida: Buffer para dados pequenos, Streams para dados grandes'
    };
  }
}

export const encryptionService = new EncryptionService();
