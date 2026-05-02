'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { Shield, Upload, Users, Crosshair, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateClanPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useAuth();
  
  const [form, setForm] = useState({ name: '', tag: '', description: '', req_rank: 'Any' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUploadClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error('Must be logged in');
    if (form.tag.length < 2 || form.tag.length > 5) return toast.error('Tag must be 2-5 characters');
    
    setLoading(true);
    try {
      // Check if tag exists
      const { data: existing } = await supabase.from('clans').select('id').eq('tag', form.tag.toUpperCase()).maybeSingle();
      if (existing) throw new Error('Clan tag is already taken');

      let logo_url = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `clans/${form.tag.toUpperCase()}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, logoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        logo_url = data.publicUrl;
      }

      // Create Clan
      const { data: newClan, error: clanError } = await supabase.from('clans').insert({
        name: form.name,
        tag: form.tag.toUpperCase(),
        description: form.description,
        req_rank: form.req_rank,
        leader_id: profile.id,
        logo_url
      }).select('id').single();
      
      if (clanError) throw clanError;

      // Add leader to members
      await supabase.from('clan_members').insert({
        clan_id: newClan.id,
        user_id: profile.id,
        role: 'leader'
      });

      // Update user clan_id
      await supabase.from('users').update({ clan_id: newClan.id }).eq('id', profile.id);

      toast.success('Clan created successfully!');
      router.push(`/clans/${newClan.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create clan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-rajdhani font-bold text-4xl mb-2 text-primary flex items-center gap-3">
          <Shield size={36} className="text-accent" /> Forge Your Clan
        </h1>
        <p className="text-secondary text-lg mb-8">Gather your squad and build your legacy.</p>

        <form onSubmit={handleSubmit} className="frag-card p-8 animate-slide-up space-y-6">
          
          <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
            <div className="relative w-32 h-32 rounded-2xl bg-secondary border-2 border-dashed border-border flex items-center justify-center flex-shrink-0 group overflow-hidden transition-colors hover:border-accent">
              <input type="file" accept="image/*" onChange={handleUploadClick} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {logoPreview ? (
                <Image src={logoPreview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="text-center group-hover:text-accent transition-colors">
                  <Upload size={24} className="mx-auto mb-2 text-muted" />
                  <span className="text-xs font-semibold uppercase text-muted tracking-widest">Logo</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="frag-input-label">Clan Name</label>
                <div className="relative">
                  <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" className="frag-input pl-10" placeholder="e.g. Phantom Esports" 
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="frag-input-label">Clan Tag (2-5 chars)</label>
                <div className="relative">
                  <Crosshair size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" className="frag-input pl-10 font-bold uppercase" placeholder="e.g. PHNTM" 
                    maxLength={5} value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value.toUpperCase() }))} required />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="frag-input-label">Description / Recruitment Pitch</label>
            <textarea className="frag-input min-h-[120px]" placeholder="What is your clan about? What are you looking for?" 
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
          </div>

          <div>
            <label className="frag-input-label">Minimum Rank Requirement</label>
            <select className="frag-input bg-secondary appearance-none" value={form.req_rank} onChange={e => setForm(p => ({ ...p, req_rank: e.target.value }))}>
              <option value="Any">Any Rank</option>
              {['Veteran', 'Elite', 'Pro', 'Master', 'Grandmaster', 'Legendary'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="pt-6 border-t border-border mt-8 flex items-center justify-between">
            <p className="text-xs text-muted max-w-sm">By creating a clan, you accept responsibility for your members' behavior in FRAG.GG tournaments.</p>
            <button type="submit" disabled={loading} className="btn-accent px-8 py-3">
              {loading ? 'Forging...' : <><Shield size={18} /> Forge Clan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
