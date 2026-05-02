'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { getAvatarUrl, getRankRingClass } from '@/lib/utils';
import ScrollReveal from '@/components/ScrollReveal';
import { COUNTRIES, RANKS, ROLES } from '@/types';
import toast from 'react-hot-toast';
import { Upload, Settings, Shield, User, Link as LinkIcon, Save, Key } from 'lucide-react';

const TABS = ['General', 'Gaming', 'Social', 'Account'];

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: authLoading, refreshProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('General');
  const [saving, setSaving] = useState(false);
  
  // Forms
  const [genForm, setGenForm] = useState({ bio: '', country: '', avatar_url: '', banner_url: '' });
  const [gameForm, setGameForm] = useState({ ingame_name: '', ingame_uid: '', rank: '', role: '', preferred_mode: '' });
  const [socialForm, setSocialForm] = useState({ youtube_url: '', tiktok_url: '', twitter_url: '', discord_username: '' });
  const [accountForm, setAccountForm] = useState({ email: '', newPassword: '', confirmDelete: '' });

  useEffect(() => {
    if (profile) {
      setGenForm({ bio: profile.bio || '', country: profile.country || '', avatar_url: profile.avatar_url || '', banner_url: profile.banner_url || '' });
      setGameForm({ ingame_name: profile.ingame_name, ingame_uid: profile.ingame_uid, rank: profile.rank || '', role: profile.role || '', preferred_mode: profile.preferred_mode || '' });
      setSocialForm({ youtube_url: profile.youtube_url || '', tiktok_url: profile.tiktok_url || '', twitter_url: profile.twitter_url || '', discord_username: profile.discord_username || '' });
      setAccountForm(p => ({ ...p, email: profile.email }));
    }
  }, [profile]);

  const handleUpload = async (file: File, bucket: 'avatars' | 'banners', field: 'avatar_url' | 'banner_url') => {
    if (!profile) return;
    const toastId = toast.loading(`Uploading ${bucket === 'avatars' ? 'avatar' : 'banner'}...`);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/${field}.${ext}`;
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
      const newUrl = `${publicData.publicUrl}?t=${Date.now()}`;
      
      setGenForm(p => ({ ...p, [field]: newUrl }));
      
      // Auto save the image URL
      await supabase.from('users').update({ [field]: newUrl }).eq('id', profile.id);
      refreshProfile();
      toast.success('Uploaded successfully', { id: toastId });
    } catch (err: any) {
      console.error('Upload Error:', err);
      toast.error(err.message || 'Failed to upload image', { id: toastId });
    }
  };

  const saveProfileInfo = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updates = {
        ...genForm,
        ...gameForm,
        ...socialForm,
      };
      const { error } = await supabase.from('users').update(updates).eq('id', profile.id);
      if (error) throw error;
      toast.success('Profile updated!');
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!accountForm.newPassword) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: accountForm.newPassword });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success('Password updated'); setAccountForm(p => ({ ...p, newPassword: '' })); }
  };

  const handleDeleteAccount = async () => {
    if (accountForm.confirmDelete !== 'DELETE') return;
    toast.error('Account deletion is not supported in this demo interface yet.');
  };

  if (authLoading) return null;
  if (!profile) { router.push('/login'); return null; }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ScrollReveal>
        <h1 className="font-rajdhani font-bold text-3xl mb-8 text-primary flex items-center gap-3">
          <Settings size={28} className="text-accent" /> Settings
        </h1>
      </ScrollReveal>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="md:w-48 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-3 rounded-lg font-rajdhani font-bold text-lg transition-all whitespace-nowrap
                ${activeTab === tab ? 'bg-accent/10 text-accent border border-accent/30' : 'text-secondary hover:text-primary hover:bg-white/5'}`}>
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-secondary border border-border rounded-2xl overflow-hidden min-h-[500px]">
          
          {/* GENERAL TAB */}
          {activeTab === 'General' && (
            <ScrollReveal className="animate-scale-in">
              {/* Banner Area */}
              <div className="h-32 bg-card relative group">
                {genForm.banner_url ? (
                  <Image src={genForm.banner_url} alt="Banner" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted border-b border-border">No Banner Set</div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="btn-secondary cursor-pointer">
                    <Upload size={14} /> Change Banner
                    <input type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'banners', 'banner_url')} />
                  </label>
                </div>
              </div>

              <div className="p-6 md:p-8 pt-0 relative">
                {/* Avatar Area */}
                <div className="relative w-24 h-24 rounded-full -mt-12 mb-6 border-4 border-secondary bg-primary group z-10">
                  <Image src={getAvatarUrl(genForm.avatar_url, profile.username)} alt="Avatar" fill className={`object-cover rounded-full ${getRankRingClass(profile.rank)}`} />
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <label className="cursor-pointer p-2"><Upload size={16} className="text-white" />
                      <input type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatars', 'avatar_url')} />
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="frag-input-label">Bio</label>
                    <textarea className="frag-input" rows={3} value={genForm.bio} onChange={e => setGenForm(p => ({ ...p, bio: e.target.value }))} />
                  </div>
                  <div>
                    <label className="frag-input-label">Country</label>
                    <select className="frag-input" value={genForm.country} onChange={e => setGenForm(p => ({ ...p, country: e.target.value }))}>
                      <option value="">Select country...</option>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* GAMING TAB */}
          {activeTab === 'Gaming' && (
            <div className="p-6 md:p-8 space-y-6 animate-scale-in">
              <h2 className="font-rajdhani font-bold text-2xl text-primary mb-6">CODM Identity</h2>
              
              <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 mb-6">
                <p className="text-sm text-secondary mb-2">Changing your in-game info will affect tournament registrations.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="frag-input-label text-accent">In-Game Name</label>
                    <input type="text" className="frag-input border-accent/30" value={gameForm.ingame_name} onChange={e => setGameForm(p => ({ ...p, ingame_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="frag-input-label text-accent">UID</label>
                    <input type="text" className="frag-input border-accent/30" value={gameForm.ingame_uid} onChange={e => setGameForm(p => ({ ...p, ingame_uid: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="frag-input-label">Current Rank</label>
                  <select className="frag-input" value={gameForm.rank} onChange={e => setGameForm(p => ({ ...p, rank: e.target.value }))}>
                    <option value="">Unranked</option>
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="frag-input-label">Preferred Role</label>
                  <select className="frag-input" value={gameForm.role} onChange={e => setGameForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="">Any Role</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="frag-input-label">Preferred Mode</label>
                <div className="flex gap-2">
                  {['mp', 'br', 'both'].map(m => (
                    <button key={m} onClick={() => setGameForm(p => ({ ...p, preferred_mode: m }))}
                      className={`px-4 py-2 rounded-lg font-rajdhani font-bold uppercase border transition-all
                      ${gameForm.preferred_mode === m ? 'bg-accent/20 border-accent text-accent' : 'bg-card border-border text-muted'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SOCIAL TAB */}
          {activeTab === 'Social' && (
            <div className="p-6 md:p-8 space-y-6 animate-scale-in">
              <h2 className="font-rajdhani font-bold text-2xl text-primary mb-2">Connected Links</h2>
              <p className="text-secondary text-sm mb-6">These links will be publicly visible on your profile.</p>

              <div className="space-y-4">
                {[
                  { key: 'youtube_url', label: 'YouTube' },
                  { key: 'tiktok_url', label: 'TikTok' },
                  { key: 'twitter_url', label: 'Twitter / X' },
                  { key: 'discord_username', label: 'Discord' }
                ].map(f => (
                  <div key={f.key}>
                    <label className="frag-input-label">{f.label}</label>
                    <div className="relative group text-muted focus-within:text-accent transition-colors">
                      <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-current" />
                      <input type="text" className="frag-input pl-9" value={(socialForm as any)[f.key]} 
                        onChange={e => setSocialForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'Account' && (
            <div className="p-6 md:p-8 space-y-8 animate-scale-in">
              <div>
                <h3 className="font-rajdhani font-bold text-xl text-primary mb-4">Email</h3>
                <input type="email" disabled className="frag-input opacity-50 cursor-not-allowed" value={accountForm.email} />
                <p className="text-xs text-muted mt-1">Contact support to change email.</p>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="font-rajdhani font-bold text-xl text-primary mb-4">Change Password</h3>
                <div className="flex gap-2">
                  <input type="password" placeholder="New Password" className="frag-input flex-1" 
                    value={accountForm.newPassword} onChange={e => setAccountForm(p => ({ ...p, newPassword: e.target.value }))} />
                  <button onClick={handlePasswordChange} disabled={saving || !accountForm.newPassword} className="btn-secondary">Update</button>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="font-rajdhani font-bold text-xl text-[#FF4444] mb-4">Danger Zone</h3>
                <div className="p-4 rounded-xl border border-[#FF4444] bg-[#FF4444]/5">
                  <p className="text-sm text-secondary mb-3">Deleting your account is permanent. All tournament history will be lost.</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type DELETE to confirm" className="frag-input flex-1 border-[#FF4444]/30 focus:border-[#FF4444] focus:ring-[#FF4444]/20" 
                      value={accountForm.confirmDelete} onChange={e => setAccountForm(p => ({ ...p, confirmDelete: e.target.value }))} />
                    <button onClick={handleDeleteAccount} disabled={accountForm.confirmDelete !== 'DELETE'} 
                      className="px-4 py-2 rounded-lg font-bold text-white transition-opacity disabled:opacity-50" style={{ background: '#FF4444' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Footer for everything except Account */}
          {activeTab !== 'Account' && (
            <div className="p-6 border-t border-border bg-card flex justify-end">
              <button onClick={saveProfileInfo} disabled={saving} className="btn-accent active:scale-[0.98] transition-transform">
                {saving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
