import { Router } from 'express';
import { ProtocolProfileController } from '../controllers/protocolProfileController.js';

export const createProtocolProfileRouter = (
  protocolProfileController: ProtocolProfileController
): Router => {
  const router = Router();

  router.get('/', protocolProfileController.list);
  router.post('/', protocolProfileController.create);
  router.patch('/:id', protocolProfileController.update);
  router.delete('/:id', protocolProfileController.remove);

  return router;
};
