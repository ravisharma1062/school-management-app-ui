import { api } from './client';
import type { ConversationContactDto, ConversationDto, MessageDto } from '@/types';

export const conversationsApi = {
  async list(): Promise<ConversationDto[]> {
    const { data } = await api.get<ConversationDto[]>('/conversations');
    return data;
  },

  async contacts(): Promise<ConversationContactDto[]> {
    const { data } = await api.get<ConversationContactDto[]>('/conversations/contacts');
    return data;
  },

  async start(otherUserId: string): Promise<ConversationDto> {
    const { data } = await api.post<ConversationDto>('/conversations', { otherUserId });
    return data;
  },

  async messages(conversationId: string): Promise<MessageDto[]> {
    const { data } = await api.get<MessageDto[]>(`/conversations/${conversationId}/messages`);
    return data;
  },

  async sendMessage(conversationId: string, body: string): Promise<MessageDto> {
    const { data } = await api.post<MessageDto>(`/conversations/${conversationId}/messages`, { body });
    return data;
  },
};
