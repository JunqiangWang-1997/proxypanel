export interface NodeRecord {
  id: number;
  name: string;
  grpcHost: string;
  grpcPort: number;
  inboundTag: string;
  protocol: string;
  tlsEnabled: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNodeInput {
  name: string;
  grpcHost: string;
  grpcPort: number;
  inboundTag: string;
  protocol?: string;
  tlsEnabled?: boolean;
  enabled?: boolean;
}

export interface UpdateNodeInput {
  name?: string;
  grpcHost?: string;
  grpcPort?: number;
  inboundTag?: string;
  protocol?: string;
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
