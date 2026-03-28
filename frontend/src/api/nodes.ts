import { apiRequest } from './client';
import type { ApiResponse, NodeItem, NodePayload, NodePingResult } from '../types';

export const fetchNodes = async (): Promise<NodeItem[]> => {
  const response = await apiRequest<ApiResponse<NodeItem[]>>('/nodes');
  return response.data;
};

export const createNode = async (payload: NodePayload): Promise<NodeItem[]> => {
  const response = await apiRequest<ApiResponse<NodeItem[]>>('/nodes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.data;
};

export const updateNode = async (id: number, payload: NodePayload): Promise<NodeItem[]> => {
  const response = await apiRequest<ApiResponse<NodeItem[]>>(`/nodes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  return response.data;
};

export const deleteNode = async (id: number): Promise<NodeItem[]> => {
  const response = await apiRequest<ApiResponse<NodeItem[]>>(`/nodes/${id}`, {
    method: 'DELETE'
  });

  return response.data;
};

export const pingNode = async (id: number): Promise<NodePingResult> => {
  const response = await apiRequest<ApiResponse<NodePingResult>>(`/nodes/${id}/ping`, {
    method: 'POST'
  });

  return response.data;
};
