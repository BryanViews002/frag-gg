'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { Eye, EyeOff, Mail, Lock, Swords, Trophy, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const ParticleCanvas = dynamic(() => import('@/components/canvas/ParticleCanvas'), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;
      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : (err?.message ?? 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12">
        <ParticleCanvas />
        <div className="relative z-10 text-center">
          <Swords size={48} style={{ color: 'var(--accent)', margin: '0 auto 1.5rem' }} />
          <h1 className="font-rajdhani font-bold text-6xl hero-title-glow mb-4">FRAG.GG</h1>
          <p className="font-rajdhani font-semibold text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
            Your arena awaits.
          </p>
          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              { icon: <Trophy size={18} />, text: 'Host & join competitive tournaments' },
              { icon: <Users size={18} />, text: 'Find teammates and build your squad' },
              { icon: <Mail size={18} />, text: 'Track stats, climb the leaderboard' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,69,0,0.06)', border: '1px solid rgba(255,69,0,0.15)' }}>
                <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'Inter', fontSize: '0.9rem' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-rajdhani font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>Sign In</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              New here? <Link href="/register" style={{ color: 'var(--accent)' }}>Create a free account</Link>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid rgba(255,69,0,0.3)' }}>
                <span style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>{error}</span>
              </div>
            )}
            <div>
              <label className="frag-input-label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="login-email" type="email" className="frag-input pl-9" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="frag-input-label mb-0">Password</label>
                <Link href="/forgot-password" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="login-password" type={showPassword ? 'text' : 'password'} className="frag-input pl-9 pr-9"
                  placeholder="Your password" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" id="login-remember" onClick={() => setForm(p => ({ ...p, remember: !p.remember }))}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: form.remember ? 'var(--accent)' : 'transparent', border: `2px solid ${form.remember ? 'var(--accent)' : 'var(--border)'}` }}>
                {form.remember && <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Remember me</span>
            </div>
            <button id="login-submit" type="submit" className="btn-accent w-full justify-center py-3" disabled={loading}>
              {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing In...</span> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
