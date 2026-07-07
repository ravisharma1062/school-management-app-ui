import { api } from './client';
import type { AttendanceDto, AttendanceMarkRequest } from '@/types';

export const attendanceApi = {
  async mark(payload: AttendanceMarkRequest): Promise<AttendanceDto> {
    const { data } = await api.post<AttendanceDto>('/attendance', payload);
    return data;
  },

  async byStudent(studentId: string): Promise<AttendanceDto[]> {
    const { data } = await api.get<AttendanceDto[]>(`/attendance/student/${studentId}`);
    return data;
  },

  async byClass(
    studentClass: string,
    section: string,
    date: string,
  ): Promise<AttendanceDto[]> {
    const { data } = await api.get<AttendanceDto[]>(
      `/attendance/class/${encodeURIComponent(studentClass)}/${encodeURIComponent(section)}/${date}`,
    );
    return data;
  },
};
