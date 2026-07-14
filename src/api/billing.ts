import { api } from './client';
import type { Page, PageParams, PaymentClaimCreateRequest, PaymentClaimDto } from '@/types';

export const billingApi = {
  async getPaymentInstructions(): Promise<string> {
    const { data } = await api.get<string>('/billing/payment-instructions');
    return data;
  },

  async submitPayment(payload: PaymentClaimCreateRequest): Promise<PaymentClaimDto> {
    const { data } = await api.post<PaymentClaimDto>('/billing/payments', payload);
    return data;
  },

  async getMyHistory(params: PageParams = {}): Promise<Page<PaymentClaimDto>> {
    const { data } = await api.get<Page<PaymentClaimDto>>('/billing/payments', { params });
    return data;
  },
};
