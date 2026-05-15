'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Heart, Users } from 'lucide-react';
import { HIKERS } from '@/lib/dummy-data';
import AppHeader from '@/components/AppHeader';
import HikerSidebar from '@/components/HikerSidebar';
import HealthPanel from '@/components/HealthPanel';
import EmergencyContactsPanel from '@/components/EmergencyContactsPanel';
import useDashboardWebSocket from '@/hooks/useDashboardWebSocket';
import { cn } from '@/lib/utils';

// Load Mapbox client-side only (browser API)
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

function appendHistory(arr, val) {
  const next = [...(arr ?? []), val];
  return next.length > HISTORY_MAX ? next.slice(-HISTORY_MAX) : next;
}

export default function DashboardPage() {
  const [hikers,     setHikers]     = useState(HIKERS);
  const [selectedId, setSelectedId] = useState(HIKERS[0].id);
  const [activeTab,  setActiveTab]  = useState('vitals');

  const { connectedUsers, connectionState, serialData, sendJson } = useDashboardWebSocket();

  const selectedHiker = useMemo(
    () => hikers.find(h => h.id === selectedId) ?? null,
    [hikers, selectedId],
  );

  useEffect(() => {
    if (connectionState !== 'open') return;
    sendJson({ type: 'setup', data: { client: 'ranger-dashboard' } });
  }, [connectionState, sendJson]);

  // Map live serial data to H001
  useEffect(() => {
    if (!serialData) return;

    const { noFinger, bpm, spo2, spo2Valid, skin, gsr, rssi, snr, temp, lat, lon } = serialData;

    setHikers(prev => prev.map(h => {
      if (h.id !== 'H001') return h;

      const newStatus = (noFinger || bpm === 0)
        ? h.status
        : bpm > 120 || bpm < 45 || (spo2Valid && spo2 > 0 && spo2 < 90)
          ? 'warning'
          : 'active';

      return {
        ...h,
        lastUpdate: 'Live',
        status: newStatus,
        location: (lat !== 0 || lon !== 0) ? { lat, lng: lon } : h.location,
        currentStats: {
          ...h.currentStats,
          heartRate:   (noFinger || bpm === 0) ? h.currentStats.heartRate : bpm,
          oxygenSat:   (!noFinger && spo2Valid && spo2 > 0) ? spo2 : h.currentStats.oxygenSat,
          temperature: skin,
          ambientTemp: temp,
          gsr,
          rssi,
          snr,
          noFinger,
          spo2Valid,
        },
        heartRateHistory: (noFinger || bpm === 0)
          ? h.heartRateHistory
          : appendHistory(h.heartRateHistory, bpm),
        oxygenSatHistory: (noFinger || !spo2Valid)
          ? h.oxygenSatHistory
          : appendHistory(h.oxygenSatHistory, spo2),
        gsrHistory:      appendHistory(h.gsrHistory ?? [], gsr),
        skinTempHistory: appendHistory(h.skinTempHistory ?? [], skin),
        rssiHistory:     appendHistory(h.rssiHistory ?? [], rssi),
      };
    }));
  }, [serialData]);

  const handleSelect = (id) => {
    setSelectedId(id);
    setActiveTab('vitals');
  };

  const handleContactsChange = (hikerId, newContacts) => {
    setHikers(prev =>
      prev.map(h => h.id === hikerId ? { ...h, emergencyContacts: newContacts } : h),
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ── */}
        <HikerSidebar
          hikers={hikers}
          selectedId={selectedId}
          onSelect={handleSelect}
          connectionState={connectionState}
          connectedUsers={connectedUsers}
        />

        {/* ── Map ── */}
        <HikerMap
          hikers={hikers}
          selectedId={selectedId}
          onSelect={handleSelect}
        />

        {/* ── Right panel ── */}
        <aside className="w-80 shrink-0 flex flex-col bg-surface border-l border-border overflow-hidden">
          {/* Hiker header */}
          {selectedHiker && (
            <div className="px-4 pt-3 pb-0 border-b border-border bg-panel/50">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-display ring-2',
                  selectedHiker.status === 'active'  && 'bg-active/15  text-active  ring-active/50',
                  selectedHiker.status === 'resting' && 'bg-resting/15 text-resting ring-resting/50',
                  selectedHiker.status === 'warning' && 'bg-warning/15 text-warning ring-warning/50',
                  selectedHiker.status === 'sos'     && 'bg-danger/15  text-danger  ring-danger/50',
                  selectedHiker.status === 'offline' && 'bg-elevated   text-muted   ring-border',
                )}>
                  {selectedHiker.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{selectedHiker.name}</p>
                  <p className="text-[11px] font-mono text-muted">{selectedHiker.group} · {selectedHiker.id}</p>
                </div>
              </div>

              {/* Tabs */}
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
              <p className="text-muted text-sm">Select a hiker</p>
            </div>
          )}

          {/* Tab content */}
          {selectedHiker && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'vitals' && (
                <HealthPanel hiker={selectedHiker} />
              )}
              {activeTab === 'contacts' && (
                <EmergencyContactsPanel
                  hiker={selectedHiker}
                  onContactsChange={handleContactsChange}
                />
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
