import { api } from './client';
import type { AtRiskStudentDto, AttendanceTrendPointDto, FeeSummaryDto } from '@/types';

export const analyticsApi = {
  async attendanceTrend(studentClass: string, range: number): Promise<AttendanceTrendPointDto[]> {
    const { data } = await api.get<AttendanceTrendPointDto[]>('/analytics/attendance', {
      params: { class: studentClass || undefined, range },
    });
    return data;
  },

  async feeSummary(studentClass: string): Promise<FeeSummaryDto> {
    const { data } = await api.get<FeeSummaryDto>('/analytics/fees/summary', {
      params: { class: studentClass || undefined },
    });
    return data;
  },

  async atRiskStudents(): Promise<AtRiskStudentDto[]> {
    const { data } = await api.get<AtRiskStudentDto[]>('/analytics/at-risk-students');
    return data;
  },
};
