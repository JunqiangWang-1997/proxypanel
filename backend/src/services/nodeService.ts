import { NodeRepository } from '../repositories/nodeRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { XrayGrpcService } from './xrayGrpcService.js';
import { z } from 'zod';
import type { CreateNodeInput, NodeRecord, UpdateNodeInput } from '../types/models.js';

const nodeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  grpcHost: z.string().trim().min(1).max(255),
  grpcPort: z.coerce.number().int().min(1).max(65535),
  inboundTag: z.string().trim().min(1).max(100),
  protocol: z.string().trim().min(1).max(30).default('vless'),
  tlsEnabled: z.coerce.boolean().optional().default(false),
  enabled: z.coerce.boolean().optional().default(true)
});

export class NodeService {
  constructor(
    private readonly nodeRepository: NodeRepository,
    private readonly userRepository: UserRepository,
    private readonly xrayGrpcService: XrayGrpcService
  ) {}

  listAll(): Promise<NodeRecord[]> {
    return this.nodeRepository.listAll();
  }

  listEnabled(): Promise<NodeRecord[]> {
    return this.nodeRepository.listEnabled();
  }

  async getExistingById(id: number): Promise<NodeRecord> {
    const node = await this.nodeRepository.findById(id);

    if (!node) {
      throw new Error('Node not found');
    }

    return node;
  }

  async getById(id: number): Promise<NodeRecord> {
    const node = await this.getExistingById(id);

    if (!node.enabled) {
      throw new Error('Node not found or disabled');
    }

    return node;
  }

  async create(input: CreateNodeInput): Promise<NodeRecord[]> {
    const parsed = nodeSchema.parse(input);
    await this.nodeRepository.create(parsed);
    return this.nodeRepository.listAll();
  }

  async update(id: number, input: UpdateNodeInput): Promise<NodeRecord[]> {
    const current = await this.getExistingById(id);
    const parsed = nodeSchema.parse({
      ...current,
      ...input
    });

    await this.nodeRepository.update(id, parsed);
    return this.nodeRepository.listAll();
  }

  async remove(id: number): Promise<NodeRecord[]> {
    await this.getExistingById(id);

    const userCount = await this.userRepository.countByNodeId(id);

    if (userCount > 0) {
      throw new Error('Node has linked users and cannot be deleted');
    }

    await this.nodeRepository.remove(id);
    return this.nodeRepository.listAll();
  }

  async ping(id: number): Promise<{ nodeId: number; ok: true; checkedAt: string }> {
    const node = await this.getExistingById(id);
    const result = await this.xrayGrpcService.ping(node);

    return {
      nodeId: id,
      ...result
    };
  }
}
