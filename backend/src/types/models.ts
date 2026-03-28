export type NodeAuthType = 'password' | 'privateKey';
export type NodeDeploymentStatus = 'draft' | 'imported' | 'provisioning' | 'online' | 'error';

export interface ProtocolProfileRecord {
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

export interface CreateProtocolProfileInput {
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

export interface UpdateProtocolProfileInput {
  name?: string;
  slug?: string;
  coreType?: string;
  transport?: string;
  security?: string;
  listenPort?: number;
  inboundTag?: string;
  flow?: string;
  supportsGrpcUsers?: boolean;
  xrayConfigTemplate?: string;
  installScript?: string;
}

export interface NodeRecord {
  id: number;
  name: string;
  host: string;
  sshPort: number;
  sshUser: string;
  authType: NodeAuthType;
  password: string | null;
  privateKey: string | null;
  protocolProfileId: number | null;
  protocolProfileName: string | null;
  protocolProfileSlug: string | null;
  controlHost: string;
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

export interface NodeSummary {
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

export interface CreateNodeInput {
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

export interface UpdateNodeInput {
  name?: string;
  host?: string;
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

export interface UserRecord {
  id: number;
  email: string;
  uuid: string;
  nodeId: number;
  protocol: string;
  level: number;
  flow: string | null;
  remark: string | null;
  createdAt: string;
}

export interface UserWithNodeRecord extends UserRecord {
  nodeName: string;
}

export interface CreateUserInput {
  email: string;
  nodeId: number;
  uuid?: string;
  flow?: string;
  level?: number;
  remark?: string;
}
