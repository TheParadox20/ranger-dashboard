'use client';

import { useState } from 'react';
import { Search, Heart, Mountain, Footprints } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { Badge, StatusDot } from './ui/badge';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

const STATUS_LABELS = {
  active:  'Active',
  resting: 'Resting',
  warning: 'Warning',
  sos:     'SOS',
  offline: 'Offline',
};

const FILTER_OPTS = ['all', 'active', 'resting', 'warning', 'sos', 'offline'];

export default function HikerSidebar({
  hikers,
  selectedId,
  onSelect,
  connectionState = 'idle',
  connectedUsers = 0,
}) {
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('all');

  const visible = hikers.filter(h => {
    const matchFilter = filter === 'all' || h.status === filter;
    const matchQuery  = h.name.toLowerCase().includes(query.toLowerCase()) ||
                        h.group.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Search */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder="Search hikers or groups…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-1 flex-wrap">
          {FILTER_OPTS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold transition-colors',
                filter === f
                  ? 'bg-accent/20 text-accent-bright border border-accent/40'
                  : 'text-muted hover:text-secondary border border-transparent',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-1">
        <div className="h-px bg-border" />
      </div>

      {/* Hiker list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {visible.length === 0 && (
          <p className="text-center text-muted text-xs py-8">No hikers match filter</p>
        )}
        {visible.map(h => (
          <button
            key={h.id}
            onClick={() => onSelect(h.id)}
            className={cn(
              'w-full text-left rounded-lg px-3 py-2.5 transition-colors duration-150',
              'border',
              selectedId === h.id
                ? 'bg-panel border-accent/40 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.1)]'
                : 'bg-transparent border-transparent hover:bg-panel hover:border-border',
            )}
          >
            <div className="flex items-start gap-2.5">
              <Avatar initials={h.avatar} status={h.status} size="sm" className="mt-0.5" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium text-primary truncate">{h.name}</span>
                  <Badge variant={h.status}>{STATUS_LABELS[h.status]}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-muted">{h.group}</span>
                  <span className="text-[10px] text-muted">·</span>
                  <span className="text-[10px] text-muted">{h.lastUpdate}</span>
                </div>

                {h.status !== 'offline' && (
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-hr">
                      <Heart size={9} />
                      {h.currentStats.heartRate} bpm
                    </span>
                    <span className="flex items-center gap-1 text-elev">
                      <Mountain size={9} />
                      {h.currentStats.elevation.toLocaleString()} m
                    </span>
                    <span className="flex items-center gap-1 text-step">
                      <Footprints size={9} />
                      {(h.currentStats.steps / 1000).toFixed(1)}k
                    </span>
                  </div>
                )}

                {h.status === 'offline' && (
                  <p className="text-[10px] text-muted mt-1">Signal lost · Last seen {h.lastUpdate}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer count */}
      <div className="px-4 py-2.5 border-t border-border bg-base/40">
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest">
          {visible.length} / {hikers.length} hikers shown
        </p>
        <p className="mt-1 text-[10px] font-mono text-muted uppercase tracking-widest">
          Socket {connectionState} · {connectedUsers} connected
        </p>
      </div>
    </aside>
  );
}
