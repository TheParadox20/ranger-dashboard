'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Heart, Users, Plus } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import HikerSidebar from '@/components/HikerSidebar';
import HealthPanel from '@/components/HealthPanel';
import EmergencyContactsPanel from '@/components/EmergencyContactsPanel';
import useDashboardWebSocket from '@/hooks/useDashboardWebSocket';
import useSessions from '@/hooks/useSessions';
import useFences from '@/hooks/useFences';
import { isInsideFence } from '@/lib/geofence';
import { cn } from '@/lib/utils';

const HikerMap = dynamic(() => import('@/components/HikerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent/40 border-t-accent-bright rounded-full animate-spin" />
        <span className="text-xs font-mono text-secondary uppercase tracking-widest">Initialising map…</span>
      </div>
    </div>
  ),
});

const TABS = [
  { id: 'vitals',   label: 'Vitals',   icon: Heart },
  { id: 'contacts', label: 'Contacts', icon: Users },
];

const HISTORY_MAX = 60;
const STALE_MS = 25000;
// Sentinel for telemetry that arrives without a device_id (firmware not yet
// emitting it). Such a stream is attributed to a single-user session's user.
const NO_DEVICE = '__nodevice__';

function appendHistory(arr, val) {
  const next = [...(arr ?? []), val];
  return next.length > HISTORY_MAX ? next.slice(-HISTORY_MAX) : next;
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardPage() {
  const { sessions, loading, error, updateSession } = useSessions();
  const { fences } = useFences();

  const [liveByDevice, setLiveByDevice] = useState({});
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [activeTab, setActiveTab] = useState('vitals');
  const [now, setNow] = useState(() => Date.now());

  // Resolve the active session (explicit pick → newest active → newest).
  const selectedSession = useMemo(() => {
    if (sessions.length === 0) return null;
    return (
      sessions.find((s) => s.id === selectedSessionId) ||
      sessions.find((s) => s.status === 'active') ||
      sessions[0]
    );
  }, [sessions, selectedSessionId]);

  const fence = useMemo(() => {
    if (!selectedSession?.fenceId) return null;
    return fences.find((f) => f.id === selectedSession.fenceId)?.geojson ?? null;
  }, [fences, selectedSession]);

  // Telemetry arrives via an external-system callback (no effect→setState
  // cascade): accumulate per-device stats + rolling history.
  const onSerial = useCallback((d) => {
    const deviceId = d.deviceId || NO_DEVICE;
    setLiveByDevice((prev) => {
      const cur = prev[deviceId] ?? {};
      const hasFix = d.lat !== 0 || d.lon !== 0;
      const location = hasFix ? { lat: d.lat, lng: d.lon } : cur.location ?? null;
      const path = hasFix
        ? appendHistory(cur.path ?? [], [d.lon, d.lat])
        : cur.path ?? [];

      return {
        ...prev,
        [deviceId]: {
          stats: {
            heartRate: d.noFinger || d.bpm === 0 ? cur.stats?.heartRate ?? 0 : d.bpm,
            oxygenSat:
              !d.noFinger && d.spo2Valid && d.spo2 > 0
                ? d.spo2
                : cur.stats?.oxygenSat ?? 0,
            temperature: d.skin,
            ambientTemp: d.temp,
            gsr: d.gsr,
            rssi: d.rssi,
            snr: d.snr,
            noFinger: d.noFinger,
            spo2Valid: d.spo2Valid,
          },
          location,
          path,
          heartRateHistory:
            d.noFinger || d.bpm === 0
              ? cur.heartRateHistory ?? []
              : appendHistory(cur.heartRateHistory ?? [], d.bpm),
          oxygenSatHistory:
            d.noFinger || !d.spo2Valid
              ? cur.oxygenSatHistory ?? []
              : appendHistory(cur.oxygenSatHistory ?? [], d.spo2),
          gsrHistory: appendHistory(cur.gsrHistory ?? [], d.gsr),
          skinTempHistory: appendHistory(cur.skinTempHistory ?? [], d.skin),
          rssiHistory: appendHistory(cur.rssiHistory ?? [], d.rssi),
          lastSeen: Date.now(),
        },
      };
    });
  }, []);

  const { connectedUsers, connectionState, sendJson } = useDashboardWebSocket({
    onSerial,
  });

  useEffect(() => {
    if (connectionState !== 'open') return;
    sendJson({ type: 'setup', data: { client: 'ranger-dashboard' } });
  }, [connectionState, sendJson]);

  // Periodic tick so a device that stops reporting goes "offline".
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  // Derive the hiker view model from session users + live telemetry.
  const hikers = useMemo(() => {
    if (!selectedSession) return [];
    const single = selectedSession.users.length === 1;

    return selectedSession.users.map((u) => {
      const live =
        liveByDevice[u.deviceId] ?? (single ? liveByDevice[NO_DEVICE] : undefined);
      const isLive = !!live && now - live.lastSeen < STALE_MS;
      const stats = live?.stats ?? {};
      const location = live?.location ?? null;
      const outsideFence =
        isLive && fence && location
          ? !isInsideFence({ lat: location.lat, lon: location.lng }, fence)
          : false;

      let status;
      if (!isLive) {
        status = 'offline';
      } else {
        const hr = stats.heartRate ?? 0;
        const o2 = stats.oxygenSat ?? 0;
        const critical =
          (hr > 0 && (hr > 140 || hr < 40)) ||
          (stats.spo2Valid && o2 > 0 && o2 < 85);
        const warn =
          hr > 120 ||
          (hr > 0 && hr < 45) ||
          (stats.spo2Valid && o2 > 0 && o2 < 90) ||
          outsideFence;
        status = critical ? 'sos' : warn ? 'warning' : 'active';
      }

      return {
        id: u.id,
        name: u.name,
        group: selectedSession.name,
        avatar: initials(u.name),
        bloodGroup: u.bloodGroup,
        emergencyContact: u.emergencyContact,
        deviceId: u.deviceId,
        status,
        isLive,
        outsideFence,
        lastUpdate: isLive ? 'Live' : 'No signal',
        location: location ?? { lng: 0, lat: 0 },
        path: live?.path ?? [],
        currentStats: {
          heartRate: stats.heartRate ?? 0,
          oxygenSat: stats.oxygenSat ?? 0,
          temperature: stats.temperature ?? 0,
          ambientTemp: stats.ambientTemp ?? 0,
          gsr: stats.gsr,
          rssi: stats.rssi,
          snr: stats.snr,
          noFinger: stats.noFinger,
          spo2Valid: stats.spo2Valid,
          elevation: 0,
          steps: 0,
        },
        heartRateHistory: live?.heartRateHistory ?? [],
        oxygenSatHistory: live?.oxygenSatHistory ?? [],
        gsrHistory: live?.gsrHistory ?? [],
        skinTempHistory: live?.skinTempHistory ?? [],
        rssiHistory: live?.rssiHistory ?? [],
        elevationHistory: [],
        stepsHistory: [],
      };
    });
  }, [selectedSession, liveByDevice, fence, now]);

  const summary = useMemo(() => {
    const acc = { active: 0, resting: 0, warning: 0, sos: 0, offline: 0 };
    hikers.forEach((h) => {
      acc[h.status] = (acc[h.status] ?? 0) + 1;
    });
    return acc;
  }, [hikers]);

  const selectedHiker = useMemo(
    () => hikers.find((h) => h.id === selectedUserId) ?? hikers[0] ?? null,
    [hikers, selectedUserId],
  );

  // Notify the serial bridge whenever the aggregate fence state for the
  // selected session flips. The bridge forwards `inside`/`outside` over the
  // serial link to the receiver ESP, so we only POST on transitions.
  const lastFenceStateRef = useRef({ sessionId: null, state: null });
  useEffect(() => {
    const remote = process.env.NEXT_PUBLIC_REMOTE_URL;
    if (!remote || !selectedSession || !fence) return;

    const liveWithFix = hikers.filter((h) => h.isLive && h.location);
    if (liveWithFix.length === 0) return;

    const state = liveWithFix.some((h) => h.outsideFence) ? 'outside' : 'inside';
    const last = lastFenceStateRef.current;
    if (last.sessionId === selectedSession.id && last.state === state) return;

    lastFenceStateRef.current = { sessionId: selectedSession.id, state };
    fetch(`${remote}/api/geofence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    }).catch((err) => {
      console.error('Geofence POST failed:', err);
    });
  }, [hikers, selectedSession, fence]);

  const handleSelect = (id) => {
    setSelectedUserId(id);
    setActiveTab('vitals');
  };

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setSelectedUserId('');
  };

  const handleContactSave = async (contact) => {
    if (!selectedSession || !selectedHiker) return;
    const users = selectedSession.users.map((u) =>
      u.id === selectedHiker.id ? { ...u, emergencyContact: contact } : u,
    );
    await updateSession(selectedSession.id, { users });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader
        summary={summary}
        sessions={sessions}
        selectedSessionId={selectedSession?.id ?? ''}
        onSelectSession={handleSelectSession}
      />

      {!loading && !error && sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center bg-base">
          <div className="w-14 h-14 rounded-full bg-panel border border-border flex items-center justify-center">
            <Users size={24} className="text-muted" />
          </div>
          <div>
            <p className="text-primary font-medium">No hiking sessions yet</p>
            <p className="text-muted text-sm mt-1">
              Create a session to start tracking hikers.
            </p>
          </div>
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:bg-accent-bright transition-colors"
          >
            <Plus size={15} />
            New Session
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <HikerSidebar
            hikers={hikers}
            selectedId={selectedHiker?.id}
            onSelect={handleSelect}
            connectionState={connectionState}
            connectedUsers={connectedUsers}
          />

          <HikerMap
            hikers={hikers}
            selectedId={selectedHiker?.id}
            onSelect={handleSelect}
            fence={fence}
          />

          <aside className="w-80 shrink-0 flex flex-col bg-surface border-l border-border overflow-hidden">
            {selectedHiker && (
              <div className="px-4 pt-3 pb-0 border-b border-border bg-panel/50">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-display ring-2',
                      selectedHiker.status === 'active' && 'bg-active/15  text-active  ring-active/50',
                      selectedHiker.status === 'resting' && 'bg-resting/15 text-resting ring-resting/50',
                      selectedHiker.status === 'warning' && 'bg-warning/15 text-warning ring-warning/50',
                      selectedHiker.status === 'sos' && 'bg-danger/15  text-danger  ring-danger/50',
                      selectedHiker.status === 'offline' && 'bg-elevated   text-muted   ring-border',
                    )}
                  >
                    {selectedHiker.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {selectedHiker.name}
                    </p>
                    <p className="text-[11px] font-mono text-muted">
                      {selectedHiker.group} · {selectedHiker.deviceId}
                    </p>
                  </div>
                </div>

                <div className="flex -mb-px">
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors border-b-2',
                        activeTab === id
                          ? 'text-accent-bright border-accent-bright'
                          : 'text-muted border-transparent hover:text-secondary',
                      )}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!selectedHiker && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted text-sm">
                  {selectedSession
                    ? 'No users in this session'
                    : 'Select a session'}
                </p>
              </div>
            )}

            {selectedHiker && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'vitals' && <HealthPanel hiker={selectedHiker} />}
                {activeTab === 'contacts' && (
                  <EmergencyContactsPanel
                    hiker={selectedHiker}
                    onSave={handleContactSave}
                  />
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
