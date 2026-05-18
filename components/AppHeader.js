'use client';

import Link from 'next/link';
import { Shield, Radio, AlertTriangle, Clock, Settings } from 'lucide-react';

const EMPTY_SUMMARY = { active: 0, resting: 0, warning: 0, sos: 0, offline: 0 };

const selectCls =
  'h-7 px-2 rounded bg-elevated border border-border text-primary text-xs outline-none focus:border-accent/60 transition-colors max-w-[200px]';

function LiveClock() {
  // Static time for SSR — client hydrates immediately
  return (
    <span className="font-mono text-sm text-secondary tabular-nums" suppressHydrationWarning>
      {typeof window !== 'undefined'
        ? new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '--:--:--'}
    </span>
  );
}

export default function AppHeader({
  summary = EMPTY_SUMMARY,
  sessions = [],
  selectedSessionId = '',
  onSelectSession,
}) {
  return (
    <header className="flex-shrink-0 h-12 bg-surface border-b border-border flex items-center px-4 gap-4 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
          <Shield size={14} className="text-accent-bright" />
        </div>
        <span className="font-display font-bold text-base uppercase tracking-widest text-primary whitespace-nowrap">
          Ranger Command
        </span>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Session selector */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-mono text-muted uppercase tracking-widest hidden md:inline">
          Session
        </span>
        <select
          className={selectCls}
          value={selectedSessionId}
          onChange={(e) => onSelectSession?.(e.target.value)}
          disabled={sessions.length === 0}
        >
          {sessions.length === 0 && <option value="">No sessions</option>}
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.status === 'active' ? '· active' : '· ended'}
            </option>
          ))}
        </select>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Status pills */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-active">
          <span className="w-1.5 h-1.5 rounded-full bg-active animate-pulse" />
          {summary.active} Active
        </span>
        <span className="flex items-center gap-1.5 text-resting">
          <span className="w-1.5 h-1.5 rounded-full bg-resting" />
          {summary.resting} Resting
        </span>
        {summary.warning > 0 && (
          <span className="flex items-center gap-1.5 text-warning">
            <AlertTriangle size={11} />
            {summary.warning} Warning
          </span>
        )}
        {summary.sos > 0 && (
          <span className="flex items-center gap-1.5 text-danger font-bold animate-pulse">
            <Radio size={11} />
            {summary.sos} SOS
          </span>
        )}
        <span className="text-muted">{summary.offline} Offline</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/sessions"
          className="flex items-center gap-1.5 text-secondary hover:text-primary text-xs transition-colors"
        >
          <Settings size={12} />
          <span className="hidden sm:inline">Manage</span>
        </Link>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-secondary text-xs">
          <Radio size={12} className="text-accent-bright animate-pulse" />
          <span className="font-mono">LIVE</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-secondary text-xs">
          <Clock size={12} />
          <LiveClock />
        </div>
      </div>
    </header>
  );
}
