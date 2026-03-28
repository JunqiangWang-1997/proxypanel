import { defaultNodeSeed } from '../constants/defaults.js';
import { getDatabase } from './database.js';

export const initializeDatabase = async (): Promise<void> => {
  const db = await getDatabase();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grpc_host TEXT NOT NULL,
      grpc_port INTEGER NOT NULL,
      inbound_tag TEXT NOT NULL,
      protocol TEXT NOT NULL DEFAULT 'vless',
      tls_enabled INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      uuid TEXT NOT NULL,
      node_id INTEGER NOT NULL,
      protocol TEXT NOT NULL DEFAULT 'vless',
      level INTEGER NOT NULL DEFAULT 0,
      flow TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
      UNIQUE (email, node_id)
    );
  `);

  const existingNode = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM nodes');

  if (!existingNode || existingNode.count === 0) {
    await db.run(
      `
        INSERT INTO nodes (
          name,
          grpc_host,
          grpc_port,
          inbound_tag,
          protocol,
          tls_enabled,
          enabled
        ) VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      defaultNodeSeed.name,
      defaultNodeSeed.grpcHost,
      defaultNodeSeed.grpcPort,
      defaultNodeSeed.inboundTag,
      defaultNodeSeed.protocol,
      defaultNodeSeed.tlsEnabled ? 1 : 0
    );
  }
};

