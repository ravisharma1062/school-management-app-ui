import { api } from './client';
import type {
  Page,
  PageParams,
  StudentCreateRequest,
  StudentDto,
  StudentUpdateRequest,
} from '@/types';

export const studentsApi = {
  async list(params: PageParams = {}): Promise<Page<StudentDto>> {
    const { data } = await api.get<Page<StudentDto>>('/students', { params });
    return data;
  },

  async getById(id: string): Promise<StudentDto> {
    const { data } = await api.get<StudentDto>(`/students/${id}`);
    return data;
  },

  async myChildren(): Promise<StudentDto[]> {
    const { data } = await api.get<StudentDto[]>('/students/my-children');
    return data;
  },

  async create(payload: StudentCreateRequest): Promise<StudentDto> {
    const { data } = await api.post<StudentDto>('/students', payload);
    return data;
  },

  async update(id: string, payload: StudentUpdateRequest): Promise<StudentDto> {
    const { data } = await api.patch<StudentDto>(`/students/${id}`, payload);
    return data;
  },
};
