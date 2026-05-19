'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Crosshair,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import TacticalBackdrop from '@/components/visuals/TacticalBackdrop';

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Verified player profiles',
    description: 'Keep brackets cleaner with sign-ins tied to real CODM identities.',
  },
  {
    icon: Users,
    title: 'Squad building without chaos',
    description: 'Find teammates, lock rosters, and show up ready for match time.',
  },
  {
    icon: Trophy,
    title: 'Tournament flow that feels premium',
    description: 'From registration to result proof, everything stays sharp and fast.',
  },
];

const OPS_ROWS = [
  { label: 'Open brackets', value: '18', detail: 'MP, BR, and late-night scrims' },
  { label: 'Queued squads', value: '247', detail: 'Players actively looking for matches' },
  { label: 'Result checks', value: '96%', detail: 'Proof-first moderation this week' },
];

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message === 'Invalid login credentials' ? 'Incorrect email or password.' : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <TacticalBackdrop variant="auth" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex flex-col justify-between px-8 py-12 xl:px-14">
          <div className="max-w-xl">
            <div className="section-label">
              <Swords size={11} /> Match-ready platform
            </div>

            <h1
              className="font-rajdhani font-bold leading-[0.94]"
              style={{ fontSize: 'clamp(3.6rem, 7vw, 6.2rem)', letterSpacing: '-0.04em' }}
            >
              Sign in to a platform that feels built for real competition.
            </h1>

            <p
              className="mt-5 max-w-lg font-space-grotesk"
              style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.8 }}
            >
              FRAG.GG is built for brackets, squads, and proof-driven match ops, with a tactical HUD aesthetic
              that actually fits competitive play.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="signal-chip signal-chip-live">Live queue</span>
              <span className="signal-chip">CODM focused</span>
              <span className="signal-chip">No pay-to-win fluff</span>
            </div>

            <div className="mt-10 grid gap-4">
              {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="slant-panel p-5">
                  <div className="relative z-10 flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{
                        background: 'rgba(255,69,0,0.1)',
                        border: '1px solid rgba(255,69,0,0.16)',
                        color: 'var(--accent)',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-rajdhani text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {title}
                      </p>
                      <p className="mt-1 font-inter text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="slant-panel max-w-xl p-6">
            <div className="relative z-10">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="signal-kicker">Tonight&apos;s match ops</p>
                  <h2 className="mt-2 font-rajdhani text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Queue status: active
                  </h2>
                </div>
                <span className="signal-chip signal-chip-live">Live</span>
              </div>

              {OPS_ROWS.map((row) => (
                <div key={row.label} className="signal-row">
                  <div>
                    <p className="font-space-grotesk text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {row.label}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {row.detail}
                    </p>
                  </div>
                  <div className="font-orbitron text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10 xl:px-14">
          <div className="w-full max-w-xl">
            <div className="mb-6 lg:hidden">
              <div className="section-label">
                <Crosshair size={11} /> Sign in
              </div>
              <h1 className="font-rajdhani text-5xl font-bold leading-none hero-title-glow">Enter match ops</h1>
              <p className="mt-3 max-w-md font-space-grotesk text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                Better visual direction, cleaner route setup, same fast path back into your squad.
              </p>
            </div>

            <div className="slant-panel p-6 sm:p-8">
              <div className="relative z-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p className="signal-kicker">Welcome back</p>
                    <h2 className="mt-2 font-rajdhani text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      Sign in
                    </h2>
                    <p className="mt-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                      New to FRAG.GG?{' '}
                      <Link href="/register" style={{ color: 'var(--accent)' }}>
                        Create your account
                      </Link>
                    </p>
                  </div>

                  <Link href="/" className="hidden sm:inline-flex signal-chip">
                    Home <ArrowRight size={12} />
                  </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div
                      aria-live="polite"
                      className="rounded-2xl px-4 py-3 text-sm"
                      style={{
                        background: 'rgba(255,69,0,0.08)',
                        border: '1px solid rgba(255,69,0,0.22)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="login-email" className="frag-input-label">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        className="frag-input pl-9"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        aria-invalid={Boolean(error)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label htmlFor="login-password" className="frag-input-label mb-0">
                        Password
                      </label>
                      <Link href="/forgot-password" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className="frag-input pl-9 pr-11"
                        placeholder="Your password"
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                        aria-invalid={Boolean(error)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <label
                      htmlFor="login-remember"
                      className="flex items-center gap-3 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <input
                        id="login-remember"
                        type="checkbox"
                        checked={form.remember}
                        onChange={(e) => setForm((prev) => ({ ...prev, remember: e.target.checked }))}
                        className="h-4 w-4 rounded border"
                        style={{ accentColor: 'var(--accent)', borderColor: 'var(--border)' }}
                      />
                      Remember me for faster check-ins
                    </label>

                    <span className="signal-chip">
                      <ShieldCheck size={12} /> Secure auth
                    </span>
                  </div>

                  <button
                    id="login-submit"
                    type="submit"
                    className="btn-accent w-full justify-center py-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Signing In...
                      </span>
                    ) : (
                      <>
                        Enter Dashboard <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div
                  className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-sm"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
                >
                  <span>Need a squad first? Find players after you sign in.</span>
                  <span className="font-space-grotesk" style={{ color: 'var(--text-secondary)' }}>
                    FRAG.GG / AUTH
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
