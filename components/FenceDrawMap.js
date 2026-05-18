'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CAMP_CENTER } from '@/lib/constants';
import { fenceBounds } from '@/lib/geofence';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const DISPLAY_SOURCE = 'fences-display';

// Map with a polygon draw tool. Existing fences (except the one being edited)
// are shown read-only; the user draws/edits one polygon and `onChange` is
// called with the GeoJSON Feature (or null when cleared).
export default function FenceDrawMap({
  fences = [],
  editingFenceId = null,
  onChange,
  hint,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [noToken, setNoToken] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Init map + draw control once.
  useEffect(() => {
    if (!token) {
      setNoToken(true);
      return;
    }
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;
    let ro = null;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      const drawMod = await import('@mapbox/mapbox-gl-draw');
      const MapboxDraw = drawMod.default ?? drawMod;
      if (!mounted) return;

      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [CAMP_CENTER.lng, CAMP_CENTER.lat],
        zoom: 12,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      });
      drawRef.current = draw;
      map.addControl(draw, 'top-left');

      // Keep only the most recently drawn polygon; report it upward.
      const sync = () => {
        const all = draw.getAll();
        const feats = all.features;
        if (feats.length > 1) {
          feats.slice(0, -1).forEach((f) => draw.delete(f.id));
        }
        const current = draw.getAll().features[0] ?? null;
        onChangeRef.current?.(
          current
            ? { type: 'Feature', properties: {}, geometry: current.geometry }
            : null,
        );
      };

      map.on('draw.create', sync);
      map.on('draw.update', sync);
      map.on('draw.delete', () => onChangeRef.current?.(null));

      ro = new ResizeObserver(() => map.resize());
      ro.observe(containerRef.current);

      map.on('load', () => {
        if (!mounted) return;
        map.resize();

        map.addSource(DISPLAY_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: `${DISPLAY_SOURCE}-fill`,
          type: 'fill',
          source: DISPLAY_SOURCE,
          paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.12 },
        });
        map.addLayer({
          id: `${DISPLAY_SOURCE}-line`,
          type: 'line',
          source: DISPLAY_SOURCE,
          paint: { 'line-color': '#22c55e', 'line-width': 2, 'line-opacity': 0.7 },
        });

        setReady(true);
      });
    })();

    return () => {
      mounted = false;
      if (ro) ro.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        drawRef.current = null;
      }
    };
  }, [token]);

  // Render the read-only fences (everything except the one being edited).
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const src = mapRef.current.getSource(DISPLAY_SOURCE);
    if (!src) return;

    const features = fences
      .filter((f) => f.id !== editingFenceId && f.geojson)
      .map((f) => f.geojson);
    src.setData({ type: 'FeatureCollection', features });

    // Frame the relevant fence(s).
    const focus = editingFenceId
      ? fences.find((f) => f.id === editingFenceId)
      : fences[0];
    const b = focus && fenceBounds(focus.geojson);
    if (b) {
      mapRef.current.fitBounds(b, { padding: 60, duration: 600, maxZoom: 15 });
    }
  }, [ready, fences, editingFenceId]);

  // Load the fence being edited into the draw tool.
  useEffect(() => {
    if (!ready || !drawRef.current) return;
    const draw = drawRef.current;
    draw.deleteAll();
    if (editingFenceId) {
      const fence = fences.find((f) => f.id === editingFenceId);
      if (fence?.geojson) {
        draw.add(fence.geojson);
        onChangeRef.current?.(fence.geojson);
      }
    } else {
      onChangeRef.current?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, editingFenceId]);

  if (noToken) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base gap-3 text-center p-8">
        <div className="w-14 h-14 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center">
          <AlertTriangle size={24} className="text-warning" />
        </div>
        <p className="text-secondary text-sm max-w-xs">
          Set <code className="text-accent-bright">NEXT_PUBLIC_MAPBOX_TOKEN</code>{' '}
          to draw routes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} className="absolute min-h-screen inset-0" />
      {hint && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 z-10">
          <p className="text-[11px] font-mono text-secondary">{hint}</p>
        </div>
      )}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-base z-10">
          <div className="w-8 h-8 border-2 border-accent/40 border-t-accent-bright rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
