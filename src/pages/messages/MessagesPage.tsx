import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { conversationsApi } from '@/api/conversations';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime } from '@/lib/format';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import type { ConversationDto } from '@/types';

export function MessagesPage() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.list(),
  });
  const contactsQuery = useQuery({
    queryKey: ['conversation-contacts'],
    queryFn: () => conversationsApi.contacts(),
  });

  const startMutation = useMutation({
    mutationFn: (otherUserId: string) => conversationsApi.start(otherUserId),
    onSuccess: (conversation) => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedId(conversation.id);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const existingContactIds = new Set(
    (conversationsQuery.data ?? []).map((c) => (role === 'TEACHER' ? c.parentId : c.teacherId)),
  );
  const newContacts = (contactsQuery.data ?? []).filter((c) => !existingContactIds.has(c.id));

  function otherName(c: ConversationDto) {
    return role === 'TEACHER' ? c.parentName : c.teacherName;
  }

  return (
    <div>
      <PageHeader title={t('pages.messages.title')} description={t('pages.messages.description')} />

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <div className="max-h-[32rem] overflow-y-auto p-2">
            {conversationsQuery.isLoading ? (
              <LoadingState />
            ) : (
              <>
                {(conversationsQuery.data ?? []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      selectedId === c.id ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {otherName(c)}
                  </button>
                ))}
                {newContacts.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Start a new conversation
                    </p>
                    {newContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => startMutation.mutate(contact.id)}
                        disabled={startMutation.isPending}
                        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {contact.name}
                      </button>
                    ))}
                  </div>
                )}
                {(conversationsQuery.data ?? []).length === 0 && newContacts.length === 0 && (
                  <EmptyState
                    title="No contacts yet"
                    message={
                      role === 'PARENT'
                        ? "You'll see your children's teachers here once they're assigned to a class."
                        : "You'll see parents of your students here once you're assigned to a class."
                    }
                  />
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="md:col-span-2">
          {selectedId ? (
            <ConversationThread conversationId={selectedId} currentUserId={user?.id} />
          ) : (
            <div className="p-8">
              <EmptyState title="Select a conversation" message="Choose a conversation on the left, or start a new one." />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ConversationThread({ conversationId, currentUserId }: { conversationId: string; currentUserId?: string }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationsApi.messages(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => conversationsApi.sendMessage(conversationId, text),
    onSuccess: () => {
      setError(null);
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    sendMutation.mutate(body.trim());
  }

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messagesQuery.isLoading ? (
          <LoadingState />
        ) : messagesQuery.isError ? (
          <ErrorState error={messagesQuery.error} onRetry={() => messagesQuery.refetch()} />
        ) : messagesQuery.data && messagesQuery.data.length === 0 ? (
          <EmptyState title="No messages yet" message="Say hello to start the conversation." />
        ) : (
          messagesQuery.data?.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p>{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                    {formatDateTime(m.sentAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={onSubmit} className="border-t border-slate-100 p-3">
        {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !body.trim()}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
