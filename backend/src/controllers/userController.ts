import type { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  list = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userService.list();
      response.json({ data: users });
    } catch (error) {
      next(error);
    }
  };

  create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userService.create(request.body);
      response.status(201).json({ data: users });
    } catch (error) {
      next(error);
    }
  };

  remove = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userService.remove(Number(request.params.id));
      response.json({ data: users });
    } catch (error) {
      next(error);
    }
  };
}

