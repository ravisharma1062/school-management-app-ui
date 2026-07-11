import { api } from './client';
import type { LanguageCode, Page, PageParams, Role, UserCreateRequest, UserDto } from '@/types';

export const usersApi = {
  async list(params: PageParams & { role?: Role } = {}): Promise<Page<UserDto>> {
    const { data } = await api.get<Page<UserDto>>('/users', { params });
    return data;
  },

  async create(payload: UserCreateRequest): Promise<UserDto> {
    const { data } = await api.post<UserDto>('/users', payload);
    return data;
  },

  async updateMyLanguage(preferredLanguage: LanguageCode): Promise<UserDto> {
    const { data } = await api.patch<UserDto>('/users/me/language', { preferredLanguage });
    return data;
  },
};
