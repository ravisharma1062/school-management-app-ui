import { api } from './client';
import type { BrandingDto } from '@/types';

export const brandingApi = {
  async getCurrent(): Promise<BrandingDto> {
    const { data } = await api.get<BrandingDto>('/branding');
    return data;
  },

  /** Returns an object URL the caller must revoke when done — GET /branding/logo needs auth, so a plain <img src> can't reach it directly. */
  async getLogoObjectUrl(): Promise<string> {
    const { data } = await api.get('/branding/logo', { responseType: 'blob' });
    return URL.createObjectURL(data as Blob);
  },

  async uploadLogo(file: File): Promise<BrandingDto> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<BrandingDto>('/branding/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async updateColors(primaryColor: string | null, secondaryColor: string | null): Promise<BrandingDto> {
    const { data } = await api.patch<BrandingDto>('/branding/colors', { primaryColor, secondaryColor });
    return data;
  },
};
