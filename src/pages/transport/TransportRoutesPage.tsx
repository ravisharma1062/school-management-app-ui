import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { transportApi } from '@/api/transport';
import { extractErrorMessage } from '@/api/client';
import {
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
import { BusMap, type MapMarker } from '@/components/features/BusMap';
import type { BusStopCreateRequest } from '@/types';

export function TransportRoutesPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['transport-routes'],
    queryFn: () => transportApi.listRoutes(),
  });

  return (
    <div>
      <PageHeader
        title={t('pages.busRoutes.title')}
        description={t('pages.busRoutes.description')}
        action={<Button onClick={() => setCreateOpen(true)}>+ Add route</Button>}
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data && query.data.length === 0 ? (
        <EmptyState title="No routes yet" message="Add a bus route to get started." />
      ) : (
        <div className="space-y-3">
          {query.data?.map((route) => (
            <Card key={route.id}>
              <CardBody>
                <button
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setSelectedId(route.id === selectedId ? null : route.id)}
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{route.name}</h3>
                    {route.description && <p className="text-sm text-slate-500">{route.description}</p>}
                  </div>
                  <span className="text-xs font-medium text-slate-400">{route.stopCount} stops</span>
                </button>
                {selectedId === route.id && <RouteDetail routeId={route.id} />}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <CreateRouteModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function RouteDetail({ routeId }: { routeId: string }) {
  const [copied, setCopied] = useState(false);
  const query = useQuery({
    queryKey: ['transport-route', routeId],
    queryFn: () => transportApi.getRoute(routeId),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const markers: MapMarker[] = query.data.stops.map((s) => ({
    id: s.id,
    position: [s.latitude, s.longitude],
    label: s.name,
  }));

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Device location token — configure the bus's GPS device/app with this
        </p>
        <div className="mt-1 flex items-center gap-2">
          <code className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">{query.data.locationToken}</code>
          <button
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
            onClick={() => {
              navigator.clipboard.writeText(query.data!.locationToken);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <BusMap markers={markers} />
    </div>
  );
}

function CreateRouteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stops, setStops] = useState<BusStopCreateRequest[]>([{ name: '', stopOrder: 0, latitude: 0, longitude: 0 }]);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => transportApi.createRoute({ name, description: description || undefined, stops }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      setName('');
      setDescription('');
      setStops([{ name: '', stopOrder: 0, latitude: 0, longitude: 0 }]);
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function updateStop(index: number, patch: Partial<BusStopCreateRequest>) {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStop() {
    setStops((prev) => [...prev, { name: '', stopOrder: prev.length, latitude: 0, longitude: 0 }]);
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stopOrder: i })));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add bus route"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="route-form" loading={mutation.isPending}>
            Create
          </Button>
        </>
      }
    >
      <form id="route-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        <Input label="Route name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Stops (in order)</p>
            <button type="button" className="text-xs font-medium text-brand-600 hover:text-brand-700" onClick={addStop}>
              + Add stop
            </button>
          </div>
          <div className="space-y-2">
            {stops.map((stop, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input
                  className="col-span-5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                  placeholder="Stop name"
                  required
                  value={stop.name}
                  onChange={(e) => updateStop(i, { name: e.target.value })}
                />
                <input
                  className="col-span-3 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                  placeholder="Latitude"
                  type="number"
                  step="any"
                  required
                  value={stop.latitude || ''}
                  onChange={(e) => updateStop(i, { latitude: Number(e.target.value) })}
                />
                <input
                  className="col-span-3 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                  placeholder="Longitude"
                  type="number"
                  step="any"
                  required
                  value={stop.longitude || ''}
                  onChange={(e) => updateStop(i, { longitude: Number(e.target.value) })}
                />
                <button
                  type="button"
                  className="col-span-1 text-red-500 hover:text-red-700"
                  onClick={() => removeStop(i)}
                  disabled={stops.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
