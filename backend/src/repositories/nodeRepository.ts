import { getDatabase } from '../db/database.js';
import type { NodeDeploymentStatus, NodeRecord } from '../types/models.js';

interface PersistedNodeInput {
  name: string;
  host: string;
  sshPort: number;
  sshUser: string;
  authType: NodeRecord['authType'];
  password?: string;
  privateKey?: string;
  protocolProfileId?: number;
  grpcPort: number;
  inboundTag: string;
  protocol: string;
  tlsEnabled: boolean;
  enabled: boolean;
}

const baseSelect = `
  SELECT
    nodes.*,
    protocol_profiles.name AS protocol_profile_name,
    protocol_profiles.slug AS protocol_profile_slug
  FROM nodes
  LEFT JOIN protocol_profiles ON protocol_profiles.id = nodes.protocol_profile_id
`;

const mapNode = (row: Record<string, unknown>): NodeRecord => ({
  id: Number(row.id),
  name: String(row.name),
  host: String(row.host),
  sshPort: Number(row.ssh_port),
  sshUser: String(row.ssh_user),
  authType: String(row.auth_type) as NodeRecord['authType'],
  password: row.ssh_password ? String(row.ssh_password) : null,
  privateKey: row.ssh_private_key ? String(row.ssh_private_key) : null,
  protocolProfileId: row.protocol_profile_id === null ? null : Number(row.protocol_profile_id),
  protocolProfileName: row.protocol_profile_name ? String(row.protocol_profile_name) : null,
  protocolProfileSlug: row.protocol_profile_slug ? String(row.protocol_profile_slug) : null,
  controlHost: String(row.control_host ?? row.grpc_host ?? row.host),
  grpcHost: String(row.grpc_host ?? row.control_host ?? row.host),
  grpcPort: Number(row.grpc_port),
  inboundTag: String(row.inbound_tag),
  protocol: String(row.protocol),
  tlsEnabled: Boolean(row.tls_enabled),
  enabled: Boolean(row.enabled),
  deploymentStatus: String(row.deployment_status) as NodeDeploymentStatus,
  statusMessage: row.status_message ? String(row.status_message) : null,
  lastDeployedAt: row.last_deployed_at ? String(row.last_deployed_at) : null,
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at)
});

export class NodeRepository {
  async listAll(): Promise<NodeRecord[]> {
    const db = await getDatabase();
    const rows = await db.all<Record<string, unknown>[]>(
      `
        ${baseSelect}
        ORDER BY nodes.id ASC
      `
    );

    return rows.map(mapNode);
  }

  async listEnabled(): Promise<NodeRecord[]> {
    const db = await getDatabase();
    const rows = await db.all<Record<string, unknown>[]>(
      `
        ${baseSelect}
        WHERE nodes.enabled = 1
        ORDER BY nodes.id ASC
      `
    );

    return rows.map(mapNode);
  }

  async findById(id: number): Promise<NodeRecord | null> {
    const db = await getDatabase();
    const row = await db.get<Record<string, unknown>>(
      `
        ${baseSelect}
        WHERE nodes.id = ?
        LIMIT 1
      `,
      id
    );

    return row ? mapNode(row) : null;
  }

  async create(input: PersistedNodeInput): Promise<NodeRecord> {
    const db = await getDatabase();
    const result = await db.run(
      `
        INSERT INTO nodes (
          name,
          host,
          ssh_port,
          ssh_user,
          auth_type,
          ssh_password,
          ssh_private_key,
          protocol_profile_id,
          control_host,
          grpc_host,
          grpc_port,
          inbound_tag,
          protocol,
          tls_enabled,
          enabled,
          deployment_status,
          status_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      input.name,
      input.host,
      input.sshPort,
      input.sshUser,
      input.authType,
      input.password,
      input.privateKey,
      input.protocolProfileId ?? null,
      input.host,
      input.host,
      input.grpcPort,
      input.inboundTag,
      input.protocol ?? 'vless',
      input.tlsEnabled ? 1 : 0,
      input.enabled ? 1 : 0,
      'draft',
      'Waiting for first deployment'
    );

    const created = await this.findById(Number(result.lastID));

    if (!created) {
      throw new Error('Failed to load created node');
    }

    return created;
  }

  async update(id: number, input: PersistedNodeInput): Promise<NodeRecord> {
    const db = await getDatabase();

    await db.run(
      `
        UPDATE nodes
        SET
          name = ?,
          host = ?,
          ssh_port = ?,
          ssh_user = ?,
          auth_type = ?,
          ssh_password = ?,
          ssh_private_key = ?,
          protocol_profile_id = ?,
          control_host = ?,
          grpc_host = ?,
          grpc_port = ?,
          inbound_tag = ?,
          protocol = ?,
          tls_enabled = ?,
          enabled = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      input.name,
      input.host,
      input.sshPort,
      input.sshUser,
      input.authType,
      input.password,
      input.privateKey,
      input.protocolProfileId ?? null,
      input.host,
      input.host,
      input.grpcPort,
      input.inboundTag,
      input.protocol ?? 'vless',
      input.tlsEnabled ? 1 : 0,
      input.enabled ? 1 : 0,
      id
    );

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error('Node not found');
    }

    return updated;
  }

  async updateDeploymentState(
    id: number,
    input: {
      grpcHost?: string;
      grpcPort?: number;
      inboundTag?: string;
      protocol?: string;
      deploymentStatus: NodeDeploymentStatus;
      statusMessage: string | null;
      lastDeployedAt?: string | null;
    }
  ): Promise<NodeRecord> {
    const db = await getDatabase();

    await db.run(
      `
        UPDATE nodes
        SET
          control_host = COALESCE(?, control_host),
          grpc_host = COALESCE(?, grpc_host),
          grpc_port = COALESCE(?, grpc_port),
          inbound_tag = COALESCE(?, inbound_tag),
          protocol = COALESCE(?, protocol),
          deployment_status = ?,
          status_message = ?,
          last_deployed_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      input.grpcHost ?? null,
      input.grpcHost ?? null,
      input.grpcPort ?? null,
      input.inboundTag ?? null,
      input.protocol ?? null,
      input.deploymentStatus,
      input.statusMessage,
      input.lastDeployedAt ?? null,
      id
    );

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error('Node not found');
    }

    return updated;
  }

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.run(
      `
        DELETE FROM nodes
        WHERE id = ?
      `,
      id
    );
  }
}
