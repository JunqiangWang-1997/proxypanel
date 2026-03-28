import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../..');

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databasePath: path.resolve(backendRoot, process.env.DATABASE_PATH ?? './data/proxypanel.sqlite'),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  xray: {
    host: process.env.XRAY_GRPC_HOST ?? '127.0.0.1',
    port: Number(process.env.XRAY_GRPC_PORT ?? 10085),
    inboundTag: process.env.XRAY_INBOUND_TAG ?? 'main-inbound',
    nodeName: process.env.XRAY_NODE_NAME ?? 'Local Xray',
    protocol: process.env.XRAY_NODE_PROTOCOL ?? 'vless',
    tlsEnabled: parseBoolean(process.env.XRAY_GRPC_TLS, false)
  }
};
