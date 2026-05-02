'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import { Eye, EyeOff, Check, X, User, Mail, Lock, Gamepad2, Hash, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ParticleCanvas = dynamic(() => import('@/components/canvas/ParticleCanvas'), { ssr: false });

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#FF4500', '#FF8C00', '#FFD700', '#00FF87'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : 'var(--border)' }} />
        ))}
      </div>
      {password && (
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {checks.map(c => (
            <span key={c.label} className="flex items-center gap-1 text-xs"
              style={{ color: c.ok ? 'var(--neon-green)' : 'var(--text-muted)' }}>
              {c.ok ? <Check size={10} /> : <X size={10} />} {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    ingameName: '', ingameUid: '', acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real-time username check
  useEffect(() => {
    if (!form.username || form.username.length < 3) { setUsernameStatus('idle'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('users').select('id').eq('username', form.username).maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [form.username]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (usernameStatus === 'taken') e.username = 'Username already taken';
    if (!form.email) e.email = 'Email is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.ingameName.trim()) e.ingameName = 'In-game name is required';
    if (!form.ingameUid.trim()) e.ingameUid = 'In-game UID is required';
    if (!form.acceptTerms) e.terms = 'You must accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Pass all registration fields in metadata so the DB trigger can use them
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: form.username,
            ingame_name: form.ingameName.trim(),
            ingame_uid: form.ingameUid.trim(),
          },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      // Attempt to insert the profile row directly
      // If this fails (e.g. email not confirmed yet), the trigger or onboarding upsert will handle it
      await supabase.from('users').insert({
        id: data.user.id,
        username: form.username,
        email: form.email,
        ingame_name: form.ingameName.trim(),
        ingame_uid: form.ingameUid.trim(),
        onboarding_complete: false,
        reputation_score: 100,
        is_admin: false,
      });
      // Note: we intentionally don't throw on profileError here —
      // the auto-trigger will create the row if this insert fails

      toast.success('Account created! Setting up your profile...');
      router.push('/onboarding');
    } catch (err: any) {
      const msg = err?.message ?? 'Registration failed';
      if (msg.includes('already registered')) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12">
        <ParticleCanvas />
        <div className="relative z-10 text-center">
          <h1 className="font-rajdhani font-bold text-6xl hero-title-glow mb-4">FRAG.GG</h1>
          <p className="font-rajdhani font-semibold text-xl mb-12" style={{ color: 'var(--text-secondary)' }}>
            Compete. Dominate. Get Recognized.
          </p>
          <div className="space-y-5 text-left">
            {[
              { icon: <Gamepad2 size={20} />, text: 'All CODM modes — MP & Battle Royale' },
              { icon: <User size={20} />, text: 'Build your competitive profile & reputation' },
              { icon: <Check size={20} />, text: '100% free. No pay-to-win. Just skill.' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.2)' }}>
                <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-rajdhani font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>Create Account</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Already have one? <Link href="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="frag-input-label">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="reg-username"
                  type="text"
                  className="frag-input pl-9 pr-9"
                  placeholder="your_tag"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  style={{ borderColor: errors.username ? 'var(--accent)' : undefined }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-accent animate-spin" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />}
                  {usernameStatus === 'available' && <Check size={15} style={{ color: 'var(--neon-green)' }} />}
                  {usernameStatus === 'taken' && <X size={15} style={{ color: 'var(--accent)' }} />}
                </div>
              </div>
              {usernameStatus === 'available' && <p style={{ color: 'var(--neon-green)', fontSize: '0.78rem', marginTop: '0.25rem' }}>✓ Username available</p>}
              {errors.username && <p style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="frag-input-label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-email" type="email" className="frag-input pl-9" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  style={{ borderColor: errors.email ? 'var(--accent)' : undefined }} />
              </div>
              {errors.email && <p style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="frag-input-label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} className="frag-input pl-9 pr-9"
                  placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)}
                  style={{ borderColor: errors.password ? 'var(--accent)' : undefined }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && <p style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="frag-input-label">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} className="frag-input pl-9 pr-9"
                  placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  style={{ borderColor: errors.confirmPassword ? 'var(--accent)' : undefined }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword &&
                <p style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: '0.25rem' }}>Passwords do not match</p>}
              {form.confirmPassword && form.password === form.confirmPassword && form.password &&
                <p style={{ color: 'var(--neon-green)', fontSize: '0.78rem', marginTop: '0.25rem' }}>✓ Passwords match</p>}
            </div>

            {/* Divider */}
            <div className="pt-2 pb-1">
              <div className="flex items-center gap-3">
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>CODM IDENTITY</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            </div>

            {/* In-Game Name */}
            <div>
              <label className="frag-input-label flex items-center gap-1">
                Your CODM Display Name
                <span className="required-asterisk">*</span>
              </label>
              <div className="relative">
                <Gamepad2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-ingame-name" type="text" className="frag-input pl-9"
                  placeholder="ExactCODMDisplayName"
                  value={form.ingameName} onChange={e => set('ingameName', e.target.value)}
                  style={{ borderColor: errors.ingameName ? 'var(--accent)' : undefined }} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                Enter your exact in-game name as it appears in CODM
              </p>
              {errors.ingameName && <p style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.ingameName}</p>}
            </div>

            {/* In-Game UID */}
            <div>
              <label className="frag-input-label flex items-center gap-1">
                Your CODM Player UID
                <span className="required-asterisk">*</span>
              </label>
              <div className="relative">
                <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input id="reg-ingame-uid" type="text" className="frag-input pl-9"
                  placeholder="e.g. 12345678"
                  value={form.ingameUid} onChange={e => set('ingameUid', e.target.value)}
                  style={{ borderColor: errors.ingameUid ? 'var(--accent)' : undefined }} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                Find your UID in CODM → Profile → tap your ID
              </p>
              {errors.ingameUid && <p style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{errors.ingameUid}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                id="reg-terms"
                onClick={() => set('acceptTerms', !form.acceptTerms)}
                className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: form.acceptTerms ? 'var(--accent)' : 'transparent',
                  border: `2px solid ${form.acceptTerms ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {form.acceptTerms && <Check size={12} color="white" />}
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                I agree to the <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms of Service</span> and fair play rules.
                I understand that cheating will result in a permanent ban.
              </span>
            </div>
            {errors.terms && <p style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>{errors.terms}</p>}

            {/* Submit */}
            <button id="reg-submit" type="submit" className="btn-accent w-full justify-center py-3 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
