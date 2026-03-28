import { getDatabase } from '../db/database.js';
import type { CreateNodeInput, NodeRecord, UpdateNodeInput } from '../types/models.js';

const mapNode = (row: Record<string, unknown>): NodeRecord => ({
  id: Number(row.id),
  name: String(row.name),
  grpcHost: String(row.grpc_host),
  grpcPort: Number(row.grpc_port),
  inboundTag: String(row.inbound_tag),
  protocol: String(row.protocol),
  tlsEnabled: Boolean(row.tls_enabled),
  enabled: Boolean(row.enabled),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at)
});

export class NodeRepository {
  async listAll(): Promise<NodeRecord[]> {
    const db = await getDatabase();
    const rows = await db.all<Record<string, unknown>[]>(
      `
        SELECT *
        FROM nodes
        ORDER BY id ASC
      `
    );

    return rows.map(mapNode);
  }

  async listEnabled(): Promise<NodeRecord[]> {
    const db = await getDatabase();
    const rows = await db.all<Record<string, unknown>[]>(
      `
        SELECT *
        FROM nodes
        WHERE enabled = 1
        ORDER BY id ASC
      `
    );

    return rows.map(mapNode);
  }

  async findById(id: number): Promise<NodeRecord | null> {
    const db = await getDatabase();
    const row = await db.get<Record<string, unknown>>(
      `
        SELECT *
        FROM nodes
        WHERE id = ?
        LIMIT 1
      `,
      id
    );

    return row ? mapNode(row) : null;
  }

  async create(input: Required<CreateNodeInput>): Promise<NodeRecord> {
    const db = await getDatabase();
    const result = await db.run(
      `
        INSERT INTO nodes (
          name,
          grpc_host,
          grpc_port,
          inbound_tag,
          protocol,
          tls_enabled,
          enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      input.name,
      input.grpcHost,
      input.grpcPort,
      input.inboundTag,
      input.protocol,
      input.tlsEnabled ? 1 : 0,
      input.enabled ? 1 : 0
    );

    const created = await this.findById(Number(result.lastID));

    if (!created) {
      throw new Error('Failed to load created node');
    }

    return created;
  }

  async update(id: number, input: Required<UpdateNodeInput>): Promise<NodeRecord> {
    const db = await getDatabase();

    await db.run(
      `
        UPDATE nodes
        SET
          name = ?,
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
      input.grpcHost,
      input.grpcPort,
      input.inboundTag,
      input.protocol,
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
