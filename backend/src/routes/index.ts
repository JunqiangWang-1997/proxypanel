import { Router } from 'express';
import { NodeController } from '../controllers/nodeController.js';
import { ProtocolProfileController } from '../controllers/protocolProfileController.js';
import { UserController } from '../controllers/userController.js';
import { createNodeRouter } from './nodeRoutes.js';
import { createProtocolProfileRouter } from './protocolProfileRoutes.js';
import { createUserRouter } from './userRoutes.js';

export const createApiRouter = (
  nodeController: NodeController,
  protocolProfileController: ProtocolProfileController,
  userController: UserController
): Router => {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.json({ data: { status: 'ok' } });
  });

  router.use('/nodes', createNodeRouter(nodeController));
  router.use('/protocol-profiles', createProtocolProfileRouter(protocolProfileController));
  router.use('/users', createUserRouter(userController));

  return router;
};
