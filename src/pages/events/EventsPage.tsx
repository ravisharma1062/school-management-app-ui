import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { eventsApi } from '@/api/events';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Textarea,
} from '@/components/ui';
import type { EventDto, RsvpStatus } from '@/types';

const RANGE_DAYS = 90;

const RSVP_TONE: Record<RsvpStatus, 'green' | 'yellow' | 'red'> = {
  GOING: 'green',
  MAYBE: 'yellow',
  NOT_GOING: 'red',
};

const RSVP_LABEL: Record<RsvpStatus, string> = {
  GOING: 'Going',
  MAYBE: 'Maybe',
  NOT_GOING: "Can't go",
};

export function EventsPage() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [view, setView] = useState<'list' | 'month'>('list');
  const [monthOffset, setMonthOffset] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['events', RANGE_DAYS],
    queryFn: () => eventsApi.list(RANGE_DAYS),
  });

  return (
    <div>
      <PageHeader
        title={t('pages.events.title')}
        description={t('pages.events.description')}
        action={isAdmin ? <Button onClick={() => setCreateOpen(true)}>+ Add event</Button> : undefined}
      />

      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setView('list')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          List
        </button>
        <button
          onClick={() => setView('month')}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            view === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Month
        </button>
      </div>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.length === 0 ? (
        <EmptyState title="No upcoming events" message="Check back later." />
      ) : query.data ? (
        view === 'list' ? (
          <EventList events={query.data} isAdmin={isAdmin} />
        ) : (
          <MonthCalendar
            events={query.data}
            monthOffset={monthOffset}
            onMonthOffsetChange={setMonthOffset}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            isAdmin={isAdmin}
          />
        )
      ) : null}

      {isAdmin && <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function EventList({ events, isAdmin }: { events: EventDto[]; isAdmin: boolean }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

function EventCard({ event, isAdmin }: { event: EventDto; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showRsvps, setShowRsvps] = useState(false);

  const rsvpMutation = useMutation({
    mutationFn: (status: RsvpStatus) => eventsApi.rsvp(event.id, status),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const rsvpsQuery = useQuery({
    queryKey: ['event-rsvps', event.id],
    queryFn: () => eventsApi.rsvps(event.id),
    enabled: isAdmin && showRsvps,
  });

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{event.title}</h3>
              {event.myRsvpStatus && <Badge tone={RSVP_TONE[event.myRsvpStatus]}>{RSVP_LABEL[event.myRsvpStatus]}</Badge>}
            </div>
            {event.description && <p className="mt-1 text-sm text-slate-600">{event.description}</p>}
            {event.location && <p className="mt-1 text-xs text-slate-400">📍 {event.location}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Date</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(event.eventDate)}</p>
          </div>
        </div>

        {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {(['GOING', 'MAYBE', 'NOT_GOING'] as RsvpStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => rsvpMutation.mutate(status)}
              disabled={rsvpMutation.isPending}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                event.myRsvpStatus === status
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {RSVP_LABEL[status]}
            </button>
          ))}
          {isAdmin && (
            <button
              className="ml-auto text-xs font-medium text-brand-600 hover:text-brand-700"
              onClick={() => setShowRsvps((v) => !v)}
            >
              {showRsvps ? 'Hide RSVPs' : 'View RSVPs'}
            </button>
          )}
        </div>

        {showRsvps && (
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            {rsvpsQuery.isLoading ? (
              <LoadingState />
            ) : rsvpsQuery.data && rsvpsQuery.data.length === 0 ? (
              <p className="text-xs text-slate-400">No responses yet.</p>
            ) : (
              rsvpsQuery.data?.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{r.userName}</span>
                  <Badge tone={RSVP_TONE[r.status]}>{RSVP_LABEL[r.status]}</Badge>
                </div>
              ))
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function MonthCalendar({
  events,
  monthOffset,
  onMonthOffsetChange,
  selectedDate,
  onSelectDate,
  isAdmin,
}: {
  events: EventDto[];
  monthOffset: number;
  onMonthOffsetChange: (offset: number) => void;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  isAdmin: boolean;
}) {
  const displayedMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventDto[]>();
    for (const event of events) {
      const list = map.get(event.eventDate) ?? [];
      list.push(event);
      map.set(event.eventDate, list);
    }
    return map;
  }, [events]);

  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function isoDate(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => onMonthOffsetChange(monthOffset - 1)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          ← Prev
        </button>
        <h3 className="text-sm font-bold text-slate-900">
          {displayedMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => onMonthOffsetChange(monthOffset + 1)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const date = isoDate(day);
          const dayEvents = eventsByDate.get(date) ?? [];
          return (
            <button
              key={date}
              onClick={() => onSelectDate(date === selectedDate ? null : date)}
              className={`flex h-16 flex-col items-start rounded-xl border p-1.5 text-left text-xs transition-colors ${
                date === selectedDate ? 'border-brand-400 bg-brand-50' : 'border-slate-100 hover:bg-slate-50'
              }`}
            >
              <span className="font-semibold text-slate-700">{day}</span>
              {dayEvents.length > 0 && (
                <span className="mt-1 truncate rounded bg-brand-100 px-1 py-0.5 text-[10px] text-brand-700">
                  {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">{formatDate(selectedDate)}</h4>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No events on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <EventCard key={event.id} event={event} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => eventsApi.create({ title, description: description || undefined, eventDate, location: location || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setTitle('');
      setDescription('');
      setEventDate('');
      setLocation('');
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add event"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="event-form" loading={mutation.isPending}>
            Create
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="animate-scale-in rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Date" type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Textarea label="Description (optional)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </form>
    </Modal>
  );
}
