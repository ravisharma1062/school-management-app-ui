import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite doesn't resolve Leaflet's default marker asset URLs correctly out of the box.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const busIcon = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 1;">🚌</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export interface MapMarker {
  id: string;
  position: [number, number];
  label: string;
  isBus?: boolean;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export function BusMap({ markers, height = 320 }: { markers: MapMarker[]; height?: number }) {
  if (markers.length === 0) return null;
  const center = markers.find((m) => m.isBus)?.position ?? markers[0].position;

  return (
    <div style={{ height }} className="overflow-hidden rounded-xl">
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position} icon={marker.isBus ? busIcon : defaultIcon}>
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
