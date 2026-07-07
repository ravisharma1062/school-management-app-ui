import { api } from './client';
import type { HomeworkCreateRequest, HomeworkDto, Page, PageParams } from '@/types';

export const homeworkApi = {
  async byClass(
    studentClass: string,
    section: string,
    params: PageParams = {},
  ): Promise<Page<HomeworkDto>> {
    const { data } = await api.get<Page<HomeworkDto>>(
      `/homework/${encodeURIComponent(studentClass)}/${encodeURIComponent(section)}`,
      { params },
    );
    return data;
  },

  async create(payload: HomeworkCreateRequest): Promise<HomeworkDto> {
    const { data } = await api.post<HomeworkDto>('/homework', payload);
    return data;
  },
};
