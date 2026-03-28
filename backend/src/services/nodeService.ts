import { z } from 'zod';
import { NodeRepository } from '../repositories/nodeRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { ProtocolProfileService } from './protocolProfileService.js';
import { XrayGrpcService } from './xrayGrpcService.js';
import { NodeDeploymentService } from './nodeDeploymentService.js';
import type {
  CreateNodeInput,
  NodeRecord,
  NodeSummary,
  UpdateNodeInput
} from '../types/models.js';

const nodeSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    host: z.string().trim().min(1).max(255),
    sshPort: z.coerce.number().int().min(1).max(65535).optional().default(22),
    sshUser: z.string().trim().min(1).max(100).optional().default('root'),
    authType: z.enum(['password', 'privateKey']).optional().default('privateKey'),
    password: z.string().max(5000).optional().default(''),
    privateKey: z.string().max(20000).optional().default(''),
    protocolProfileId: z.coerce.number().int().positive(),
    grpcPort: z.coerce.number().int().min(1).max(65535).optional().default(10085),
    inboundTag: z.string().trim().min(1).max(100).optional().default('main-inbound'),
    tlsEnabled: z.coerce.boolean().optional().default(false),
    enabled: z.coerce.boolean().optional().default(true)
  })
  .superRefine((value, context) => {
    if (value.authType === 'password' && value.password.trim().length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password is required when password authentication is selected'
      });
    }

    if (value.authType === 'privateKey' && value.privateKey.trim().length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['privateKey'],
        message: 'Private key is required when key authentication is selected'
      });
    }
  });

const toSummary = (node: NodeRecord): NodeSummary => ({
  id: node.id,
  name: node.name,
  host: node.host,
  sshPort: node.sshPort,
  sshUser: node.sshUser,
  authType: node.authType,
  hasPassword: Boolean(node.password),
  hasPrivateKey: Boolean(node.privateKey),
  protocolProfileId: node.protocolProfileId,
  protocolProfileName: node.protocolProfileName,
  protocolProfileSlug: node.protocolProfileSlug,
  grpcHost: node.grpcHost,
  grpcPort: node.grpcPort,
  inboundTag: node.inboundTag,
  protocol: node.protocol,
  tlsEnabled: node.tlsEnabled,
  enabled: node.enabled,
  deploymentStatus: node.deploymentStatus,
  statusMessage: node.statusMessage,
  lastDeployedAt: node.lastDeployedAt,
  createdAt: node.createdAt,
  updatedAt: node.updatedAt
});

export class NodeService {
  constructor(
    private readonly nodeRepository: NodeRepository,
    private readonly userRepository: UserRepository,
    private readonly protocolProfileService: ProtocolProfileService,
    private readonly xrayGrpcService: XrayGrpcService,
    private readonly nodeDeploymentService: NodeDeploymentService
  ) {}

  async listAll(): Promise<NodeSummary[]> {
    const nodes = await this.nodeRepository.listAll();
    return nodes.map(toSummary);
  }

  async listEnabled(): Promise<NodeRecord[]> {
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

  async create(input: CreateNodeInput): Promise<NodeSummary[]> {
    const parsed = nodeSchema.parse(input);
    const profile = await this.protocolProfileService.getExistingById(parsed.protocolProfileId);

    await this.nodeRepository.create({
      ...parsed,
      password: parsed.password.trim() || undefined,
      privateKey: parsed.privateKey.trim() || undefined,
      protocol: profile.coreType,
      inboundTag: parsed.inboundTag || profile.inboundTag
    });

    return this.listAll();
  }

  async update(id: number, input: UpdateNodeInput): Promise<NodeSummary[]> {
    const current = await this.getExistingById(id);
    const password = input.password !== undefined
      ? (input.password.trim() || current.password || '')
      : (current.password || '');
    const privateKey = input.privateKey !== undefined
      ? (input.privateKey.trim() || current.privateKey || '')
      : (current.privateKey || '');
    const parsed = nodeSchema.parse({
      ...current,
      ...input,
      password,
      privateKey
    });
    const profile = await this.protocolProfileService.getExistingById(parsed.protocolProfileId);

    await this.nodeRepository.update(id, {
      ...parsed,
      password: parsed.password.trim() || undefined,
      privateKey: parsed.privateKey.trim() || undefined,
      protocol: profile.coreType,
      inboundTag: parsed.inboundTag || profile.inboundTag
    });

    return this.listAll();
  }

  async remove(id: number): Promise<NodeSummary[]> {
    await this.getExistingById(id);

    const userCount = await this.userRepository.countByNodeId(id);

    if (userCount > 0) {
      throw new Error('Node has linked users and cannot be deleted');
    }

    await this.nodeRepository.remove(id);
    return this.listAll();
  }

  async probe(id: number): Promise<{ nodeId: number; ok: true; checkedAt: string; output: string }> {
    const node = await this.getExistingById(id);
    const result = await this.nodeDeploymentService.probe(node);

    return {
      nodeId: id,
      ...result
    };
  }

  async deploy(id: number): Promise<{
    nodeId: number;
    checkedAt: string;
    grpcEndpoint: string;
    statusMessage: string;
  }> {
    const node = await this.getExistingById(id);

    if (!node.protocolProfileId) {
      throw new Error('Node has no protocol profile selected');
    }

    const profile = await this.protocolProfileService.getExistingById(node.protocolProfileId);

    await this.nodeRepository.updateDeploymentState(id, {
      deploymentStatus: 'provisioning',
      statusMessage: `Deploying ${profile.name} to ${node.host}`,
      grpcHost: node.host,
      grpcPort: node.grpcPort,
      inboundTag: node.inboundTag,
      protocol: profile.coreType
    });

    try {
      const result = await this.nodeDeploymentService.deploy(node, profile);
      const deployedNode = await this.nodeRepository.updateDeploymentState(id, {
        grpcHost: node.host,
        grpcPort: node.grpcPort,
        inboundTag: node.inboundTag,
        protocol: profile.coreType,
        deploymentStatus: 'online',
        statusMessage: result.remoteOutput || `Deployed ${profile.name} successfully`,
        lastDeployedAt: result.checkedAt
      });

      await this.xrayGrpcService.ping(deployedNode);

      return {
        nodeId: id,
        checkedAt: result.checkedAt,
        grpcEndpoint: `${deployedNode.grpcHost}:${deployedNode.grpcPort}`,
        statusMessage: deployedNode.statusMessage ?? 'Deployment completed'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Node deployment failed';

      await this.nodeRepository.updateDeploymentState(id, {
        grpcHost: node.host,
        grpcPort: node.grpcPort,
        inboundTag: node.inboundTag,
        protocol: profile.coreType,
        deploymentStatus: 'error',
        statusMessage: message,
        lastDeployedAt: null
      });

      throw new Error(message);
    }
  }
}
