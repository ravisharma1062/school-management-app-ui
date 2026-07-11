import { api } from './client';
import type {
  LeaveRequestCreateRequest,
  LeaveRequestDto,
  LeaveRequestReviewRequest,
  LeaveStatus,
  Page,
  PageParams,
} from '@/types';

export const leaveRequestsApi = {
  async list(params: PageParams & { status?: LeaveStatus } = {}): Promise<Page<LeaveRequestDto>> {
    const { data } = await api.get<Page<LeaveRequestDto>>('/leave-requests', { params });
    return data;
  },

  async create(payload: LeaveRequestCreateRequest): Promise<LeaveRequestDto> {
    const { data } = await api.post<LeaveRequestDto>('/leave-requests', payload);
    return data;
  },

  async review(id: string, payload: LeaveRequestReviewRequest): Promise<LeaveRequestDto> {
    const { data } = await api.patch<LeaveRequestDto>(`/leave-requests/${id}`, payload);
    return data;
  },
};
