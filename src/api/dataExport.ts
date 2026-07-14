import { api } from './client';

export const dataExportApi = {
  async download(): Promise<Blob> {
    const { data } = await api.get('/data-export', { responseType: 'blob' });
    return data;
  },
};
