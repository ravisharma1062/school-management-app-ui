import { api } from './client';
import type { EventCreateRequest, EventDto, EventRsvpDto, RsvpStatus } from '@/types';

export const eventsApi = {
  async list(range: number): Promise<EventDto[]> {
    const { data } = await api.get<EventDto[]>('/events', { params: { range } });
    return data;
  },

  async create(payload: EventCreateRequest): Promise<EventDto> {
    const { data } = await api.post<EventDto>('/events', payload);
    return data;
  },

  async rsvp(eventId: string, status: RsvpStatus): Promise<EventRsvpDto> {
    const { data } = await api.post<EventRsvpDto>(`/events/${eventId}/rsvp`, { status });
    return data;
  },

  async rsvps(eventId: string): Promise<EventRsvpDto[]> {
    const { data } = await api.get<EventRsvpDto[]>(`/events/${eventId}/rsvps`);
    return data;
  },
};
