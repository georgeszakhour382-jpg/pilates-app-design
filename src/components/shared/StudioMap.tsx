import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom terracotta divIcon — matches the prototype's CTA color (`--color-clay`).
// SVG marker so we don't rely on Leaflet's default PNG sprite (which 404s
// behind Vite's bundler without extra config).
const PIN_SVG = `
<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="pin-shadow" x="-50%" y="-20%" width="200%" height="160%">
      <feGaussianBlur stdDeviation="1.2" />
    </filter>
  </defs>
  <ellipse cx="16" cy="40" rx="6" ry="1.3" fill="rgba(31,27,22,0.25)" filter="url(#pin-shadow)" />
  <path
    d="M16 1 C8 1 2 7.4 2 15 C2 24 16 39 16 39 C16 39 30 24 30 15 C30 7.4 24 1 16 1 Z"
    fill="#C97B5B"
    stroke="#fff"
    stroke-width="1.6"
  />
  <circle cx="16" cy="14" r="4.5" fill="#FAF7F2" />
</svg>
`;

const STUDIO_PIN = L.divIcon({
  html: PIN_SVG,
  className: 'pl-studio-pin',
  iconSize: [32, 42],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: false });
  }, [map, lat, lng]);
  return null;
}

export function StudioMap({
  lat,
  lng,
  className,
}: {
  lat: number;
  lng: number;
  className?: string;
}) {
  return (
    <div
      className={['relative aspect-[16/10] overflow-hidden rounded-2xl', className ?? ''].join(' ')}
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        minZoom={11}
        maxZoom={18}
        scrollWheelZoom={false}
        dragging
        zoomControl={false}
        className="h-full w-full"
        style={{ background: '#f3eee5' /* matches sand on tile load */ }}
      >
        {/* CartoDB Positron — minimal warm-grays; fits the editorial palette. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FlyTo lat={lat} lng={lng} />
        <Marker position={[lat, lng]} icon={STUDIO_PIN} />
      </MapContainer>
    </div>
  );
}
