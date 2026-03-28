import type { NextFunction, Request, Response } from 'express';
import { ProtocolProfileService } from '../services/protocolProfileService.js';

export class ProtocolProfileController {
  constructor(private readonly protocolProfileService: ProtocolProfileService) {}

  list = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const profiles = await this.protocolProfileService.listAll();
      response.json({ data: profiles });
    } catch (error) {
      next(error);
    }
  };

  create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const profiles = await this.protocolProfileService.create(request.body);
      response.status(201).json({ data: profiles });
    } catch (error) {
      next(error);
    }
  };

  update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const profiles = await this.protocolProfileService.update(Number(request.params.id), request.body);
      response.json({ data: profiles });
    } catch (error) {
      next(error);
    }
  };

  remove = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const profiles = await this.protocolProfileService.remove(Number(request.params.id));
      response.json({ data: profiles });
    } catch (error) {
      next(error);
    }
  };
}
