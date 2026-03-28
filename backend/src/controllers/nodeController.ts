import type { Request, Response, NextFunction } from 'express';
import { NodeService } from '../services/nodeService.js';

export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  list = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const nodes = await this.nodeService.listAll();
      response.json({ data: nodes });
    } catch (error) {
      next(error);
    }
  };

  create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const nodes = await this.nodeService.create(request.body);
      response.status(201).json({ data: nodes });
    } catch (error) {
      next(error);
    }
  };

  update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const nodes = await this.nodeService.update(Number(request.params.id), request.body);
      response.json({ data: nodes });
    } catch (error) {
      next(error);
    }
  };

  remove = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const nodes = await this.nodeService.remove(Number(request.params.id));
      response.json({ data: nodes });
    } catch (error) {
      next(error);
    }
  };

  ping = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.nodeService.ping(Number(request.params.id));
      response.json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}
