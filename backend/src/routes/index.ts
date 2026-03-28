import { Router } from 'express';
import { NodeController } from '../controllers/nodeController.js';
import { UserController } from '../controllers/userController.js';
import { createNodeRouter } from './nodeRoutes.js';
import { createUserRouter } from './userRoutes.js';

export const createApiRouter = (
  nodeController: NodeController,
  userController: UserController
): Router => {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.json({ data: { status: 'ok' } });
  });

  router.use('/nodes', createNodeRouter(nodeController));
  router.use('/users', createUserRouter(userController));

  return router;
};

