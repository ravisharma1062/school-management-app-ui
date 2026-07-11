import { api } from './client';
import type { PaymentDto, PaymentInitiateResponse } from '@/types';

export const paymentsApi = {
  async initiate(feeId: string): Promise<PaymentInitiateResponse> {
    const { data } = await api.post<PaymentInitiateResponse>('/payments/initiate', { feeId });
    return data;
  },

  async getById(id: string): Promise<PaymentDto> {
    const { data } = await api.get<PaymentDto>(`/payments/${id}`);
    return data;
  },
};
