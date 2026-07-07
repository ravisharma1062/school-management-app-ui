import { api } from './client';
import type { FeeDto, FeeUpdateRequest } from '@/types';

export const feesApi = {
  async byStudent(studentId: string): Promise<FeeDto[]> {
    const { data } = await api.get<FeeDto[]>(`/fees/student/${studentId}`);
    return data;
  },

  async update(id: string, payload: FeeUpdateRequest): Promise<FeeDto> {
    const { data } = await api.patch<FeeDto>(`/fees/${id}`, payload);
    return data;
  },
};
