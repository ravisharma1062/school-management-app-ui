import { api } from './client';
import type { HomeworkSubmissionDto, HomeworkSubmissionGradeRequest } from '@/types';

export const homeworkSubmissionsApi = {
  async submit(homeworkId: string, studentId: string, file: File): Promise<HomeworkSubmissionDto> {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('file', file);
    const { data } = await api.post<HomeworkSubmissionDto>(
      `/homework/${homeworkId}/submissions`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  async grade(id: string, payload: HomeworkSubmissionGradeRequest): Promise<HomeworkSubmissionDto> {
    const { data } = await api.patch<HomeworkSubmissionDto>(`/homework/submissions/${id}`, payload);
    return data;
  },

  async byHomework(homeworkId: string): Promise<HomeworkSubmissionDto[]> {
    const { data } = await api.get<HomeworkSubmissionDto[]>(`/homework/${homeworkId}/submissions`);
    return data;
  },

  async byStudent(studentId: string): Promise<HomeworkSubmissionDto[]> {
    const { data } = await api.get<HomeworkSubmissionDto[]>(`/homework/submissions/student/${studentId}`);
    return data;
  },

  async downloadFile(id: string): Promise<Blob> {
    const { data } = await api.get(`/homework/submissions/${id}/file`, { responseType: 'blob' });
    return data;
  },
};
