import { env } from '../config/env.js';

export const defaultNodeSeed = {
  name: env.xray.nodeName,
  grpcHost: env.xray.host,
  grpcPort: env.xray.port,
  inboundTag: env.xray.inboundTag,
  protocol: env.xray.protocol,
  tlsEnabled: env.xray.tlsEnabled
};

