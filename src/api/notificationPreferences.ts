import { api } from './client';
import type { NotificationEventType, NotificationPreferenceDto, NotificationPreferenceUpdateRequest } from '@/types';

export const notificationPreferencesApi = {
  async list(): Promise<NotificationPreferenceDto[]> {
    const { data } = await api.get<NotificationPreferenceDto[]>('/notification-preferences');
    return data;
  },

  async update(
    eventType: NotificationEventType,
    payload: NotificationPreferenceUpdateRequest,
  ): Promise<NotificationPreferenceDto> {
    const { data } = await api.patch<NotificationPreferenceDto>(
      `/notification-preferences/${eventType}`,
      payload,
    );
    return data;
  },
};
