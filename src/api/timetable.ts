import { api } from './client';
import type { TimetableCreateRequest, TimetableDto } from '@/types';

export const timetableApi = {
  async byClass(studentClass: string, section: string): Promise<TimetableDto[]> {
    const { data } = await api.get<TimetableDto[]>(
      `/timetable/${encodeURIComponent(studentClass)}/${encodeURIComponent(section)}`,
    );
    return data;
  },

  async create(payload: TimetableCreateRequest): Promise<TimetableDto> {
    const { data } = await api.post<TimetableDto>('/timetable', payload);
    return data;
  },
};
