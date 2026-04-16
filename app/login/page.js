'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email,     setEmail]    = useState('');
  const [password,  setPassword] = useState('');
  const [showPass,  setShowPass] = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter credentials.'); return; }
    setLoading(true);
    // Simulate auth (replace with real auth)
    await new Promise(r => setTimeout(r, 1400));
    if (password.length < 6) {
      setError('Invalid credentials. Try ranger / password123');
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="topo-bg scanlines relative min-h-screen flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 border-r border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent/20 border border-accent/40 flex items-center justify-center">
            <Shield size={16} className="text-accent-bright" />
          </div>
          <span className="font-display font-bold text-lg uppercase tracking-[0.2em] text-primary">
            Ranger Command
          </span>
        </div>

        <div className="space-y-6">
          {/* Mountain SVG illustration */}
          <svg viewBox="0 0 380 200" className="w-full opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="0,200 60,120 110,155 180,60 250,130 310,95 380,200"
              stroke="#22c55e" strokeWidth="1.5" fill="#22c55e08" />
            <polyline points="0,200 40,150 100,180 160,90 230,160 290,110 380,200"
              stroke="#60a5fa" strokeWidth="1" fill="#60a5fa05" />
            <circle cx="180" cy="60" r="3" fill="#22c55e" />
            <circle cx="310" cy="95" r="3" fill="#f59e0b" />
            <circle cx="110" cy="155" r="3" fill="#60a5fa" />
            {/* Contour lines */}
            {[140, 160, 175, 188].map((y, i) => (
              <line key={i} x1="0" y1={y} x2="380" y2={y}
                stroke="#1a2e44" strokeWidth="0.5" strokeDasharray="4 8" />
            ))}
          </svg>

          <div>
            <h1 className="font-display font-bold text-4xl uppercase tracking-[0.15em] text-primary leading-tight">
              Field Operations
              <br />
              <span className="text-accent-bright">Command Center</span>
            </h1>
            <p className="mt-4 text-secondary text-sm leading-relaxed max-w-sm">
              Real-time hiker monitoring for mountain rangers. Track health vitals,
              GPS paths, and manage emergency contacts from basecamp.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active Hikers', value: '5' },
              { label: 'Trail Distance', value: '47km' },
              { label: 'Elevation Max', value: '4,150m' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface/60 border border-border/60 rounded-lg p-3 text-center">
                <div className="font-mono text-xl font-bold text-accent-bright">{value}</div>
                <div className="text-[10px] text-muted mt-0.5 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted text-xs font-mono">
          © 2026 Ranger Command · Secure Field Operations Platform
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Shield size={16} className="text-accent-bright" />
            </div>
            <span className="font-display font-bold text-lg uppercase tracking-[0.2em] text-primary">
              Ranger Command
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl uppercase tracking-[0.15em] text-primary">
              Authenticate
            </h2>
            <p className="text-secondary text-sm mt-1">Enter ranger credentials to access dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted uppercase tracking-widest">
                Ranger ID / Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ranger@basecamp.ke"
                autoComplete="username"
                className="w-full h-11 px-4 rounded-lg bg-surface border border-border text-primary text-sm
                  placeholder:text-muted outline-none
                  focus:border-accent/60 focus:ring-2 focus:ring-accent/15
                  transition-all duration-150"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted uppercase tracking-widest">
                Access Code
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-12 rounded-lg bg-surface border border-border text-primary text-sm
                    placeholder:text-muted outline-none
                    focus:border-accent/60 focus:ring-2 focus:ring-accent/15
                    transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg font-display font-bold text-sm uppercase tracking-[0.15em]
                bg-accent text-white
                hover:bg-accent-bright active:scale-[0.98]
                disabled:opacity-60 disabled:pointer-events-none
                transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <Shield size={15} />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-[11px] text-muted text-center font-mono">
              Demo credentials — any email + 6+ char password
            </p>
            <div className="mt-2 bg-panel border border-border/60 rounded-lg px-3 py-2 text-center">
              <span className="text-[10px] font-mono text-secondary">
                ranger@basecamp.ke / password123
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
