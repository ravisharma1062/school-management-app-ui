import { api } from './client';
import type { SubscriptionDto } from '@/types';

export const subscriptionApi = {
  async getCurrent(): Promise<SubscriptionDto> {
    const { data } = await api.get<SubscriptionDto>('/subscription');
    return data;
  },
};
