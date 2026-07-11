import { api } from './client';
import type { NoticeCreateRequest, NoticeDto, Page, PageParams, TargetRole } from '@/types';

export const noticesApi = {
  async list(
    params: PageParams & { role?: TargetRole; includeArchived?: boolean } = {},
  ): Promise<Page<NoticeDto>> {
    const { data } = await api.get<Page<NoticeDto>>('/notices', { params });
    return data;
  },

  async create(payload: NoticeCreateRequest): Promise<NoticeDto> {
    const { data } = await api.post<NoticeDto>('/notices', payload);
    return data;
  },

  async archive(id: string): Promise<NoticeDto> {
    const { data } = await api.patch<NoticeDto>(`/notices/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<NoticeDto> {
    const { data } = await api.patch<NoticeDto>(`/notices/${id}/restore`);
    return data;
  },
};
