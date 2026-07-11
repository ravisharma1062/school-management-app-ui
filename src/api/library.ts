import { api } from './client';
import type { BookCreateRequest, BookDto, BookIssueCreateRequest, BookIssueDto, Page, PageParams } from '@/types';

export const libraryApi = {
  async searchBooks(search: string | undefined, params: PageParams): Promise<Page<BookDto>> {
    const { data } = await api.get<Page<BookDto>>('/library/books', { params: { search, ...params } });
    return data;
  },

  async createBook(payload: BookCreateRequest): Promise<BookDto> {
    const { data } = await api.post<BookDto>('/library/books', payload);
    return data;
  },

  async issueBook(payload: BookIssueCreateRequest): Promise<BookIssueDto> {
    const { data } = await api.post<BookIssueDto>('/library/issues', payload);
    return data;
  },

  async returnBook(issueId: string): Promise<BookIssueDto> {
    const { data } = await api.patch<BookIssueDto>(`/library/issues/${issueId}/return`);
    return data;
  },

  async getIssuesForStudent(studentId: string): Promise<BookIssueDto[]> {
    const { data } = await api.get<BookIssueDto[]>(`/library/students/${studentId}/issues`);
    return data;
  },

  async uploadCover(bookId: string, file: File): Promise<BookDto> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<BookDto>(`/library/books/${bookId}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async downloadCover(bookId: string): Promise<Blob> {
    const { data } = await api.get(`/library/books/${bookId}/cover`, { responseType: 'blob' });
    return data;
  },
};
