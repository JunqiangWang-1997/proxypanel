import { Router } from 'express';
import { NodeController } from '../controllers/nodeController.js';

export const createNodeRouter = (nodeController: NodeController): Router => {
  const router = Router();

  router.get('/', nodeController.list);
  router.post('/', nodeController.create);
  router.patch('/:id', nodeController.update);
  router.delete('/:id', nodeController.remove);
  router.post('/:id/ping', nodeController.ping);

  return router;
};
