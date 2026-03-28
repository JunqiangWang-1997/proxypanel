import { apiRequest } from './client';
import type { ApiResponse, ProtocolProfileItem, ProtocolProfilePayload } from '../types';

export const fetchProtocolProfiles = async (): Promise<ProtocolProfileItem[]> => {
  const response = await apiRequest<ApiResponse<ProtocolProfileItem[]>>('/protocol-profiles');
  return response.data;
};

export const createProtocolProfile = async (
  payload: ProtocolProfilePayload
): Promise<ProtocolProfileItem[]> => {
  const response = await apiRequest<ApiResponse<ProtocolProfileItem[]>>('/protocol-profiles', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.data;
};

export const updateProtocolProfile = async (
  id: number,
  payload: ProtocolProfilePayload
): Promise<ProtocolProfileItem[]> => {
  const response = await apiRequest<ApiResponse<ProtocolProfileItem[]>>(`/protocol-profiles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  return response.data;
};

export const deleteProtocolProfile = async (id: number): Promise<ProtocolProfileItem[]> => {
  const response = await apiRequest<ApiResponse<ProtocolProfileItem[]>>(`/protocol-profiles/${id}`, {
    method: 'DELETE'
  });

  return response.data;
};
