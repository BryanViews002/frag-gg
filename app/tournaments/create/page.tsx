'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Trophy, Calendar, Crosshair, Users, ChevronRight, ChevronLeft, Upload, CheckCircle2, Shield, UserPlus, Search } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { REGIONS } from '@/types';

const ConfettiCanvas = dynamic(() => import('@/components/canvas/ConfettiCanvas'), { ssr: false });

const STEPS = [
  'Basics', 'Game Mode', 'Structure', 'Match Type', 
  'Draw Type', 'Registration', 'Mods', 'Verify Window', 
  'Schedule', 'Prize Pool', 'Publish'
];

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
    tournament_structure: 'head_to_head', bracket_type: 'single_elim',
    mp_match_type: 'standard', draw_type: 'random', registration_type: 'self',
    max_teams: 8, verification_window: 60,
    registration_opens: '', registration_closes: '', start_date: '', match_time_limit: 30,
    has_prize: false, prize_1st: '', prize_2nd: '', prize_3rd: '', prize_notes: ''
  });

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [mods, setMods] = useState<{id: string, username: string}[]>([]);
  const [modSearch, setModSearch] = useState('');

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
      setForm(p => ({ ...p, banner_url: URL.createObjectURL(e.target.files![0]) }));
    }
  };

  const searchMod = async () => {
    if (!modSearch) return;
    const { data } = await supabase.from('users').select('id, username').ilike('username', modSearch).maybeSingle();
    if (data) {
      if (!mods.find(m => m.id === data.id)) setMods([...mods, data]);
      setModSearch('');
    } else {
      toast.error('User not found');
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

      let entry_size = 1;
      let max_players = 2;
      let max_entries = form.max_teams;

      if (form.mode === 'mp') {
        const sizeMap: Record<string, number> = { '1v1': 1, '2v2': 2, '3v3': 3, '4v4': 4, '5v5': 5 };
        entry_size = sizeMap[form.mp_format] || 5;
        if (form.tournament_structure === 'head_to_head') {
          max_entries = 2;
        }
        max_players = max_entries * entry_size;
      } else {
        const sizeMap: Record<string, number> = { 'solo': 1, 'duo': 2, 'squad': 4 };
        entry_size = sizeMap[form.br_format] || 1;
        max_players = Number(form.max_teams) * entry_size;
        max_entries = form.max_teams;
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
        tournament_structure: form.tournament_structure,
        bracket_type: form.tournament_structure === 'bracket' ? form.bracket_type : null,
        draw_type: form.tournament_structure === 'bracket' ? form.draw_type : null,
        mp_match_type: form.mode === 'mp' ? form.mp_match_type : null,
        registration_type: form.registration_type,
        max_teams: max_entries,
        verification_window: Number(form.verification_window),
        max_entries,
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
      
      const tourneyId = data.id;

      if (mods.length > 0) {
        const modInserts = mods.map(m => ({
          tournament_id: tourneyId,
          user_id: m.id,
          assigned_by: profile.id
        }));
        await supabase.from('tournament_mods').insert(modInserts);
      }
      
      setNewTourneyId(tourneyId);
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

  const handleNext = () => {
    // Skip Draw Type if Head to Head
    if (step === 3 && form.tournament_structure === 'head_to_head') {
      setStep(5);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    // Skip Draw Type if Head to Head
    if (step === 5 && form.tournament_structure === 'head_to_head') {
      setStep(3);
    } else {
      setStep(s => s - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-rajdhani font-bold text-3xl mb-2 text-primary">Create Tournament</h1>
      <p className="text-muted mb-8">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      
      {/* Progress */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-4 scrollbar-hide">
        {STEPS.map((label, i) => (
          <div key={label} className={`h-2 flex-1 rounded-full min-w-[24px] ${i <= step ? 'bg-accent shadow-accent-glow' : 'bg-[#222]'}`} />
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
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => set('mode', 'mp')} 
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${form.mode === 'mp' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                <Crosshair size={24} className={form.mode === 'mp' ? 'text-accent' : 'text-muted'} />
                <div className="font-rajdhani font-bold text-xl text-primary">MULTIPLAYER</div>
                <div className="text-sm text-secondary">Team vs Team on MP maps.</div>
              </button>
              <button onClick={() => set('mode', 'br')} 
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${form.mode === 'br' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                <Users size={24} className={form.mode === 'br' ? 'text-accent' : 'text-muted'} />
                <div className="font-rajdhani font-bold text-xl text-primary">BATTLE ROYALE</div>
                <div className="text-sm text-secondary">Last squad standing wins.</div>
              </button>
            </div>
            {form.mode === 'mp' && (
              <div>
                <label className="frag-input-label mb-2">Team Size</label>
                <div className="grid grid-cols-5 gap-2">
                  {['1v1', '2v2', '3v3', '4v4', '5v5'].map(f => (
                    <button key={f} onClick={() => set('mp_format', f)}
                      className={`p-3 rounded-lg font-rajdhani font-bold border-2 ${form.mp_format === f ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted bg-secondary'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {form.mode === 'br' && (
              <div>
                <label className="frag-input-label mb-2">Squad Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['solo', 'duo', 'squad'].map(f => (
                    <button key={f} onClick={() => set('br_format', f)}
                      className={`p-3 rounded-lg font-rajdhani font-bold border-2 uppercase ${form.br_format === f ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted bg-secondary'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Structure */}
        {step === 2 && (
          <div className="space-y-6">
            <label className="frag-input-label">Tournament Structure</label>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => set('tournament_structure', 'head_to_head')} 
                className={`p-4 rounded-xl border-2 text-left transition-all ${form.tournament_structure === 'head_to_head' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                <div className="font-bold text-primary mb-1">Head to Head</div>
                <div className="text-sm text-secondary">Exactly 2 sides. One match decides everything.</div>
              </button>
              <button onClick={() => set('tournament_structure', 'bracket')} 
                className={`p-4 rounded-xl border-2 text-left transition-all ${form.tournament_structure === 'bracket' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                <div className="font-bold text-primary mb-1">Bracket Tournament</div>
                <div className="text-sm text-secondary">Any number of teams. Auto-generates bracket tree.</div>
              </button>
            </div>

            {form.tournament_structure === 'bracket' && (
              <div className="space-y-6 animate-slide-in-right">
                <div>
                  <label className="frag-input-label">Maximum Teams</label>
                  <input type="number" min="2" className="frag-input text-lg" value={form.max_teams} onChange={e => set('max_teams', parseInt(e.target.value) || 2)} />
                  <p className="text-xs text-muted mt-2">Enter any number. We will round up to the next power of 2 and fill empty slots with BYES automatically.</p>
                </div>
                <div>
                  <label className="frag-input-label">Elimination Type</label>
                  <select className="frag-input" value={form.bracket_type} onChange={e => set('bracket_type', e.target.value)}>
                    <option value="single_elim">Single Elimination</option>
                    <option value="double_elim">Double Elimination</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Match Type (MP Only, if BR we skip conceptually, but let's just show standard for BR or hide) */}
        {step === 3 && (
          <div className="space-y-6">
            {form.mode === 'mp' ? (
              <>
                <label className="frag-input-label">Match Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => set('mp_match_type', 'standard')} className={`p-4 rounded-xl border-2 text-left ${form.mp_match_type === 'standard' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                    <div className="font-bold text-primary">Standard Team Match</div>
                    <div className="text-xs text-muted mt-1">Full team vs full team.</div>
                  </button>
                  <button onClick={() => set('mp_match_type', 'pure_1v1')} className={`p-4 rounded-xl border-2 text-left ${form.mp_match_type === 'pure_1v1' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                    <div className="font-bold text-primary">Pure 1v1 Bracket</div>
                    <div className="text-xs text-muted mt-1">Solo players register. 1v1 matches only.</div>
                  </button>
                  <button onClick={() => set('mp_match_type', 'representative')} className={`p-4 rounded-xl border-2 text-left ${form.mp_match_type === 'representative' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                    <div className="font-bold text-primary">Team Representative</div>
                    <div className="text-xs text-muted mt-1">Teams nominate 1 player for a 1v1 battle per match.</div>
                  </button>
                  <button onClick={() => set('mp_match_type', 'battle')} className={`p-4 rounded-xl border-2 text-left ${form.mp_match_type === 'battle' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                    <div className="font-bold text-primary">Team Battle (Best of X)</div>
                    <div className="text-xs text-muted mt-1">Multiple individual 1v1s. First team to reach majority wins.</div>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-muted">Match Type is standardized for Battle Royale. Click Next.</div>
            )}
          </div>
        )}

        {/* STEP 4: Draw Type */}
        {step === 4 && (
          <div className="space-y-6">
            <label className="frag-input-label">Draw Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => set('draw_type', 'random')} className={`p-4 rounded-xl border-2 text-left ${form.draw_type === 'random' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                <div className="font-bold text-primary mb-1">Pure Random</div>
                <div className="text-sm text-secondary">Every team has an equal chance of any slot.</div>
              </button>
              <button onClick={() => set('draw_type', 'seeded')} className={`p-4 rounded-xl border-2 text-left ${form.draw_type === 'seeded' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                <div className="font-bold text-primary mb-1">Seeded Draw</div>
                <div className="text-sm text-secondary">Teams ranked by platform stats. Top seeds separated.</div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Registration Type */}
        {step === 5 && (
          <div className="space-y-6">
            <label className="frag-input-label">Registration Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => set('registration_type', 'self')} className={`p-4 rounded-xl border-2 text-left ${form.registration_type === 'self' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                <div className="font-bold text-primary mb-1">Team Self Registration</div>
                <div className="text-sm text-secondary">Captains register and add their teammates.</div>
              </button>
              <button onClick={() => set('registration_type', 'auto')} className={`p-4 rounded-xl border-2 text-left ${form.registration_type === 'auto' ? 'border-accent bg-accent/10' : 'border-border bg-secondary'}`}>
                <div className="font-bold text-primary mb-1">Individual Auto Team Builder</div>
                <div className="text-sm text-secondary">Players register solo. Platform auto-builds balanced teams.</div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Mods */}
        {step === 6 && (
          <div className="space-y-6">
            <label className="frag-input-label">Assign Moderators</label>
            <p className="text-sm text-muted mb-4">Mods can submit results and verify players. They cannot change settings or delete the tournament.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" className="frag-input pl-9" placeholder="Search by username..." value={modSearch} onChange={e => setModSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMod()} />
              </div>
              <button onClick={searchMod} className="btn-secondary px-6">Add</button>
            </div>
            {mods.length > 0 && (
              <div className="mt-4 space-y-2">
                {mods.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
                    <span className="font-bold text-primary">{m.username}</span>
                    <button onClick={() => setMods(mods.filter(x => x.id !== m.id))} className="text-red-500 text-sm hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Verification Window */}
        {step === 7 && (
          <div className="space-y-6">
            <label className="frag-input-label">Verification Window</label>
            <p className="text-sm text-muted mb-4">How long before the start time should registration close so you can verify players?</p>
            <select className="frag-input text-lg" value={form.verification_window} onChange={e => set('verification_window', e.target.value)}>
              <option value={30}>30 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={120}>2 Hours</option>
              <option value={1440}>24 Hours</option>
            </select>
          </div>
        )}

        {/* STEP 8: Schedule */}
        {step === 8 && (
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
                <p className="text-xs text-muted mt-1">Must allow time for the verification window before start.</p>
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

        {/* STEP 9: Prize */}
        {step === 9 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary cursor-pointer" onClick={() => set('has_prize', !form.has_prize)}>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.has_prize ? 'bg-accent' : 'bg-muted'}`}>
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
                  <label className="frag-input-label text-gold"><Trophy size={14} className="inline mr-2"/> 1st Place Prize</label>
                  <input type="text" className="frag-input" value={form.prize_1st} onChange={e => set('prize_1st', e.target.value)} />
                </div>
                <div>
                  <label className="frag-input-label text-silver"><Trophy size={14} className="inline mr-2"/> 2nd Place Prize</label>
                  <input type="text" className="frag-input" value={form.prize_2nd} onChange={e => set('prize_2nd', e.target.value)} />
                </div>
                <div>
                  <label className="frag-input-label text-bronze"><Trophy size={14} className="inline mr-2"/> 3rd Place Prize</label>
                  <input type="text" className="frag-input" value={form.prize_3rd} onChange={e => set('prize_3rd', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-border rounded-xl">
                <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="font-rajdhani text-2xl text-secondary font-bold">FOR GLORY</h3>
              </div>
            )}
          </div>
        )}

        {/* STEP 10: Publish */}
        {step === 10 && (
          <div className="space-y-6 text-center animate-slide-in-right">
            <Shield size={48} className="mx-auto text-accent mb-4" />
            <h2 className="text-3xl font-rajdhani font-bold text-primary">Ready to Publish</h2>
            <p className="text-secondary max-w-md mx-auto">Double check your settings. Once published, the tournament will be live for registrations.</p>
            <div className="p-4 bg-secondary rounded-xl text-left inline-block mt-4 border border-border">
              <p><strong>Name:</strong> {form.name}</p>
              <p><strong>Mode:</strong> {form.mode.toUpperCase()}</p>
              <p><strong>Structure:</strong> {form.tournament_structure}</p>
              <p><strong>Start:</strong> {form.start_date ? new Date(form.start_date).toLocaleString() : 'Not set'}</p>
            </div>
          </div>
        )}

        {/* Footer Nav */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <button onClick={handleBack} disabled={step === 0} className={`btn-secondary ${step === 0 ? 'opacity-0' : ''}`}>
            <ChevronLeft size={16} /> Back
          </button>
          
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} className="btn-accent">
              Next <ChevronRight size={16} />
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
