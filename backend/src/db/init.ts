import { defaultProtocolProfiles } from '../constants/defaults.js';
import { getDatabase } from './database.js';

const ensureNodeColumns = async (): Promise<void> => {
  const db = await getDatabase();
  const columns = await db.all<Array<{ name: string }>>(`PRAGMA table_info(nodes)`);
  const existing = new Set(columns.map((column) => column.name));

  const statements = [
    ['host', `ALTER TABLE nodes ADD COLUMN host TEXT`],
    ['ssh_port', `ALTER TABLE nodes ADD COLUMN ssh_port INTEGER NOT NULL DEFAULT 22`],
    ['ssh_user', `ALTER TABLE nodes ADD COLUMN ssh_user TEXT NOT NULL DEFAULT 'root'`],
    ['auth_type', `ALTER TABLE nodes ADD COLUMN auth_type TEXT NOT NULL DEFAULT 'privateKey'`],
    ['ssh_password', `ALTER TABLE nodes ADD COLUMN ssh_password TEXT`],
    ['ssh_private_key', `ALTER TABLE nodes ADD COLUMN ssh_private_key TEXT`],
    ['protocol_profile_id', `ALTER TABLE nodes ADD COLUMN protocol_profile_id INTEGER`],
    ['control_host', `ALTER TABLE nodes ADD COLUMN control_host TEXT`],
    ['deployment_status', `ALTER TABLE nodes ADD COLUMN deployment_status TEXT NOT NULL DEFAULT 'draft'`],
    ['status_message', `ALTER TABLE nodes ADD COLUMN status_message TEXT`],
    ['last_deployed_at', `ALTER TABLE nodes ADD COLUMN last_deployed_at TEXT`]
  ] as const;

  for (const [name, statement] of statements) {
    if (!existing.has(name)) {
      await db.exec(statement);
    }
  }

  await db.exec(`
    UPDATE nodes
    SET
      host = COALESCE(NULLIF(host, ''), grpc_host, '127.0.0.1'),
      control_host = COALESCE(NULLIF(control_host, ''), grpc_host, host, '127.0.0.1'),
      ssh_port = COALESCE(ssh_port, 22),
      ssh_user = COALESCE(NULLIF(ssh_user, ''), 'root'),
      auth_type = COALESCE(NULLIF(auth_type, ''), 'privateKey'),
      deployment_status = CASE
        WHEN COALESCE(NULLIF(deployment_status, ''), '') != '' THEN deployment_status
        WHEN COALESCE(NULLIF(grpc_host, ''), '') != '' THEN 'imported'
        ELSE 'draft'
      END,
      status_message = CASE
        WHEN COALESCE(NULLIF(status_message, ''), '') != '' THEN status_message
        WHEN COALESCE(NULLIF(grpc_host, ''), '') != '' THEN 'Imported from legacy gRPC node'
        ELSE 'Waiting for first deployment'
      END
  `);
};

const seedProtocolProfiles = async (): Promise<void> => {
  const db = await getDatabase();
  const existing = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM protocol_profiles');

  if ((existing?.count ?? 0) > 0) {
    return;
  }

  for (const profile of defaultProtocolProfiles) {
    await db.run(
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
      profile.name,
      profile.slug,
      profile.coreType,
      profile.transport,
      profile.security,
      profile.listenPort,
      profile.inboundTag,
      profile.flow ?? '',
      profile.supportsGrpcUsers ? 1 : 0,
      profile.xrayConfigTemplate,
      profile.installScript ?? ''
    );
  }
};

const backfillNodeProfiles = async (): Promise<void> => {
  const db = await getDatabase();
  const defaultProfile = await db.get<{ id: number; core_type: string; inbound_tag: string }>(
    `
      SELECT id, core_type, inbound_tag
      FROM protocol_profiles
      ORDER BY id ASC
      LIMIT 1
    `
  );

  if (!defaultProfile) {
    return;
  }

  await db.run(
    `
      UPDATE nodes
      SET
        protocol_profile_id = COALESCE(protocol_profile_id, ?),
        inbound_tag = COALESCE(NULLIF(inbound_tag, ''), ?),
        protocol = COALESCE(NULLIF(protocol, ''), ?)
      WHERE protocol_profile_id IS NULL
    `,
    defaultProfile.id,
    defaultProfile.inbound_tag,
    defaultProfile.core_type
  );
};

export const initializeDatabase = async (): Promise<void> => {
  const db = await getDatabase();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS protocol_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      core_type TEXT NOT NULL,
      transport TEXT NOT NULL,
      security TEXT NOT NULL DEFAULT 'none',
      listen_port INTEGER NOT NULL DEFAULT 443,
      inbound_tag TEXT NOT NULL DEFAULT 'main-inbound',
      flow TEXT,
      supports_grpc_users INTEGER NOT NULL DEFAULT 0,
      xray_config_template TEXT NOT NULL,
      install_script TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

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

  await ensureNodeColumns();
  await seedProtocolProfiles();
  await backfillNodeProfiles();
};
