import { api } from './client';
import type {
  BusLocationDto,
  BusRouteAdminDto,
  BusRouteCreateRequest,
  BusRouteSummaryDto,
  StudentTransportAssignRequest,
  StudentTransportDto,
} from '@/types';

export const transportApi = {
  async listRoutes(): Promise<BusRouteSummaryDto[]> {
    const { data } = await api.get<BusRouteSummaryDto[]>('/transport/routes');
    return data;
  },

  async getRoute(id: string): Promise<BusRouteAdminDto> {
    const { data } = await api.get<BusRouteAdminDto>(`/transport/routes/${id}`);
    return data;
  },

  async createRoute(payload: BusRouteCreateRequest): Promise<BusRouteAdminDto> {
    const { data } = await api.post<BusRouteAdminDto>('/transport/routes', payload);
    return data;
  },

  async getLatestLocation(routeId: string): Promise<BusLocationDto> {
    const { data } = await api.get<BusLocationDto>(`/transport/routes/${routeId}/location/latest`);
    return data;
  },

  async getStudentAssignment(studentId: string): Promise<StudentTransportDto> {
    const { data } = await api.get<StudentTransportDto>(`/transport/students/${studentId}`);
    return data;
  },

  async assignStudent(studentId: string, payload: StudentTransportAssignRequest): Promise<StudentTransportDto> {
    const { data } = await api.put<StudentTransportDto>(`/transport/students/${studentId}`, payload);
    return data;
  },
};
