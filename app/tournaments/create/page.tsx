'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Trophy, Calendar, Crosshair, Users, ChevronRight, ChevronLeft, Upload, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { REGIONS } from '@/types';

const ConfettiCanvas = dynamic(() => import('@/components/canvas/ConfettiCanvas'), { ssr: false });

const STEPS = ['Basics', 'Format', 'Schedule', 'Prize'];

export default function CreateTournamentPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [newTourneyId, setNewTourneyId] = useState('');

  const [form, setForm] = useState({
    name: '', banner_url: '', description: '', organizer_contact: '', region: 'Global',
    mode: 'mp', mp_format: '5v5', br_format: 'squad', match_mode: 'hardpoint', match_format: 'bo3',
    max_entries: 2, // Always 2 for MP
    registration_opens: '', registration_closes: '', start_date: '', match_time_limit: 30,
    has_prize: false, prize_1st: '', prize_2nd: '', prize_3rd: '', prize_notes: ''
  });

  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
      setForm(p => ({ ...p, banner_url: URL.createObjectURL(e.target.files![0]) }));
    }
  };

  const handlePublish = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      let finalBannerUrl = null;
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const path = `tournaments/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('banners').upload(path, bannerFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('banners').getPublicUrl(path);
        finalBannerUrl = data.publicUrl;
      }

      // Calculate max_players and entry_size based on format
      let entry_size = 1;
      let max_players = 2;

      if (form.mode === 'mp') {
        const sizeMap: Record<string, number> = { '1v1': 1, '2v2': 2, '3v3': 3, '4v4': 4, '5v5': 5 };
        entry_size = sizeMap[form.mp_format] || 5;
        max_players = entry_size * 2; // Always 2 sides
        form.max_entries = 2; // Enforce 2 sides
      } else {
        const sizeMap: Record<string, number> = { 'solo': 1, 'duo': 2, 'squad': 4 };
        entry_size = sizeMap[form.br_format] || 1;
        max_players = Number(form.max_entries) * entry_size;
      }

      const tourneyData = {
        name: form.name,
        banner_url: finalBannerUrl,
        description: form.description,
        creator_id: profile.id,
        mode: form.mode,
        mp_format: form.mode === 'mp' ? form.mp_format : null,
        br_format: form.mode === 'br' ? form.br_format : null,
        match_mode: form.match_mode,
        match_format: form.match_format,
        max_entries: Number(form.max_entries),
        entry_size,
        max_players,
        registration_opens: new Date(form.registration_opens).toISOString(),
        registration_closes: new Date(form.registration_closes).toISOString(),
        start_date: new Date(form.start_date).toISOString(),
        match_time_limit: Number(form.match_time_limit),
        has_prize: form.has_prize,
        prize_1st: form.has_prize ? form.prize_1st : null,
        prize_2nd: form.has_prize ? form.prize_2nd : null,
        prize_3rd: form.has_prize && form.mode === 'br' ? form.prize_3rd : null,
        prize_notes: form.has_prize ? form.prize_notes : null,
        organizer_contact: form.organizer_contact,
        region: form.region,
        status: 'upcoming'
      };

      const { data, error } = await supabase.from('tournaments').insert(tourneyData).select('id').single();
      if (error) throw error;
      
      setNewTourneyId(data.id);
      setDone(true);
      toast.success('Tournament created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create tournament');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;
  if (!profile) return null;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <ConfettiCanvas active={true} />
        <div className="relative z-10 text-center max-w-lg px-4 animate-scale-in">
          <CheckCircle2 size={64} className="mx-auto mb-6 text-neon-green" style={{ filter: 'drop-shadow(0 0 12px rgba(0,255,135,0.5))' }} />
          <h1 className="font-rajdhani font-bold text-4xl mb-4 text-primary">TOURNAMENT LIVE</h1>
          <p className="text-secondary mb-8">Your tournament has been created and is now visible to players.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tournaments/${newTourneyId}`); toast.success('Link copied!'); }} className="btn-ghost">Copy Link</button>
            <button onClick={() => router.push(`/tournaments/${newTourneyId}`)} className="btn-accent">View Tournament</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-rajdhani font-bold text-3xl mb-8 text-primary">Create Tournament</h1>
      
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-2 relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors
              ${i <= step ? 'bg-accent text-white' : 'bg-secondary text-muted border border-border'}`}>
              {i + 1}
            </div>
            <span className={`text-xs font-semibold uppercase ${i <= step ? 'text-accent' : 'text-muted'}`}>{label}</span>
            {i < STEPS.length - 1 && (
              <div className={`absolute top-4 left-[50%] w-full h-[2px] -z-10
                ${i < step ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="frag-card p-6 md:p-8 animate-slide-up">
        {/* STEP 0: Basics */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="frag-input-label">Tournament Name</label>
              <input type="text" className="frag-input text-lg font-rajdhani font-bold" placeholder="e.g. Summer Championship 2026" 
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            
            <div>
              <label className="frag-input-label">Banner Image</label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center relative hover:border-accent transition-colors cursor-pointer group">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" onChange={handleBannerUpload} />
                {form.banner_url ? (
                  <Image src={form.banner_url} alt="Preview" fill className="object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload size={32} className="text-muted mb-2 group-hover:text-accent transition-colors" />
                    <span className="text-secondary font-medium">Click to upload banner</span>
                    <span className="text-muted text-xs mt-1">16:9 ratio recommended</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="frag-input-label">Description / Details</label>
              <textarea className="frag-input min-h-[120px] resize-y" placeholder="Describe the event, rules, format..." 
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="frag-input-label">Organizer Contact</label>
                <input type="text" className="frag-input" placeholder="Discord or WhatsApp" 
                  value={form.organizer_contact} onChange={e => set('organizer_contact', e.target.value)} />
              </div>
              <div>
                <label className="frag-input-label">Region</label>
                <select className="frag-input bg-secondary appearance-none" value={form.region} onChange={e => set('region', e.target.value)}>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Format */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <label className="frag-input-label mb-3 text-lg">Game Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => set('mode', 'mp')} 
                  className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2
                  ${form.mode === 'mp' ? 'border-accent bg-accent/10' : 'border-border bg-secondary hover:border-accent/50'}`}>
                  <Crosshair size={24} className={form.mode === 'mp' ? 'text-accent' : 'text-muted'} />
                  <div className="font-rajdhani font-bold text-xl text-primary">MULTIPLAYER</div>
                  <div className="text-sm text-secondary">Head-to-head team battles on MP maps.</div>
                </button>
                <button onClick={() => set('mode', 'br')} 
                  className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2
                  ${form.mode === 'br' ? 'border-accent bg-accent/10' : 'border-border bg-secondary hover:border-accent/50'}`}>
                  <Users size={24} className={form.mode === 'br' ? 'text-accent' : 'text-muted'} />
                  <div className="font-rajdhani font-bold text-xl text-primary">BATTLE ROYALE</div>
                  <div className="text-sm text-secondary">Last squad/player standing.</div>
                </button>
              </div>
            </div>

            {form.mode === 'mp' && (
              <div className="space-y-6 animate-slide-in-right">
                <div>
                  <label className="frag-input-label mb-2">Team Format</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['1v1', '2v2', '3v3', '4v4', '5v5'].map(f => (
                      <button key={f} onClick={() => set('mp_format', f)}
                        className={`p-3 rounded-lg font-rajdhani font-bold text-lg border-2 transition-all
                        ${form.mp_format === f ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted bg-secondary'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="frag-input-label">Match Mode</label>
                    <select className="frag-input bg-secondary appearance-none" value={form.match_mode} onChange={e => set('match_mode', e.target.value)}>
                      <option value="hardpoint">Hardpoint</option>
                      <option value="snd">Search & Destroy</option>
                      <option value="control">Control</option>
                    </select>
                  </div>
                  <div>
                    <label className="frag-input-label">Match Format</label>
                    <select className="frag-input bg-secondary appearance-none" value={form.match_format} onChange={e => set('match_format', e.target.value)}>
                      <option value="single">Best of 1</option>
                      <option value="bo3">Best of 3</option>
                      <option value="bo5">Best of 5</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3">
                  <Trophy className="text-accent flex-shrink-0" size={20} />
                  <div className="text-sm text-primary">
                    <p className="font-bold mb-1">Head-to-Head Lock</p>
                    <p className="text-secondary">MP Tournaments are strictly 2 opposing sides. Registration closes automatically when both slots are filled.</p>
                  </div>
                </div>
              </div>
            )}

            {form.mode === 'br' && (
              <div className="space-y-6 animate-slide-in-right">
                <div>
                  <label className="frag-input-label mb-2">Squad Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['solo', 'duo', 'squad'].map(f => (
                      <button key={f} onClick={() => set('br_format', f)}
                        className={`p-3 rounded-lg font-rajdhani font-bold text-lg border-2 transition-all uppercase
                        ${form.br_format === f ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted bg-secondary'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="frag-input-label">Max Entries ({form.br_format === 'solo' ? 'Players' : form.br_format === 'duo' ? 'Duos' : 'Squads'})</label>
                  <input type="range" min="2" max={form.br_format === 'solo' ? 100 : form.br_format === 'duo' ? 50 : 25} step="1"
                    className="w-full accent-accent" value={form.max_entries} onChange={e => set('max_entries', e.target.value)} />
                  <div className="flex justify-between text-xs text-muted mt-2 font-bold">
                    <span>2</span>
                    <span className="text-accent text-lg">{form.max_entries}</span>
                    <span>{form.br_format === 'solo' ? 100 : form.br_format === 'duo' ? 50 : 25}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Schedule */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="frag-input-label">Registration Opens</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="datetime-local" className="frag-input pl-9" value={form.registration_opens} onChange={e => set('registration_opens', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="frag-input-label">Registration Closes</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="datetime-local" className="frag-input pl-9" value={form.registration_closes} onChange={e => set('registration_closes', e.target.value)} />
                </div>
              </div>
            </div>
            
            <div className="border-t border-border pt-6 mt-6">
              <label className="frag-input-label">Tournament Start Date & Time</label>
              <div className="relative mb-6">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="datetime-local" className="frag-input pl-9" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Prize */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary">
              <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${form.has_prize ? 'bg-accent' : 'bg-muted'}`}
                onClick={() => set('has_prize', !form.has_prize)}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${form.has_prize ? 'translate-x-6' : ''}`} />
              </div>
              <div>
                <div className="font-bold text-primary">Prize Pool</div>
                <div className="text-sm text-secondary">Does this tournament have rewards?</div>
              </div>
            </div>

            {form.has_prize ? (
              <div className="space-y-4 animate-slide-in-right">
                <div>
                  <label className="frag-input-label text-gold flex items-center gap-2"><Trophy size={14}/> 1st Place Prize</label>
                  <input type="text" className="frag-input" placeholder="e.g. $100 or 5000 CP" value={form.prize_1st} onChange={e => set('prize_1st', e.target.value)} />
                </div>
                <div>
                  <label className="frag-input-label text-silver flex items-center gap-2"><Trophy size={14}/> 2nd Place Prize</label>
                  <input type="text" className="frag-input" placeholder="e.g. $50 or 2000 CP" value={form.prize_2nd} onChange={e => set('prize_2nd', e.target.value)} />
                </div>
                {form.mode === 'br' && (
                  <div>
                    <label className="frag-input-label text-bronze flex items-center gap-2"><Trophy size={14}/> 3rd Place Prize</label>
                    <input type="text" className="frag-input" placeholder="e.g. 1000 CP" value={form.prize_3rd} onChange={e => set('prize_3rd', e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="frag-input-label">Additional Prize Notes</label>
                  <textarea className="frag-input h-20" placeholder="e.g. MVP bonus, distribution rules..." value={form.prize_notes} onChange={e => set('prize_notes', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-border rounded-xl">
                <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="font-rajdhani font-bold text-2xl text-secondary">FOR GLORY</h3>
                <p className="text-muted">This tournament will be played for reputation and rank.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Nav */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className={`btn-secondary ${step === 0 ? 'opacity-0' : ''}`}>
            <ChevronLeft size={16} /> Back
          </button>
          
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn-accent">
              Next Step <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handlePublish} disabled={saving || !form.name || !form.start_date} className="btn-accent shadow-accent-glow">
              {saving ? 'Publishing...' : 'Publish Tournament 🎉'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
