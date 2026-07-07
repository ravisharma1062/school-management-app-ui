import { api } from './client';
import type { NoticeCreateRequest, NoticeDto, Page, PageParams, TargetRole } from '@/types';

export const noticesApi = {
  async list(params: PageParams & { role?: TargetRole } = {}): Promise<Page<NoticeDto>> {
    const { data } = await api.get<Page<NoticeDto>>('/notices', { params });
    return data;
  },

  async create(payload: NoticeCreateRequest): Promise<NoticeDto> {
    const { data } = await api.post<NoticeDto>('/notices', payload);
    return data;
  },
};
