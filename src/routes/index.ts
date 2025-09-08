import { Router } from 'express';
import dataRoutes from './dataRoutes';

const router = Router();

// Rotas da API
router.use('/data', dataRoutes);

// Rota raiz da API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fullstack N8N Backend API',
    version: '1.0.0',
    endpoints: {
      'GET /api': 'Informações da API',
      'POST /api/data/execute': 'Executa fluxo completo de dados',
      'POST /api/data/clear': 'Limpa dados no N8N e banco',
      'GET /api/data/health': 'Verifica status dos serviços',
      'GET /api/data/info': 'Informações detalhadas da API',
      'GET /api/data/get-data': 'Busca as informações do banco de dados através do webhook externo'
    },
    documentation: 'Consulte /api/data/info para informações detalhadas'
  });
});

export default router;

