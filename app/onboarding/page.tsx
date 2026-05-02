'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Check, Upload, ChevronRight, ChevronLeft, Gamepad2, AlertCircle } from 'lucide-react';
import { COUNTRIES, RANKS, ROLES } from '@/types';
import { getRankColor, getAvatarUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

const ConfettiCanvas = dynamic(() => import('@/components/canvas/ConfettiCanvas'), { ssr: false });

const STEPS = ['Profile', 'Gaming', 'Social'];

function RequiredMark() {
  return <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>;
}

function OptionalBadge() {
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em',
      padding: '1px 6px', borderRadius: 4,
      background: 'rgba(139,143,168,0.12)',
      color: 'var(--text-muted)',
      border: '1px solid rgba(139,143,168,0.2)',
      textTransform: 'uppercase',
      fontFamily: 'Inter, sans-serif',
    }}>
      Optional
    </span>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    avatar_url: '', country: '', bio: '',
    rank: '', role: '', preferred_mode: 'both',
    youtube_url: '', tiktok_url: '', twitter_url: '', discord_username: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Fetch existing profile row
      let { data } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

      // If no row yet, auto-create it using auth metadata from registration
      if (!data) {
        const username =
          user.user_metadata?.username ||
          user.email?.split('@')[0] ||
          'player';
        const { data: created } = await supabase.from('users').upsert({
          id: user.id,
          email: user.email || '',
          username,
          ingame_name: user.user_metadata?.ingame_name || 'TBD',
          ingame_uid: user.user_metadata?.ingame_uid || '0000',
          reputation_score: 100,
          is_admin: false,
          onboarding_complete: false,
        }).select().maybeSingle();
        data = created;
      }

      if (data?.onboarding_complete) { router.push('/dashboard'); return; }

      setProfile(data || {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'player',
        ingame_name: user.user_metadata?.ingame_name || 'TBD',
        ingame_uid: user.user_metadata?.ingame_uid || '0000',
      });

      // Pre-populate form with any already-saved data
      if (data) {
        setForm(prev => ({
          ...prev,
          avatar_url: data.avatar_url || '',
          country: data.country || '',
          bio: data.bio || '',
          rank: data.rank || '',
          role: data.role || '',
          preferred_mode: data.preferred_mode || 'both',
          youtube_url: data.youtube_url || '',
          tiktok_url: data.tiktok_url || '',
          twitter_url: data.twitter_url || '',
          discord_username: data.discord_username || '',
        }));
      }
    };
    load();
  }, []);

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    setAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Upload failed: ' + error.message);
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setForm(p => ({ ...p, avatar_url: data.publicUrl + '?t=' + Date.now() }));
      toast.success('Avatar uploaded successfully');
      setErrors(p => { const n = { ...p }; delete n.avatar_url; return n; });
    }
    setAvatarUploading(false);
  };

  // Validate current step before advancing
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!form.avatar_url) newErrors.avatar_url = 'Please upload a profile photo';
      if (!form.country) newErrors.country = 'Please select your country';
      if (!form.bio.trim()) newErrors.bio = 'Please write a short bio';
      if (form.bio.trim().length < 10) newErrors.bio = 'Bio must be at least 10 characters';
    }

    if (currentStep === 1) {
      if (!form.rank) newErrors.rank = 'Please select your current rank';
      if (!form.role) newErrors.role = 'Please select your preferred role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleFinish = async () => {
    if (!validateStep(step)) return;
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('users').upsert({
      id: profile.id,
      email: profile.email || '',
      username: profile.username || 'Player',
      ingame_name: profile.ingame_name || 'TBD',
      ingame_uid: profile.ingame_uid || 'TBD',
      reputation_score: profile.reputation_score ?? 100,
      is_admin: profile.is_admin ?? false,
      avatar_url: form.avatar_url || null,
      country: form.country || null,
      bio: form.bio || null,
      rank: (form.rank as any) || null,
      role: (form.role as any) || null,
      preferred_mode: (form.preferred_mode as any) || 'both',
      youtube_url: form.youtube_url || null,
      tiktok_url: form.tiktok_url || null,
      twitter_url: form.twitter_url || null,
      discord_username: form.discord_username || null,
      onboarding_complete: true,
    });
    setSaving(false);
    if (error) {
      toast.error('Failed to save profile: ' + error.message);
      return;
    }
    toast.success('Profile set up! Welcome to FRAG.GG');
    setShowConfetti(true);
    setDone(true);
    // Hard navigation forces useAuth to reload with fresh onboarding_complete=true
    setTimeout(() => { window.location.href = '/dashboard'; }, 2200);
  };

  const set = (key: string, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <ConfettiCanvas active={showConfetti} />
        <div className="relative z-10 text-center max-w-lg px-4 animate-scale-in">
          <h1 className="font-rajdhani font-bold text-4xl mb-2" style={{ color: 'var(--accent)' }}>
            WELCOME TO FRAG.GG
          </h1>
          <p className="font-rajdhani font-bold text-3xl mb-6" style={{ color: 'var(--text-primary)' }}>
            {profile.username?.toUpperCase()}
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your profile is set up. Time to compete.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[{ label: 'Tournaments', val: 0 }, { label: 'Wins', val: 0 }, { label: 'Rep', val: 100 }].map(s => (
              <div key={s.label} className="frag-card-static p-4 text-center">
                <div className="font-orbitron font-bold text-2xl" style={{ color: 'var(--accent)' }}>{s.val}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn-accent px-8 py-3 text-lg">
            Enter The Arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Step progress */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className={`step-indicator ${i < step ? 'completed' : i === step ? 'active' : 'pending'}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.7rem', color: i === step ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 2, background: i < step ? 'var(--accent)' : 'var(--border)', borderRadius: 1, marginBottom: '1.5rem' }} />
              )}
            </div>
          ))}
        </div>

        <div className="frag-card-static p-8 animate-slide-up">

          {/* STEP 0 — Profile */}
          {step === 0 && (
            <div>
              <h2 className="font-rajdhani font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Set Up Your Profile</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Fields marked <span style={{ color: 'var(--accent)' }}>*</span> are required
              </p>

              {/* Avatar upload */}
              <div className="mb-6">
                <label className="frag-input-label">
                  Profile Photo <RequiredMark />
                </label>
                <div className="flex items-center gap-5 mt-2">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: `2px solid ${errors.avatar_url ? 'var(--accent)' : 'var(--border-accent)'}` }}>
                    <Image
                      src={form.avatar_url || getAvatarUrl(null, profile.username)}
                      alt="Avatar" fill className="object-cover" />
                  </div>
                  <div>
                    <label
                      className="btn-ghost cursor-pointer"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: avatarUploading ? 0.7 : 1, pointerEvents: avatarUploading ? 'none' : 'auto' }}
                    >
                      {avatarUploading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-secondary)', borderTopColor: 'transparent' }} />
                          Uploading...
                        </span>
                      ) : (
                        <><Upload size={13} /> Upload Photo</>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
                    </label>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.4rem' }}>JPG, PNG, GIF up to 2MB</p>
                  </div>
                </div>
                {errors.avatar_url && (
                  <p className="flex items-center gap-1 mt-1" style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>
                    <AlertCircle size={12} /> {errors.avatar_url}
                  </p>
                )}
              </div>

              {/* Country */}
              <div className="mb-4">
                <label className="frag-input-label">Country <RequiredMark /></label>
                <select
                  id="onboard-country"
                  className="frag-input"
                  value={form.country}
                  onChange={e => set('country', e.target.value)}
                  style={{ background: 'var(--bg-secondary)', appearance: 'none', borderColor: errors.country ? 'var(--accent)' : undefined }}
                >
                  <option value="">Select your country...</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
                {errors.country && (
                  <p className="flex items-center gap-1 mt-1" style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>
                    <AlertCircle size={12} /> {errors.country}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="frag-input-label flex items-center justify-between">
                  <span>Bio <RequiredMark /></span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{form.bio.length}/160</span>
                </label>
                <textarea
                  id="onboard-bio"
                  className="frag-input resize-none"
                  rows={3}
                  placeholder="Tell the community about yourself..."
                  maxLength={160}
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  style={{ borderColor: errors.bio ? 'var(--accent)' : undefined }}
                />
                {errors.bio && (
                  <p className="flex items-center gap-1 mt-1" style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>
                    <AlertCircle size={12} /> {errors.bio}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 1 — Gaming */}
          {step === 1 && (
            <div>
              <h2 className="font-rajdhani font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Gaming Preferences</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Fields marked <span style={{ color: 'var(--accent)' }}>*</span> are required
              </p>

              {/* In-game info (locked) */}
              <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.1em' }}>FROM YOUR REGISTRATION</p>
                <div className="flex items-center gap-2">
                  <Gamepad2 size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{profile.ingame_name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>·</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>UID: {profile.ingame_uid}</span>
                </div>
              </div>

              {/* Rank selector */}
              <div className="mb-6">
                <label className="frag-input-label">Current Rank <RequiredMark /></label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Select your current in-game rank</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {RANKS.map(r => {
                    const color = getRankColor(r);
                    const isSelected = form.rank === r;
                    return (
                      <button key={r} onClick={() => set('rank', r)}
                        className="p-3 rounded-xl text-center transition-all"
                        style={{
                          background: isSelected ? `${color}22` : 'var(--bg-secondary)',
                          border: `2px solid ${isSelected ? color : errors.rank ? 'rgba(255,69,0,0.4)' : 'var(--border)'}`,
                          boxShadow: isSelected ? `0 0 12px ${color}44` : 'none',
                        }}>
                        <div style={{ color, fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Rajdhani' }}>{r}</div>
                      </button>
                    );
                  })}
                </div>
                {errors.rank && (
                  <p className="flex items-center gap-1 mt-2" style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>
                    <AlertCircle size={12} /> {errors.rank}
                  </p>
                )}
              </div>

              {/* Preferred Role */}
              <div className="mb-6">
                <label className="frag-input-label">Preferred Role <RequiredMark /></label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => set('role', r)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        background: form.role === r ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                        border: `1px solid ${form.role === r ? 'var(--accent)' : errors.role ? 'rgba(255,69,0,0.4)' : 'var(--border)'}`,
                        color: form.role === r ? 'var(--accent)' : 'var(--text-secondary)',
                        fontFamily: 'Rajdhani',
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
                {errors.role && (
                  <p className="flex items-center gap-1 mt-2" style={{ color: 'var(--accent)', fontSize: '0.78rem' }}>
                    <AlertCircle size={12} /> {errors.role}
                  </p>
                )}
              </div>

              {/* Preferred Mode */}
              <div className="mb-6">
                <label className="frag-input-label">Preferred Mode</label>
                <div className="flex gap-3 mt-2">
                  {[{ id: 'mp', label: 'MP', desc: 'Multiplayer' }, { id: 'br', label: 'BR', desc: 'Battle Royale' }, { id: 'both', label: 'Both', desc: 'All modes' }].map(m => (
                    <button key={m.id} onClick={() => set('preferred_mode', m.id)}
                      className="flex-1 p-3 rounded-xl text-center transition-all"
                      style={{
                        background: form.preferred_mode === m.id ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                        border: `2px solid ${form.preferred_mode === m.id ? 'var(--accent)' : 'var(--border)'}`,
                      }}>
                      <div className="font-rajdhani font-bold" style={{ color: form.preferred_mode === m.id ? 'var(--accent)' : 'var(--text-primary)' }}>{m.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Social */}
          {step === 2 && (
            <div>
              <h2 className="font-rajdhani font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Social Links</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                All social links are optional — share your content with the community
              </p>
              <div className="space-y-4">
                {[
                  { key: 'youtube_url', label: 'YouTube URL', placeholder: 'https://youtube.com/@your_channel' },
                  { key: 'tiktok_url', label: 'TikTok URL', placeholder: 'https://tiktok.com/@your_handle' },
                  { key: 'twitter_url', label: 'Twitter / X URL', placeholder: 'https://twitter.com/your_handle' },
                  { key: 'discord_username', label: 'Discord Username', placeholder: 'your_username#0000' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="frag-input-label flex items-center gap-2">
                      {field.label} <OptionalBadge />
                    </label>
                    <input
                      type="text"
                      className="frag-input"
                      placeholder={field.placeholder}
                      value={(form as any)[field.key]}
                      onChange={e => set(field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="btn-secondary"
              style={{ opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'auto' }}
            >
              <ChevronLeft size={15} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={handleNext} className="btn-accent">
                Continue <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={handleFinish} className="btn-accent" disabled={saving}>
                {saving ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
