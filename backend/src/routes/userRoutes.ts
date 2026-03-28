import { Router } from 'express';
import { UserController } from '../controllers/userController.js';

export const createUserRouter = (userController: UserController): Router => {
  const router = Router();

  router.get('/', userController.list);
  router.post('/', userController.create);
  router.delete('/:id', userController.remove);

  return router;
};

