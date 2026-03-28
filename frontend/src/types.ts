export type NodeAuthType = 'password' | 'privateKey';
export type NodeDeploymentStatus = 'draft' | 'imported' | 'provisioning' | 'online' | 'error';

export interface ProtocolProfileItem {
  id: number;
  name: string;
  slug: string;
  coreType: string;
  transport: string;
  security: string;
  listenPort: number;
  inboundTag: string;
  flow: string | null;
  supportsGrpcUsers: boolean;
  xrayConfigTemplate: string;
  installScript: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProtocolProfilePayload {
  name: string;
  slug: string;
  coreType: string;
  transport: string;
  security: string;
  listenPort: number;
  inboundTag: string;
  flow?: string;
  supportsGrpcUsers?: boolean;
  xrayConfigTemplate: string;
  installScript?: string;
}

export interface NodeItem {
  id: number;
  name: string;
  host: string;
  sshPort: number;
  sshUser: string;
  authType: NodeAuthType;
  hasPassword: boolean;
  hasPrivateKey: boolean;
  protocolProfileId: number | null;
  protocolProfileName: string | null;
  protocolProfileSlug: string | null;
  grpcHost: string;
  grpcPort: number;
  inboundTag: string;
  protocol: string;
  tlsEnabled: boolean;
  enabled: boolean;
  deploymentStatus: NodeDeploymentStatus;
  statusMessage: string | null;
  lastDeployedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NodePayload {
  name: string;
  host: string;
  sshPort?: number;
  sshUser?: string;
  authType?: NodeAuthType;
  password?: string;
  privateKey?: string;
  protocolProfileId?: number;
  grpcPort?: number;
  inboundTag?: string;
  tlsEnabled?: boolean;
  enabled?: boolean;
}

export interface NodeProbeResult {
  nodeId: number;
  ok: true;
  checkedAt: string;
  output: string;
}

export interface NodeDeployResult {
  nodeId: number;
  checkedAt: string;
  grpcEndpoint: string;
  statusMessage: string;
}

export interface UserItem {
  id: number;
  email: string;
  uuid: string;
  nodeId: number;
  protocol: string;
  level: number;
  flow: string | null;
  remark: string | null;
  createdAt: string;
  nodeName: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface UserPayload {
  email: string;
  nodeId: number;
  uuid?: string;
  flow?: string;
  level?: number;
  remark?: string;
}
