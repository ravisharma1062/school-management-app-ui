import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '@/api/transport';
import { extractErrorMessage } from '@/api/client';
import { formatDateTime } from '@/lib/format';
import { Button, EmptyState, ErrorState, LoadingState, Select } from '@/components/ui';
import { BusMap, type MapMarker } from '@/components/features/BusMap';

export function TransportPanel({ studentId, canAssign }: { studentId: string; canAssign: boolean }) {
  const assignmentQuery = useQuery({
    queryKey: ['transport-assignment', studentId],
    queryFn: () => transportApi.getStudentAssignment(studentId),
    retry: false,
  });

  const notAssigned = assignmentQuery.isError;

  return (
    <div className="space-y-4">
      {canAssign && <AssignmentControl studentId={studentId} currentRouteId={assignmentQuery.data?.routeId} />}

      {assignmentQuery.isLoading ? (
        <LoadingState />
      ) : notAssigned ? (
        <EmptyState title="No bus assigned" message="This student is not yet assigned to a bus route." />
      ) : assignmentQuery.data ? (
        <LiveMap assignment={assignmentQuery.data.routeId} stopName={assignmentQuery.data.stopName}
          stopLat={assignmentQuery.data.stopLatitude} stopLng={assignmentQuery.data.stopLongitude}
          routeName={assignmentQuery.data.routeName} />
      ) : null}
    </div>
  );
}

function LiveMap({
  assignment: routeId,
  stopName,
  stopLat,
  stopLng,
  routeName,
}: {
  assignment: string;
  stopName: string;
  stopLat: number;
  stopLng: number;
  routeName: string;
}) {
  const locationQuery = useQuery({
    queryKey: ['bus-location', routeId],
    queryFn: () => transportApi.getLatestLocation(routeId),
    refetchInterval: 15000,
  });

  if (locationQuery.isLoading) return <LoadingState />;
  if (locationQuery.isError) return <ErrorState error={locationQuery.error} onRetry={() => locationQuery.refetch()} />;

  const markers: MapMarker[] = [{ id: 'stop', position: [stopLat, stopLng], label: `Stop: ${stopName}` }];
  const hasLocation = locationQuery.data?.latitude != null && locationQuery.data?.longitude != null;
  if (hasLocation) {
    markers.push({
      id: 'bus',
      position: [locationQuery.data!.latitude!, locationQuery.data!.longitude!],
      label: `${routeName} — last updated ${formatDateTime(locationQuery.data!.updatedAt)}`,
      isBus: true,
    });
  }

  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">
        Route <span className="font-semibold text-slate-900">{routeName}</span> · Stop{' '}
        <span className="font-semibold text-slate-900">{stopName}</span>
      </p>
      {!hasLocation && (
        <p className="mb-2 text-xs font-medium text-amber-600">
          No location reported yet — the bus's GPS device hasn't sent an update.
        </p>
      )}
      <BusMap markers={markers} />
    </div>
  );
}

function AssignmentControl({ studentId, currentRouteId }: { studentId: string; currentRouteId?: string }) {
  const queryClient = useQueryClient();
  const [routeId, setRouteId] = useState(currentRouteId ?? '');
  const [stopId, setStopId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const routesQuery = useQuery({
    queryKey: ['transport-routes'],
    queryFn: () => transportApi.listRoutes(),
  });

  const routeDetailQuery = useQuery({
    queryKey: ['transport-route', routeId],
    queryFn: () => transportApi.getRoute(routeId),
    enabled: !!routeId,
  });

  const mutation = useMutation({
    mutationFn: () => transportApi.assignStudent(studentId, { routeId, stopId }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['transport-assignment', studentId] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Assign to bus route</p>
      {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Select
            label="Route"
            value={routeId}
            onChange={(e) => {
              setRouteId(e.target.value);
              setStopId('');
            }}
          >
            <option value="">— Select —</option>
            {routesQuery.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <Select label="Stop" value={stopId} onChange={(e) => setStopId(e.target.value)} disabled={!routeId}>
            <option value="">— Select —</option>
            {routeDetailQuery.data?.stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          disabled={!routeId || !stopId}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
