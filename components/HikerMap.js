'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { STATUS_COLORS, CAMP_CENTER } from '@/lib/constants';
import { fenceBounds } from '@/lib/geofence';

// Mapbox CSS is required globally
import 'mapbox-gl/dist/mapbox-gl.css';

const FENCE_SOURCE = 'session-fence';

export default function HikerMap({ hikers, selectedId, onSelect, fence = null }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});      // id -> { marker, el, statusKey }
  const hikersRef    = useRef(hikers);  // latest hikers for stable callbacks
  const onSelectRef  = useRef(onSelect);
  const fittedFenceRef = useRef(null);  // id of fence we've framed
  const [ready,    setReady]    = useState(false);
  const [noToken,  setNoToken]  = useState(false);

  hikersRef.current = hikers;
  onSelectRef.current = onSelect;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const buildMarker = useCallback((hiker, isSelected) => {
    const color = STATUS_COLORS[hiker.status] ?? '#6b7280';
    const el = document.createElement('div');
    el.style.cssText = `position:relative;width:${isSelected ? 18 : 14}px;height:${isSelected ? 18 : 14}px;cursor:pointer;`;
    el.innerHTML = `
      <div style="width:100%;height:100%;background:${color};border:2px solid rgba(255,255,255,${isSelected ? 0.95 : 0.6});border-radius:50%;box-shadow:0 0 ${isSelected ? 12 : 6}px ${color}80;position:relative;z-index:1;"></div>
      ${hiker.status === 'active' || hiker.status === 'warning' || hiker.status === 'sos' ? `<div class="marker-ring" style="background:${color}40;"></div>` : ''}
    `;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectRef.current?.(hiker.id);
    });
    return el;
  }, []);

  const popupHtml = (h) => `
    <div style="background:#0c1624;border:1px solid #1a2e44;border-radius:8px;padding:8px 12px;font-family:system-ui;color:#dce8f5;">
      <div style="font-weight:600;font-size:13px">${h.name}</div>
      <div style="font-size:11px;color:#6e90b3;margin-top:2px">${h.group} · ${h.lastUpdate}</div>
      ${h.status !== 'offline' ? `
      <div style="margin-top:6px;display:flex;gap:12px;font-size:11px;font-family:monospace">
        <span style="color:#ef4444">♥ ${h.currentStats.heartRate || '—'} bpm</span>
        <span style="color:#22c55e">O₂ ${h.currentStats.oxygenSat || '—'}%</span>
      </div>
      ${h.outsideFence ? '<div style="font-size:11px;color:#ef4444;margin-top:4px">⚠ Outside route</div>' : ''}
      ` : '<div style="font-size:11px;color:#4b5563;margin-top:4px">Signal lost</div>'}
    </div>`;

  // Init map once.
  useEffect(() => {
    if (!token) { setNoToken(true); return; }
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;
    let ro = null;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (!mounted) return;

      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [CAMP_CENTER.lng, CAMP_CENTER.lat],
        zoom: 12,
        pitch: 45,
        bearing: -10,
        antialias: true,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

      ro = new ResizeObserver(() => map.resize());
      ro.observe(containerRef.current);

      map.on('load', () => {
        if (!mounted) return;
        map.resize();

        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        map.addSource(FENCE_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: `${FENCE_SOURCE}-fill`,
          type: 'fill',
          source: FENCE_SOURCE,
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.1 },
        });
        map.addLayer({
          id: `${FENCE_SOURCE}-line`,
          type: 'line',
          source: FENCE_SOURCE,
          paint: { 'line-color': '#22c55e', 'line-width': 2, 'line-opacity': 0.6, 'line-dasharray': [2, 1] },
        });

        setReady(true);
      });

      // Need mapboxgl available to the sync effects.
      mapRef.current._mapboxgl = mapboxgl;
    })();

    return () => {
      mounted = false;
      if (ro) ro.disconnect();
      Object.values(markersRef.current).forEach((m) => m.marker.remove());
      markersRef.current = {};
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token]);

  // Sync the assigned-route fence overlay.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const src = mapRef.current.getSource(FENCE_SOURCE);
    if (!src) return;
    src.setData(
      fence
        ? { type: 'FeatureCollection', features: [fence] }
        : { type: 'FeatureCollection', features: [] },
    );
    const key = fence ? JSON.stringify(fence.geometry?.coordinates?.[0]?.[0] ?? '') : null;
    if (fence && key !== fittedFenceRef.current) {
      const b = fenceBounds(fence);
      if (b) mapRef.current.fitBounds(b, { padding: 80, duration: 800, maxZoom: 15 });
      fittedFenceRef.current = key;
    }
    if (!fence) fittedFenceRef.current = null;
  }, [ready, fence]);

  // Sync hiker markers + path trails on every update.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const mapboxgl = map._mapboxgl;
    if (!mapboxgl) return;

    const present = new Set();

    hikers.forEach((hiker) => {
      present.add(hiker.id);
      const isSelected = hiker.id === selectedId;
      const statusKey = `${hiker.status}|${isSelected}`;

      // Path trail
      const sourceId = `path-${hiker.id}`;
      const path = Array.isArray(hiker.path) ? hiker.path : [];
      const pathData = {
        type: 'FeatureCollection',
        features: path.length >= 2
          ? [{ type: 'Feature', geometry: { type: 'LineString', coordinates: path } }]
          : [],
      };
      const existingSrc = map.getSource(sourceId);
      if (existingSrc) {
        existingSrc.setData(pathData);
      } else {
        map.addSource(sourceId, { type: 'geojson', data: pathData });
        map.addLayer({
          id: `layer-${hiker.id}`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': STATUS_COLORS[hiker.status] ?? '#6b7280',
            'line-width': 2.5,
            'line-opacity': 0.8,
          },
        });
      }
      if (map.getLayer(`layer-${hiker.id}`)) {
        map.setPaintProperty(
          `layer-${hiker.id}`,
          'line-color',
          STATUS_COLORS[hiker.status] ?? '#6b7280',
        );
      }

      // Marker
      const loc = hiker.location;
      const hasLoc = loc && typeof loc.lng === 'number' && typeof loc.lat === 'number'
        && (loc.lng !== 0 || loc.lat !== 0);
      let entry = markersRef.current[hiker.id];

      if (!hasLoc) {
        if (entry) { entry.marker.remove(); delete markersRef.current[hiker.id]; }
        return;
      }

      if (!entry) {
        const el = buildMarker(hiker, isSelected);
        const popup = new mapboxgl.Popup({
          closeButton: false, closeOnClick: false, offset: 14,
          className: 'mapbox-hiker-popup',
        });
        el.addEventListener('mouseenter', () => {
          const cur = hikersRef.current.find((x) => x.id === hiker.id);
          if (cur) popup.setLngLat([cur.location.lng, cur.location.lat]).setHTML(popupHtml(cur)).addTo(map);
        });
        el.addEventListener('mouseleave', () => popup.remove());
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map);
        markersRef.current[hiker.id] = { marker, el, popup, statusKey };
      } else {
        entry.marker.setLngLat([loc.lng, loc.lat]);
        if (entry.statusKey !== statusKey) {
          const newEl = buildMarker(hiker, isSelected);
          const popup = entry.popup;
          newEl.addEventListener('mouseenter', () => {
            const cur = hikersRef.current.find((x) => x.id === hiker.id);
            if (cur) popup.setLngLat([cur.location.lng, cur.location.lat]).setHTML(popupHtml(cur)).addTo(map);
          });
          newEl.addEventListener('mouseleave', () => popup.remove());
          entry.marker.getElement().replaceWith(newEl);
          entry.el = newEl;
          entry.statusKey = statusKey;
        }
      }
    });

    // Remove markers/paths for hikers no longer in the session
    Object.keys(markersRef.current).forEach((id) => {
      if (!present.has(id)) {
        markersRef.current[id].marker.remove();
        delete markersRef.current[id];
        if (map.getLayer(`layer-${id}`)) map.removeLayer(`layer-${id}`);
        if (map.getSource(`path-${id}`)) map.removeSource(`path-${id}`);
      }
    });
  }, [ready, hikers, selectedId, buildMarker]);

  // Fly to the selected hiker.
  useEffect(() => {
    if (!ready || !selectedId || !mapRef.current) return;
    const h = hikersRef.current.find((x) => x.id === selectedId);
    if (h?.location && (h.location.lng !== 0 || h.location.lat !== 0)) {
      mapRef.current.easeTo({
        center: [h.location.lng, h.location.lat],
        zoom: 13.5,
        duration: 800,
      });
    }
  }, [selectedId, ready]);

  if (noToken) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center">
          <AlertTriangle size={28} className="text-warning" />
        </div>
        <div>
          <h3 className="font-display font-bold text-xl uppercase tracking-widest text-primary mb-2">
            Mapbox Token Required
          </h3>
          <p className="text-secondary text-sm max-w-sm">
            Add <code className="text-accent-bright">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the live map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} className="absolute min-h-screen inset-0" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-base z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent/40 border-t-accent-bright rounded-full animate-spin" />
            <span className="text-xs font-mono text-secondary uppercase tracking-widest">Loading terrain map…</span>
          </div>
        </div>
      )}

      {ready && (
        <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2.5 z-10">
          <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1.5">Status</p>
          {[
            { label: 'Active',  color: STATUS_COLORS.active },
            { label: 'Warning', color: STATUS_COLORS.warning },
            { label: 'SOS',     color: STATUS_COLORS.sos },
            { label: 'Offline', color: STATUS_COLORS.offline },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-secondary">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
