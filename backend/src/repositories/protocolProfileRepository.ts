import { getDatabase } from '../db/database.js';
import type {
  CreateProtocolProfileInput,
  ProtocolProfileRecord,
  UpdateProtocolProfileInput
} from '../types/models.js';

const mapProtocolProfile = (row: Record<string, unknown>): ProtocolProfileRecord => ({
  id: Number(row.id),
  name: String(row.name),
  slug: String(row.slug),
  coreType: String(row.core_type),
  transport: String(row.transport),
  security: String(row.security),
  listenPort: Number(row.listen_port),
  inboundTag: String(row.inbound_tag),
  flow: row.flow ? String(row.flow) : null,
  supportsGrpcUsers: Boolean(row.supports_grpc_users),
  xrayConfigTemplate: String(row.xray_config_template),
  installScript: row.install_script ? String(row.install_script) : null,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at)
});

export class ProtocolProfileRepository {
  async listAll(): Promise<ProtocolProfileRecord[]> {
    const db = await getDatabase();
    const rows = await db.all<Record<string, unknown>[]>(
      `
        SELECT *
        FROM protocol_profiles
        ORDER BY id ASC
      `
    );

    return rows.map(mapProtocolProfile);
  }

  async findById(id: number): Promise<ProtocolProfileRecord | null> {
    const db = await getDatabase();
    const row = await db.get<Record<string, unknown>>(
      `
        SELECT *
        FROM protocol_profiles
        WHERE id = ?
        LIMIT 1
      `,
      id
    );

    return row ? mapProtocolProfile(row) : null;
  }

  async create(input: Required<CreateProtocolProfileInput>): Promise<ProtocolProfileRecord> {
    const db = await getDatabase();
    const result = await db.run(
      `
        INSERT INTO protocol_profiles (
          name,
          slug,
          core_type,
          transport,
          security,
          listen_port,
          inbound_tag,
          flow,
          supports_grpc_users,
          xray_config_template,
          install_script
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      input.name,
      input.slug,
      input.coreType,
      input.transport,
      input.security,
      input.listenPort,
      input.inboundTag,
      input.flow,
      input.supportsGrpcUsers ? 1 : 0,
      input.xrayConfigTemplate,
      input.installScript
    );

    const created = await this.findById(Number(result.lastID));

    if (!created) {
      throw new Error('Failed to load created protocol profile');
    }

    return created;
  }

  async update(id: number, input: Required<UpdateProtocolProfileInput>): Promise<ProtocolProfileRecord> {
    const db = await getDatabase();

    await db.run(
      `
        UPDATE protocol_profiles
        SET
          name = ?,
          slug = ?,
          core_type = ?,
          transport = ?,
          security = ?,
          listen_port = ?,
          inbound_tag = ?,
          flow = ?,
          supports_grpc_users = ?,
          xray_config_template = ?,
          install_script = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      input.name,
      input.slug,
      input.coreType,
      input.transport,
      input.security,
      input.listenPort,
      input.inboundTag,
      input.flow,
      input.supportsGrpcUsers ? 1 : 0,
      input.xrayConfigTemplate,
      input.installScript,
      id
    );

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error('Protocol profile not found');
    }

    return updated;
  }

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.run(
      `
        DELETE FROM protocol_profiles
        WHERE id = ?
      `,
      id
    );
  }

  async countLinkedNodes(id: number): Promise<number> {
    const db = await getDatabase();
    const row = await db.get<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM nodes
        WHERE protocol_profile_id = ?
      `,
      id
    );

    return row?.count ?? 0;
  }
}
