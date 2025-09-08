import { Router } from 'express';
import { dataController } from '@/controllers/dataController';
import { criticalRateLimit, attackDetection, payloadSizeLimit } from '@/middleware/security';
import { sanitizeInput } from '@/middleware/validation';

const router = Router();

// Middleware específico para rotas de dados
router.use(attackDetection);
router.use(sanitizeInput);
router.use(payloadSizeLimit(1024 * 1024)); // 1MB max

// Rota para executar fluxo de dados
router.post(
  '/execute',
  criticalRateLimit, // Rate limit mais restritivo para operações críticas
  dataController.executeDataFlow.bind(dataController)
);

// Rota para limpar dados
router.post(
  '/clear',
  criticalRateLimit, // Rate limit mais restritivo para operações críticas
  dataController.clearData.bind(dataController)
);

// Rota para buscar dados do webhook externo
router.get(
  '/get-data',
  dataController.getData.bind(dataController)
);

// Rota para verificar saúde dos serviços
router.get(
  '/health',
  dataController.healthCheck.bind(dataController)
);

// Rota para informações da API
router.get(
  '/info',
  dataController.getApiInfo.bind(dataController)
);

export default router;

