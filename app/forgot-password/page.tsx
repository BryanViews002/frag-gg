'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile/edit`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="frag-card-static p-8">
          {sent ? (
            <div className="text-center animate-scale-in">
              <div className="flex justify-center mb-4">
                <CheckCircle size={56} style={{ color: 'var(--neon-green)', filter: 'drop-shadow(0 0 12px rgba(0,255,135,0.5))' }} />
              </div>
              <h2 className="font-rajdhani font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>Check Your Inbox</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                We sent a password reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
              <Link href="/login" className="btn-ghost justify-center w-full">
                <ArrowLeft size={15} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-2 mb-6" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
              <h2 className="font-rajdhani font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>Reset Password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{error}</p>}
                <div>
                  <label className="frag-input-label">Email Address</label>
                  <div className="relative group text-muted focus-within:text-accent transition-colors">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'currentColor' }} />
                    <input id="forgot-email" type="email" className="frag-input pl-9" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <button id="forgot-submit" type="submit" className="btn-accent w-full justify-center py-3 active:scale-[0.98] transition-transform" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
