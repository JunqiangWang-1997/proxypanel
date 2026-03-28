import { z } from 'zod';
import { ProtocolProfileRepository } from '../repositories/protocolProfileRepository.js';
import type {
  CreateProtocolProfileInput,
  ProtocolProfileRecord,
  UpdateProtocolProfileInput
} from '../types/models.js';

const protocolProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  coreType: z.string().trim().min(1).max(50),
  transport: z.string().trim().min(1).max(50),
  security: z.string().trim().min(1).max(50).default('none'),
  listenPort: z.coerce.number().int().min(1).max(65535),
  inboundTag: z.string().trim().min(1).max(100),
  flow: z.string().trim().max(100).optional().default(''),
  supportsGrpcUsers: z.coerce.boolean().optional().default(false),
  xrayConfigTemplate: z.string().trim().min(10),
  installScript: z.string().max(20000).optional().default('')
});

export class ProtocolProfileService {
  constructor(private readonly protocolProfileRepository: ProtocolProfileRepository) {}

  listAll(): Promise<ProtocolProfileRecord[]> {
    return this.protocolProfileRepository.listAll();
  }

  async getExistingById(id: number): Promise<ProtocolProfileRecord> {
    const profile = await this.protocolProfileRepository.findById(id);

    if (!profile) {
      throw new Error('Protocol profile not found');
    }

    return profile;
  }

  async create(input: CreateProtocolProfileInput): Promise<ProtocolProfileRecord[]> {
    const parsed = protocolProfileSchema.parse(input);

    try {
      await this.protocolProfileRepository.create(parsed);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Protocol profile slug already exists');
      }

      throw error;
    }

    return this.protocolProfileRepository.listAll();
  }

  async update(id: number, input: UpdateProtocolProfileInput): Promise<ProtocolProfileRecord[]> {
    const current = await this.getExistingById(id);
    const parsed = protocolProfileSchema.parse({
      ...current,
      ...input,
      flow: input.flow ?? current.flow ?? '',
      installScript: input.installScript ?? current.installScript ?? ''
    });

    try {
      await this.protocolProfileRepository.update(id, parsed);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Protocol profile slug already exists');
      }

      throw error;
    }

    return this.protocolProfileRepository.listAll();
  }

  async remove(id: number): Promise<ProtocolProfileRecord[]> {
    await this.getExistingById(id);

    const linkedNodeCount = await this.protocolProfileRepository.countLinkedNodes(id);

    if (linkedNodeCount > 0) {
      throw new Error('Protocol profile is linked to nodes and cannot be deleted');
    }

    await this.protocolProfileRepository.remove(id);
    return this.protocolProfileRepository.listAll();
  }
}
