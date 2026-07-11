import { api } from './client';
import type { TimetableCreateRequest, TimetableDto } from '@/types';

export const timetableApi = {
  async byClass(studentClass: string, section: string, includeArchived = false): Promise<TimetableDto[]> {
    const { data } = await api.get<TimetableDto[]>(
      `/timetable/${encodeURIComponent(studentClass)}/${encodeURIComponent(section)}`,
      { params: { includeArchived } },
    );
    return data;
  },

  async create(payload: TimetableCreateRequest): Promise<TimetableDto> {
    const { data } = await api.post<TimetableDto>('/timetable', payload);
    return data;
  },

  async archive(id: string): Promise<TimetableDto> {
    const { data } = await api.patch<TimetableDto>(`/timetable/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<TimetableDto> {
    const { data } = await api.patch<TimetableDto>(`/timetable/${id}/restore`);
    return data;
  },
};
