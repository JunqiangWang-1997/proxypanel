import { getDatabase } from '../db/database.js';
import type { CreateUserInput, UserRecord, UserWithNodeRecord } from '../types/models.js';

const mapUser = (row: Record<string, unknown>): UserRecord => ({
  id: Number(row.id),
  email: String(row.email),
  uuid: String(row.uuid),
  nodeId: Number(row.node_id),
  protocol: String(row.protocol),
  level: Number(row.level),
  flow: row.flow ? String(row.flow) : null,
  remark: row.remark ? String(row.remark) : null,
  createdAt: String(row.created_at)
});

const mapUserWithNode = (row: Record<string, unknown>): UserWithNodeRecord => ({
  ...mapUser(row),
  nodeName: String(row.node_name)
});

export class UserRepository {
  async list(): Promise<UserWithNodeRecord[]> {
    const db = await getDatabase();
    const rows = await db.all<Record<string, unknown>[]>(
      `
        SELECT
          users.*,
          nodes.name AS node_name
        FROM users
        INNER JOIN nodes ON nodes.id = users.node_id
        ORDER BY users.id DESC
      `
    );

    return rows.map(mapUserWithNode);
  }

  async findById(id: number): Promise<UserRecord | null> {
    const db = await getDatabase();
    const row = await db.get<Record<string, unknown>>(
      `
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      id
    );

    return row ? mapUser(row) : null;
  }

  async create(input: Required<CreateUserInput>): Promise<UserRecord> {
    const db = await getDatabase();
    const result = await db.run(
      `
        INSERT INTO users (
          email,
          uuid,
          node_id,
          protocol,
          level,
          flow,
          remark
        ) VALUES (?, ?, ?, 'vless', ?, ?, ?)
      `,
      input.email,
      input.uuid,
      input.nodeId,
      input.level,
      input.flow,
      input.remark
    );

    const created = await this.findById(Number(result.lastID));

    if (!created) {
      throw new Error('Failed to load created user');
    }

    return created;
  }

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.run(
      `
        DELETE FROM users
        WHERE id = ?
      `,
      id
    );
  }

  async countByNodeId(nodeId: number): Promise<number> {
    const db = await getDatabase();
    const row = await db.get<{ count: number }>(
      `
        SELECT COUNT(*) as count
        FROM users
        WHERE node_id = ?
      `,
      nodeId
    );

    return row?.count ?? 0;
  }
}
