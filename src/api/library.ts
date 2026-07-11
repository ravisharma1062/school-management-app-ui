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
    const { data } = await api.post<BookIssueDto>(`/library/issues/${issueId}/return`);
    return data;
  },

  async getIssuesForStudent(studentId: string): Promise<BookIssueDto[]> {
    const { data } = await api.get<BookIssueDto[]>(`/library/students/${studentId}/issues`);
    return data;
  },
};
