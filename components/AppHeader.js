import { Shield, Radio, AlertTriangle, Clock } from 'lucide-react';
import { SUMMARY } from '@/lib/dummy-data';

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

export default function AppHeader() {
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
        <span className="text-muted text-xs font-mono hidden sm:inline">v2.1.0</span>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Status pills */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-active">
          <span className="w-1.5 h-1.5 rounded-full bg-active animate-pulse" />
          {SUMMARY.active} Active
        </span>
        <span className="flex items-center gap-1.5 text-resting">
          <span className="w-1.5 h-1.5 rounded-full bg-resting" />
          {SUMMARY.resting} Resting
        </span>
        {SUMMARY.warning > 0 && (
          <span className="flex items-center gap-1.5 text-warning">
            <AlertTriangle size={11} />
            {SUMMARY.warning} Warning
          </span>
        )}
        {SUMMARY.sos > 0 && (
          <span className="flex items-center gap-1.5 text-danger font-bold animate-pulse">
            <Radio size={11} />
            {SUMMARY.sos} SOS
          </span>
        )}
        <span className="text-muted">{SUMMARY.offline} Offline</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-secondary text-xs">
          <Radio size={12} className="text-accent-bright animate-pulse" />
          <span className="font-mono">LIVE</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-secondary text-xs">
          <Clock size={12} />
          <LiveClock />
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent/20 border border-accent/40 flex items-center justify-center">
            <span className="text-[10px] font-bold font-display text-accent-bright">R</span>
          </div>
          <span className="text-xs text-secondary hidden sm:inline">Ranger HQ</span>
        </div>
      </div>
    </header>
  );
}
