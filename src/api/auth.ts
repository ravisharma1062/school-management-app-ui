import { api } from './client';
import type { AuthResponse, LoginRequest, UserDto } from '@/types';

export const authApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async me(): Promise<UserDto> {
    const { data } = await api.get<UserDto>('/auth/me');
    return data;
  },
};
