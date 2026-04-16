'use client';

import { useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement,
  Title, Tooltip, Filler,
} from 'chart.js';
import { Heart, Mountain, Wind, Footprints, Thermometer } from 'lucide-react';
import { TIME_LABELS } from '@/lib/dummy-data';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement,
  Title, Tooltip, Filler,
);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: { legend: { display: false }, tooltip: {
    backgroundColor: '#0c1624',
    borderColor: '#1a2e44',
    borderWidth: 1,
    titleColor: '#6e90b3',
    bodyColor: '#dce8f5',
    padding: 10,
    cornerRadius: 8,
  }},
  scales: {
    x: {
      grid: { color: '#1a2e4440' },
      ticks: { color: '#6e90b3', font: { family: 'IBM Plex Mono', size: 9 } },
    },
    y: {
      grid: { color: '#1a2e4440' },
      ticks: { color: '#6e90b3', font: { family: 'IBM Plex Mono', size: 9 } },
    },
  },
};

function makeLineData(data, color) {
  return {
    labels: TIME_LABELS,
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: `${color}20`,
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 4,
      fill: true,
      tension: 0.4,
    }],
  };
}

function StatCard({ icon: Icon, label, value, unit, color, sub }) {
  return (
    <div className={cn(
      'rounded-lg bg-panel border border-border p-3 flex flex-col gap-0.5',
      'hover:border-border-light transition-colors',
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} style={{ color }} />
        <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold font-mono leading-none" style={{ color }}>
          {value ?? '—'}
        </span>
        <span className="text-xs text-muted mb-0.5">{unit}</span>
      </div>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function HealthPanel({ hiker }) {
  if (!hiker) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted text-sm">Select a hiker to view vitals</p>
      </div>
    );
  }

  const { currentStats: s } = hiker;
  const isOffline = hiker.status === 'offline';

  const o2Gauge = {
    datasets: [{
      data: [s.oxygenSat || 0, 100 - (s.oxygenSat || 0)],
      backgroundColor: ['#a78bfa', '#162840'],
      borderWidth: 0,
      borderRadius: 4,
    }],
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {isOffline && (
        <div className="bg-offline/10 border border-offline/30 rounded-lg px-3 py-2 text-xs text-offline">
          Signal lost · Data may be stale
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Heart} label="Heart Rate" color="#ef4444"
          value={s.heartRate || '—'} unit="bpm"
          sub={s.heartRate > 120 ? '⚠ Elevated' : s.heartRate > 0 ? 'Normal range' : undefined}
        />
        <StatCard
          icon={Mountain} label="Elevation" color="#60a5fa"
          value={s.elevation ? s.elevation.toLocaleString() : '—'} unit="m"
        />
        <StatCard
          icon={Wind} label="O₂ Sat" color="#a78bfa"
          value={s.oxygenSat || '—'} unit="%"
          sub={s.oxygenSat < 90 && s.oxygenSat > 0 ? '⚠ Low — acclimatise' : undefined}
        />
        <StatCard
          icon={Footprints} label="Steps" color="#22c55e"
          value={s.steps ? s.steps.toLocaleString() : '—'} unit=""
        />
      </div>

      {s.temperature > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-panel border border-border text-xs font-mono">
          <Thermometer size={12} className="text-warning" />
          <span className="text-muted">Body Temp</span>
          <span className="text-warning font-semibold ml-auto">{s.temperature}°C</span>
        </div>
      )}

      {/* Heart Rate chart */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Heart Rate (bpm)</span>
        </div>
        <div className="p-3 h-28">
          <Line
            data={makeLineData(hiker.heartRateHistory, '#ef4444')}
            options={{
              ...CHART_DEFAULTS,
              scales: {
                ...CHART_DEFAULTS.scales,
                y: { ...CHART_DEFAULTS.scales.y, min: 50, suggestedMax: 160 },
              },
            }}
          />
        </div>
      </div>

      {/* Elevation chart */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Elevation Profile (m)</span>
        </div>
        <div className="p-3 h-28">
          <Line
            data={makeLineData(hiker.elevationHistory, '#60a5fa')}
            options={CHART_DEFAULTS}
          />
        </div>
      </div>

      {/* O2 + Steps side by side */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-panel border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">O₂ Sat</span>
          </div>
          <div className="p-3 h-28 flex items-center justify-center">
            <div className="relative w-24 h-24">
              <Doughnut
                data={o2Gauge}
                options={{
                  cutout: '72%',
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  animation: { duration: 400 },
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold font-mono text-oxy">
                  {s.oxygenSat ? `${s.oxygenSat}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-panel border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Steps</span>
          </div>
          <div className="p-3 h-28">
            <Bar
              data={{
                labels: TIME_LABELS.slice(-6),
                datasets: [{
                  data: hiker.stepsHistory.slice(-6),
                  backgroundColor: '#22c55e30',
                  borderColor: '#22c55e',
                  borderWidth: 1.5,
                  borderRadius: 3,
                }],
              }}
              options={{ ...CHART_DEFAULTS, scales: {
                x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 0 } },
                y: { ...CHART_DEFAULTS.scales.y },
              }}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
