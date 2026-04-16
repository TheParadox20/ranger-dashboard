'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import { STATUS_COLORS, CAMP_CENTER } from '@/lib/dummy-data';

// Mapbox CSS is required globally
import 'mapbox-gl/dist/mapbox-gl.css';

export default function HikerMap({ hikers, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});
  const [ready,    setReady]    = useState(false);
  const [noToken,  setNoToken]  = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Build marker element
  const buildMarker = useCallback((hiker, isSelected) => {
    const color = STATUS_COLORS[hiker.status] ?? '#6b7280';
    const el = document.createElement('div');
    el.style.cssText = `
      position: relative;
      width: ${isSelected ? 18 : 14}px;
      height: ${isSelected ? 18 : 14}px;
      cursor: pointer;
    `;
    el.innerHTML = `
      <div style="
        width:100%; height:100%;
        background:${color};
        border: 2px solid rgba(255,255,255,${isSelected ? 0.95 : 0.6});
        border-radius: 50%;
        box-shadow: 0 0 ${isSelected ? 12 : 6}px ${color}80;
        z-index:1; position:relative;
      "></div>
      ${hiker.status === 'active' || hiker.status === 'warning' ? `
      <div class="marker-ring" style="background:${color}40;"></div>
      ` : ''}
    `;
    return el;
  }, []);

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

      // Resize whenever the container changes size (handles flex layout settling)
      ro = new ResizeObserver(() => { map.resize(); });
      ro.observe(containerRef.current);

      map.on('load', () => {
        if (!mounted) return;
        // Force canvas to fill the container after layout has settled
        map.resize();

        // Add terrain
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // Draw paths
        hikers.forEach(hiker => {
          const sourceId = `path-${hiker.id}`;
          const layerId  = `layer-${hiker.id}`;
          const color    = STATUS_COLORS[hiker.status] ?? '#6b7280';

          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: hiker.path },
            },
          });

          // Glow under-layer
          map.addLayer({
            id: `${layerId}-glow`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': 6,
              'line-opacity': 0.2,
              'line-blur': 4,
            },
          });

          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': 2.5,
              'line-opacity': hiker.status === 'offline' ? 0.4 : 0.85,
              'line-dasharray': hiker.status === 'offline' ? [2, 2] : [1],
            },
          });
        });

        // Add markers
        hikers.forEach(hiker => {
          const el     = buildMarker(hiker, false);
          const lngLat = [hiker.location.lng, hiker.location.lat];

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelect(hiker.id);
          });

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 14,
            className: 'mapbox-hiker-popup',
          }).setHTML(`
            <div style="
              background:#0c1624; border:1px solid #1a2e44;
              border-radius:8px; padding:8px 12px;
              font-family:system-ui; color:#dce8f5;
            ">
              <div style="font-weight:600; font-size:13px">${hiker.name}</div>
              <div style="font-size:11px; color:#6e90b3; margin-top:2px">${hiker.group} · ${hiker.lastUpdate}</div>
              ${hiker.status !== 'offline' ? `
              <div style="margin-top:6px; display:flex; gap:12px; font-size:11px; font-family:monospace">
                <span style="color:#ef4444">♥ ${hiker.currentStats.heartRate} bpm</span>
                <span style="color:#60a5fa">▲ ${hiker.currentStats.elevation}m</span>
                <span style="color:#22c55e">O₂ ${hiker.currentStats.oxygenSat}%</span>
              </div>
              ` : '<div style="font-size:11px;color:#4b5563;margin-top:4px">Signal lost</div>'}
            </div>
          `);

          el.addEventListener('mouseenter', () => {
            popup.setLngLat(lngLat).addTo(map);
          });
          el.addEventListener('mouseleave', () => popup.remove());

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(lngLat)
            .addTo(map);

          markersRef.current[hiker.id] = { marker, el };
        });

        // Base camp marker
        const campEl = document.createElement('div');
        campEl.innerHTML = `
          <div style="
            background:#16a34a; border: 2px solid #22c55e;
            color:white; font-size:9px; font-weight:700;
            padding: 3px 6px; border-radius:4px;
            font-family:system-ui; letter-spacing:0.08em;
            box-shadow:0 0 10px #16a34a60;
          ">⛺ BASE</div>
        `;
        new mapboxgl.Marker({ element: campEl })
          .setLngLat([CAMP_CENTER.lng, CAMP_CENTER.lat])
          .addTo(map);

        setReady(true);
      });
    })();

    return () => {
      mounted = false;
      if (ro) ro.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Update marker sizes when selection changes
  useEffect(() => {
    if (!ready) return;
    hikers.forEach(hiker => {
      const entry = markersRef.current[hiker.id];
      if (!entry) return;
      const isSelected = hiker.id === selectedId;
      const newEl = buildMarker(hiker, isSelected);
      newEl.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect(hiker.id);
      });
      entry.marker.getElement().replaceWith(newEl);
      entry.el = newEl;
    });

    // Fly to selected hiker
    if (selectedId && mapRef.current) {
      const h = hikers.find(x => x.id === selectedId);
      if (h) {
        mapRef.current.easeTo({
          center: [h.location.lng, h.location.lat],
          zoom: 13.5,
          duration: 800,
        });
      }
    }
  }, [selectedId, ready, hikers, buildMarker, onSelect]);

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
            Add your Mapbox public token to enable the live hiker map.
          </p>
          <div className="mt-4 bg-panel border border-border rounded-lg px-4 py-3 text-left">
            <p className="text-xs font-mono text-muted mb-1">Create <code className="text-secondary">.env.local</code> and add:</p>
            <p className="text-xs font-mono text-accent-bright">NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...</p>
          </div>
          <p className="text-xs text-muted mt-3">
            Get a free token at mapbox.com → Account → Tokens
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

      {/* Map legend */}
      {ready && (
        <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2.5 z-10">
          <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1.5">Trail Status</p>
          {[
            { label: 'Active',  color: STATUS_COLORS.active },
            { label: 'Resting', color: STATUS_COLORS.resting },
            { label: 'Warning', color: STATUS_COLORS.warning },
            { label: 'Offline', color: STATUS_COLORS.offline },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-0.5 rounded" style={{ background: color }} />
              <span className="text-[10px] text-secondary">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
