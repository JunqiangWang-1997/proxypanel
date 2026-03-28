export interface NodeItem {
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

export interface NodePayload {
  name: string;
  grpcHost: string;
  grpcPort: number;
  inboundTag: string;
  protocol?: string;
  tlsEnabled?: boolean;
  enabled?: boolean;
}

export interface NodePingResult {
  nodeId: number;
  ok: true;
  checkedAt: string;
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
