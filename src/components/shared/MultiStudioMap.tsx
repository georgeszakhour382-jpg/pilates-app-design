import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Single shared pin icon (matches StudioMap.tsx). Terracotta, white halo,
// soft drop-shadow ellipse — fits the editorial palette.
const PIN_SVG = `
<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ms-pin-shadow" x="-50%" y="-20%" width="200%" height="160%">
      <feGaussianBlur stdDeviation="1.2" />
    </filter>
  </defs>
  <ellipse cx="16" cy="40" rx="6" ry="1.3" fill="rgba(31,27,22,0.25)" filter="url(#ms-pin-shadow)" />
  <path
    d="M16 1 C8 1 2 7.4 2 15 C2 24 16 39 16 39 C16 39 30 24 30 15 C30 7.4 24 1 16 1 Z"
    fill="#C97B5B"
    stroke="#fff"
    stroke-width="1.6"
  />
  <circle cx="16" cy="14" r="4.5" fill="#FAF7F2" />
</svg>
`;

const PIN_SVG_ACTIVE = PIN_SVG.replace(/fill="#C97B5B"/, 'fill="#1F1B16"').replace(
  /fill="#FAF7F2"/,
  'fill="#C97B5B"',
);

const STUDIO_PIN = L.divIcon({
  html: PIN_SVG,
  className: 'pl-multi-studio-pin',
  iconSize: [32, 42],
  iconAnchor: [16, 40],
});

const STUDIO_PIN_ACTIVE = L.divIcon({
  html: PIN_SVG_ACTIVE,
  className: 'pl-multi-studio-pin pl-multi-studio-pin--active',
  iconSize: [36, 48],
  iconAnchor: [18, 46],
});

export interface MapStudio {
  id: string;
  slug: string;
  name: string;
  neighborhood: string | null;
  city: string;
  rating: number;
  priceFrom: number;
  hero: string;
  lat: number;
  lng: number;
}

function FitBounds({ studios }: { studios: MapStudio[] }) {
  const map = useMap();
  useEffect(() => {
    if (studios.length === 0) return;
    if (studios.length === 1) {
      map.setView([studios[0]!.lat, studios[0]!.lng], 14, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(studios.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.25), { animate: false, maxZoom: 14 });
  }, [map, studios]);
  return null;
}

export function MultiStudioMap({
  studios,
  onSelect,
  className,
}: {
  studios: MapStudio[];
  onSelect: (studio: MapStudio) => void;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(
    () => studios.find((s) => s.id === activeId) ?? null,
    [studios, activeId],
  );

  // Beirut center as a sane default for empty result sets.
  const center: [number, number] = [33.89, 35.5];

  return (
    <div
      className={['relative overflow-hidden rounded-2xl', className ?? ''].join(' ')}
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      <MapContainer
        center={center}
        zoom={11}
        minZoom={9}
        maxZoom={17}
        scrollWheelZoom={false}
        dragging
        zoomControl={false}
        className="h-full w-full"
        style={{ background: '#f3eee5' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds studios={studios} />
        {studios.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={s.id === activeId ? STUDIO_PIN_ACTIVE : STUDIO_PIN}
            eventHandlers={{
              click: () => setActiveId((prev) => (prev === s.id ? null : s.id)),
            }}
          />
        ))}
      </MapContainer>

      {/* Floating preview card for the active pin — overlay on the map. */}
      {active && (
        <button
          onClick={() => onSelect(active)}
          className="press-soft absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-bone p-3 text-start"
          style={{ boxShadow: '0 10px 30px rgba(31,27,22,0.18)' }}
        >
          <img
            src={active.hero}
            alt={active.name}
            className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-medium leading-tight">{active.name}</div>
            <div className="mt-0.5 truncate text-[12px] text-ink-60">
              {active.neighborhood ? `${active.neighborhood} · ` : ''}
              {active.city}
            </div>
            <div className="mt-1 flex items-center gap-2 num text-[12px] text-ink-60">
              <span className="font-medium text-ink">{active.rating.toFixed(2)}</span>
              <span>· from ${active.priceFrom}</span>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
