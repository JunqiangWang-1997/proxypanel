import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { NodeService } from './nodeService.js';
import { UserRepository } from '../repositories/userRepository.js';
import { XrayGrpcService } from './xrayGrpcService.js';
import type { CreateUserInput, UserWithNodeRecord } from '../types/models.js';

const createUserSchema = z.object({
  email: z.string().email(),
  nodeId: z.coerce.number().int().positive(),
  uuid: z.string().uuid().optional(),
  flow: z.string().max(100).optional().default(''),
  level: z.coerce.number().int().min(0).max(255).optional().default(0),
  remark: z.string().max(255).optional().default('')
});

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly nodeService: NodeService,
    private readonly xrayGrpcService: XrayGrpcService
  ) {}

  list(): Promise<UserWithNodeRecord[]> {
    return this.userRepository.list();
  }

  async create(input: CreateUserInput): Promise<UserWithNodeRecord[]> {
    const parsed = createUserSchema.parse(input);
    const node = await this.nodeService.getById(parsed.nodeId);

    if (!['online', 'imported'].includes(node.deploymentStatus)) {
      throw new Error('Selected node has not been deployed yet');
    }

    if (node.protocol !== 'vless') {
      throw new Error(`Unsupported protocol for user management: ${node.protocol}`);
    }

    const userToCreate = {
      email: parsed.email,
      nodeId: parsed.nodeId,
      uuid: parsed.uuid ?? randomUUID(),
      level: parsed.level,
      flow: parsed.flow,
      remark: parsed.remark
    };

    await this.xrayGrpcService.addUser(node, {
      email: userToCreate.email,
      uuid: userToCreate.uuid,
      level: userToCreate.level,
      flow: userToCreate.flow
    });

    try {
      await this.userRepository.create(userToCreate);
    } catch (error) {
      await this.xrayGrpcService.removeUser(node, userToCreate.email).catch(() => undefined);

      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('User already exists on the selected node');
      }

      throw error;
    }

    return this.userRepository.list();
  }

  async remove(id: number): Promise<UserWithNodeRecord[]> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    const node = await this.nodeService.getById(user.nodeId);

    if (node.protocol !== 'vless') {
      throw new Error(`Unsupported protocol for user management: ${node.protocol}`);
    }

    await this.xrayGrpcService.removeUser(node, user.email);
    await this.userRepository.remove(id);

    return this.userRepository.list();
  }
}
