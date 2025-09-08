import app from './app';
import { config, validateConfig } from '@/config';
import { logger } from '@/utils/logger';

// Validar configuração antes de iniciar o servidor
try {
  validateConfig();
  logger.info('Configuração validada com sucesso');
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  logger.error('Erro na configuração', { error: errorMessage });
  process.exit(1);
}

// Função para iniciar o servidor
const startServer = async (): Promise<void> => {
  try {
    // Iniciar servidor
    const server = app.listen(config.port, () => {
      logger.info('Servidor iniciado com sucesso', {
        port: config.port,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString()
      });
      
      console.log(`
🚀 Servidor Fullstack N8N Backend iniciado!
📍 Porta: ${config.port}
🌍 Ambiente: ${config.nodeEnv}
📊 Log Level: ${config.logLevel}
🔗 API: http://localhost:${config.port}/api
📋 Health Check: http://localhost:${config.port}/api/data/health
📖 Info: http://localhost:${config.port}/api/data/info
      `);
    });

    // Configurar timeout do servidor
    server.timeout = 30000; // 30 segundos

    // Tratamento de sinais do sistema
    const gracefulShutdown = (signal: string) => {
      logger.info(`Sinal ${signal} recebido, iniciando shutdown graceful`);
      
      server.close((err) => {
        if (err) {
          logger.error('Erro durante shutdown do servidor', { error: err.message });
          process.exit(1);
        }
        
        logger.info('Servidor fechado com sucesso');
        process.exit(0);
      });
    };

    // Capturar sinais de terminação
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Tratamento de erros não capturados do servidor
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Porta ${config.port} já está em uso`);
        process.exit(1);
      } else {
        logger.error('Erro no servidor', { error: error.message });
        process.exit(1);
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao iniciar servidor', { error: errorMessage });
    process.exit(1);
  }
};

// Iniciar servidor
startServer();
