import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { NodeRepository } from './repositories/nodeRepository.js';
import { UserRepository } from './repositories/userRepository.js';
import { NodeService } from './services/nodeService.js';
import { UserService } from './services/userService.js';
import { XrayGrpcService } from './services/xrayGrpcService.js';
import { NodeController } from './controllers/nodeController.js';
import { UserController } from './controllers/userController.js';
import { createApiRouter } from './routes/index.js';

export const createApp = (): express.Express => {
  const app = express();

  const nodeRepository = new NodeRepository();
  const userRepository = new UserRepository();
  const xrayGrpcService = new XrayGrpcService();
  const nodeService = new NodeService(nodeRepository, userRepository, xrayGrpcService);
  const userService = new UserService(userRepository, nodeService, xrayGrpcService);
  const nodeController = new NodeController(nodeService);
  const userController = new UserController(userService);

  app.use(
    cors({
      origin: env.frontendOrigin
    })
  );
  app.use(express.json());
  app.use('/api', createApiRouter(nodeController, userController));

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message.includes('not found') ? 404 :
      message.includes('cannot be deleted') ? 409 :
      message.includes('Unsupported protocol') ? 400 :
      message.includes('Xray gRPC error') ? 502 :
      400;

    response.status(status).json({ message });
  });

  return app;
};
