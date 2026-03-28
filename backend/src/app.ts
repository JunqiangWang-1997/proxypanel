import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { NodeRepository } from './repositories/nodeRepository.js';
import { ProtocolProfileRepository } from './repositories/protocolProfileRepository.js';
import { UserRepository } from './repositories/userRepository.js';
import { NodeService } from './services/nodeService.js';
import { ProtocolProfileService } from './services/protocolProfileService.js';
import { UserService } from './services/userService.js';
import { XrayGrpcService } from './services/xrayGrpcService.js';
import { NodeDeploymentService } from './services/nodeDeploymentService.js';
import { NodeController } from './controllers/nodeController.js';
import { ProtocolProfileController } from './controllers/protocolProfileController.js';
import { UserController } from './controllers/userController.js';
import { createApiRouter } from './routes/index.js';

export const createApp = (): express.Express => {
  const app = express();

  const nodeRepository = new NodeRepository();
  const protocolProfileRepository = new ProtocolProfileRepository();
  const userRepository = new UserRepository();
  const xrayGrpcService = new XrayGrpcService();
  const protocolProfileService = new ProtocolProfileService(protocolProfileRepository);
  const nodeDeploymentService = new NodeDeploymentService();
  const nodeService = new NodeService(
    nodeRepository,
    userRepository,
    protocolProfileService,
    xrayGrpcService,
    nodeDeploymentService
  );
  const userService = new UserService(userRepository, nodeService, xrayGrpcService);
  const nodeController = new NodeController(nodeService);
  const protocolProfileController = new ProtocolProfileController(protocolProfileService);
  const userController = new UserController(userService);

  app.use(
    cors({
      origin: env.frontendOrigin
    })
  );
  app.use(express.json());
  app.use('/api', createApiRouter(nodeController, protocolProfileController, userController));

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message.includes('not found') ? 404 :
      message.includes('cannot be deleted') ? 409 :
      message.includes('already exists') ? 409 :
      message.includes('Unsupported protocol') ? 400 :
      message.includes('requires sshpass') ? 500 :
      message.includes('Xray gRPC error') ? 502 :
      400;

    response.status(status).json({ message });
  });

  return app;
};
