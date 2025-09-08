import { Router } from 'express';
import { dataController } from '@/controllers/dataController';
import { criticalRateLimit, attackDetection, payloadSizeLimit } from '@/middleware/security';
import { sanitizeInput } from '@/middleware/validation';
import { authenticateToken, optionalAuth } from '@/middleware/auth';

const router = Router();

// Middleware específico para rotas de dados
router.use(attackDetection);
router.use(sanitizeInput);
router.use(payloadSizeLimit(1024 * 1024)); // 1MB max

// Rota para executar fluxo de dados (requer autenticação)
router.post(
  '/execute',
  authenticateToken, // Requer token JWT válido
  criticalRateLimit, // Rate limit mais restritivo para operações críticas
  dataController.executeDataFlow.bind(dataController)
);

// Rota para limpar dados (requer autenticação)
router.post(
  '/clear',
  authenticateToken, // Requer token JWT válido
  criticalRateLimit, // Rate limit mais restritivo para operações críticas
  dataController.clearData.bind(dataController)
);

// Rota para buscar dados do webhook externo (requer autenticação)
router.get(
  '/get-data',
  authenticateToken, // Requer token JWT válido
  dataController.getData.bind(dataController)
);

// Rota para verificar saúde dos serviços (acesso público)
router.get(
  '/health',
  dataController.healthCheck.bind(dataController)
);

// Rota para informações da API (acesso público)
router.get(
  '/info',
  dataController.getApiInfo.bind(dataController)
);

export default router;

