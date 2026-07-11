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

  async downloadReportCard(studentId: string, term?: string): Promise<Blob> {
    const { data } = await api.get(`/exam-results/student/${studentId}/report-card`, {
      params: term ? { term } : undefined,
      responseType: 'blob',
    });
    return data;
  },
};
