import { api } from './client';
import type {
  BulkImportResult,
  Page,
  StudentCreateRequest,
  StudentDto,
  StudentSearchParams,
  StudentUpdateRequest,
} from '@/types';

export const studentsApi = {
  async list(params: StudentSearchParams = {}): Promise<Page<StudentDto>> {
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

  async archive(id: string): Promise<StudentDto> {
    const { data } = await api.patch<StudentDto>(`/students/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<StudentDto> {
    const { data } = await api.patch<StudentDto>(`/students/${id}/restore`);
    return data;
  },

  async bulkImport(file: File): Promise<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<BulkImportResult>('/students/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
