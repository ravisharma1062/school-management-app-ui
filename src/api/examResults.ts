import { api } from './client';
import type { ExamResultCreateRequest, ExamResultDto } from '@/types';

export const examResultsApi = {
  async byStudent(studentId: string): Promise<ExamResultDto[]> {
    const { data } = await api.get<ExamResultDto[]>(`/exam-results/student/${studentId}`);
    return data;
  },

  async create(payload: ExamResultCreateRequest): Promise<ExamResultDto> {
    const { data } = await api.post<ExamResultDto>('/exam-results', payload);
    return data;
  },
};
