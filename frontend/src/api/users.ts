import { apiRequest } from './client';
import type { ApiResponse, UserItem, UserPayload } from '../types';

export const fetchUsers = async (): Promise<UserItem[]> => {
  const response = await apiRequest<ApiResponse<UserItem[]>>('/users');
  return response.data;
};

export const createUser = async (payload: UserPayload): Promise<UserItem[]> => {
  const response = await apiRequest<ApiResponse<UserItem[]>>('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.data;
};

export const deleteUser = async (id: number): Promise<UserItem[]> => {
  const response = await apiRequest<ApiResponse<UserItem[]>>(`/users/${id}`, {
    method: 'DELETE'
  });

  return response.data;
};

