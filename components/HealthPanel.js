'use client';

import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement,
  Title, Tooltip, Filler,
} from 'chart.js';
import { Heart, Mountain, Wind, Footprints, Thermometer, Activity, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement,
  Title, Tooltip, Filler,
);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300 },
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

// Generate relative-time axis labels: live data uses seconds, dummy uses hours
function generateLabels(length, intervalSecs) {
  return Array.from({ length }, (_, i) => {
    const secsAgo = (length - 1 - i) * intervalSecs;
    if (secsAgo === 0) return 'Now';
    if (intervalSecs >= 3600) return `-${Math.floor(secsAgo / 3600)}h`;
    const mins = Math.floor(secsAgo / 60);
    return mins > 0 ? `-${mins}m` : `-${secsAgo}s`;
  });
}

function makeLineData(data, color, isLive = false) {
  return {
    labels: generateLabels(data.length, isLive ? 10 : 3600),
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

// Mini signal-strength bars (wifi-style)
function SignalBars({ rssi }) {
  const level = rssi >= -50 ? 5 : rssi >= -60 ? 4 : rssi >= -70 ? 3 : rssi >= -80 ? 2 : 1;
  const color = level >= 4 ? '#22c55e' : level === 3 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-end gap-0.75">
      {[1, 2, 3, 4, 5].map(b => (
        <div
          key={b}
          className="rounded-sm transition-colors"
          style={{
            height: `${b * 3 + 2}px`,
            width: '4px',
            backgroundColor: b <= level ? color : '#1a2e44',
          }}
        />
      ))}
    </div>
  );
}

function gsrLabel(gsr) {
  if (gsr == null) return null;
  if (gsr < 100) return 'Calm';
  if (gsr < 300) return 'Moderate';
  if (gsr < 600) return '⚠ Elevated';
  return '⚠ High stress';
}

function StatCard({ icon: Icon, label, value, unit, color, sub }) {
  return (
    <div className="rounded-lg bg-panel border border-border p-3 flex flex-col gap-0.5 hover:border-border-light transition-colors">
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

function ChartCard({ title, badge, badgeColor, height = 'h-28', children }) {
  return (
    <div className="bg-panel border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted uppercase tracking-widest">{title}</span>
        {badge && (
          <span className="text-[10px] font-mono" style={{ color: badgeColor }}>{badge}</span>
        )}
      </div>
      <div className={cn('p-3', height)}>{children}</div>
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
  const hasLiveData = (hiker.gsrHistory?.length ?? 0) > 0;

  const o2Gauge = {
    datasets: [{
      data: [s.oxygenSat || 0, 100 - (s.oxygenSat || 0)],
      backgroundColor: ['#a78bfa', '#162840'],
      borderWidth: 0,
      borderRadius: 4,
    }],
  };

  const gsrStatus = gsrLabel(s.gsr);
  const gsrColor = s.gsr >= 600 ? '#ef4444' : s.gsr >= 300 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">

      {/* ── Status banners ── */}
      {isOffline && (
        <div className="bg-offline/10 border border-offline/30 rounded-lg px-3 py-2 text-xs text-offline">
          Signal lost · Data may be stale
        </div>
      )}
      {s.noFinger && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 text-xs text-warning flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning animate-pulse shrink-0" />
          Sensor not on finger · Biometrics paused
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Heart} label="Heart Rate" color="#ef4444"
          value={s.heartRate || '—'} unit="bpm"
          sub={s.heartRate > 120 ? '⚠ Elevated' : s.heartRate > 0 ? 'Normal range' : undefined}
        />
        <StatCard
          icon={Wind} label="SpO₂" color="#a78bfa"
          value={s.oxygenSat || '—'} unit={s.oxygenSat ? '%' : ''}
          sub={
            s.spo2Valid === false ? 'Low confidence' :
            s.oxygenSat < 90 && s.oxygenSat > 0 ? '⚠ Low — acclimatise' :
            undefined
          }
        />

        {hasLiveData ? (
          <>
            <StatCard
              icon={Thermometer} label="Skin Temp" color="#f97316"
              value={s.temperature > 0 ? s.temperature.toFixed(1) : '—'} unit="°C"
              sub={s.temperature > 37.5 ? '⚠ Elevated' : s.temperature > 0 ? 'Normal' : undefined}
            />
            <StatCard
              icon={Activity} label="GSR · Stress" color={gsrColor}
              value={s.gsr ?? '—'} unit="μS"
              sub={gsrStatus}
            />
          </>
        ) : (
          <>
            <StatCard
              icon={Mountain} label="Elevation" color="#60a5fa"
              value={s.elevation ? s.elevation.toLocaleString() : '—'} unit="m"
            />
            <StatCard
              icon={Footprints} label="Steps" color="#22c55e"
              value={s.steps ? s.steps.toLocaleString() : '—'} unit=""
            />
          </>
        )}
      </div>

      {/* ── Signal quality + ambient temp strip (live only) ── */}
      {hasLiveData && s.rssi !== undefined && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-panel border border-border text-xs font-mono">
          <Signal size={11} className="text-muted shrink-0" />
          <SignalBars rssi={s.rssi} />
          <span className="text-secondary">{s.rssi} dBm</span>
          <span className="text-border mx-0.5">·</span>
          <span className="text-muted">SNR</span>
          <span className="text-secondary ml-0.5">{s.snr} dB</span>
          {s.ambientTemp > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <Thermometer size={10} className="text-muted" />
              <span className="text-secondary">{s.ambientTemp.toFixed(1)}°C amb</span>
            </div>
          )}
        </div>
      )}

      {/* ── Body temp strip (dummy/non-live hikers only) ── */}
      {!hasLiveData && s.temperature > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-panel border border-border text-xs font-mono">
          <Thermometer size={12} className="text-warning" />
          <span className="text-muted">Body Temp</span>
          <span className="text-warning font-semibold ml-auto">{s.temperature}°C</span>
        </div>
      )}

      {/* ── Heart Rate chart ── */}
      <ChartCard title="Heart Rate (bpm)">
        <Line
          data={makeLineData(hiker.heartRateHistory, '#ef4444', hasLiveData)}
          options={{
            ...CHART_DEFAULTS,
            scales: {
              ...CHART_DEFAULTS.scales,
              y: { ...CHART_DEFAULTS.scales.y, min: 50, suggestedMax: 160 },
            },
          }}
        />
      </ChartCard>

      {/* ── GSR trend (live) or Elevation profile (dummy) ── */}
      {hasLiveData ? (
        <ChartCard
          title="GSR · Stress (μS)"
          badge={gsrStatus}
          badgeColor={gsrColor}
        >
          <Line
            data={makeLineData(hiker.gsrHistory, '#f59e0b', true)}
            options={{
              ...CHART_DEFAULTS,
              scales: {
                ...CHART_DEFAULTS.scales,
                y: { ...CHART_DEFAULTS.scales.y, min: 0 },
              },
            }}
          />
        </ChartCard>
      ) : (
        <ChartCard title="Elevation Profile (m)">
          <Line data={makeLineData(hiker.elevationHistory, '#60a5fa')} options={CHART_DEFAULTS} />
        </ChartCard>
      )}

      {/* ── SpO₂ gauge + Skin Temp trend (live) or Steps bar (dummy) ── */}
      <div className="grid grid-cols-2 gap-2">
        <ChartCard title="SpO₂">
          <div className="h-full flex items-center justify-center">
            <div className="relative w-24 h-24">
              <Doughnut
                data={o2Gauge}
                options={{
                  cutout: '72%',
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  animation: { duration: 400 },
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-sm font-bold font-mono text-oxy leading-none">
                  {s.oxygenSat ? `${s.oxygenSat}%` : '—'}
                </span>
                {s.noFinger && (
                  <span className="text-[8px] font-mono text-warning leading-none">stale</span>
                )}
              </div>
            </div>
          </div>
        </ChartCard>

        {hasLiveData ? (
          <ChartCard title="Skin Temp (°C)">
            <Line
              data={makeLineData(hiker.skinTempHistory ?? [], '#f97316', true)}
              options={{
                ...CHART_DEFAULTS,
                scales: {
                  ...CHART_DEFAULTS.scales,
                  y: { ...CHART_DEFAULTS.scales.y, min: 20, suggestedMax: 40 },
                },
              }}
            />
          </ChartCard>
        ) : (
          <ChartCard title="Steps">
            <Bar
              data={{
                labels: generateLabels(Math.min(6, hiker.stepsHistory.length), 3600),
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
          </ChartCard>
        )}
      </div>

      {/* ── RSSI signal history (live only) ── */}
      {hasLiveData && (hiker.rssiHistory?.length ?? 0) > 1 && (
        <ChartCard title="Signal Strength (dBm)" height="h-20">
          <Line
            data={makeLineData(hiker.rssiHistory, '#60a5fa', true)}
            options={{
              ...CHART_DEFAULTS,
              animation: { duration: 0 },
              scales: {
                ...CHART_DEFAULTS.scales,
                y: {
                  ...CHART_DEFAULTS.scales.y,
                  reverse: true,
                  suggestedMin: -90,
                  suggestedMax: -30,
                },
              },
            }}
          />
        </ChartCard>
      )}
    </div>
  );
}
