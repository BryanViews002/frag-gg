'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProtectedAction } from '@/lib/hooks/useProtectedAction';
import { RequireAuthModal } from '@/components/auth/RequireAuthModal';
import type { Tournament, MPRegistration, BRRegistration } from '@/types';
import Link from 'next/link';
import { formatDate, formatDateTime, getTournamentFormatLabel, getTournamentSlotLabel, getCountdown, getAvatarUrl } from '@/lib/utils';
import { Calendar, Users, Trophy, Clock, Share2, Check } from 'lucide-react';
import RegistrationModal from '@/components/tournament/RegistrationModal';
import toast from 'react-hot-toast';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { executeProtectedAction, showAuthModal, setShowAuthModal } = useProtectedAction();
  const supabase = createClient();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRegModal, setShowRegModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const fetchTournament = async () => {
    setLoading(true);
    const { data: tData } = await supabase
      .from('tournaments')
      .select('*, creator:users!creator_id(*)')
      .eq('id', id)
      .single();
    if (tData) {
      setTournament(tData as Tournament);
      
      // Check if current user is registered
      if (profile) {
        if (tData.mode === 'mp') {
          const { data: reg } = await supabase
            .from('mp_registrations')
            .select('id')
            .eq('tournament_id', tData.id)
            .or(`captain_id.eq.${profile.id},player2_id.eq.${profile.id},player3_id.eq.${profile.id},player4_id.eq.${profile.id},player5_id.eq.${profile.id}`)
            .maybeSingle();
          setIsRegistered(!!reg);
        } else {
          const { data: reg } = await supabase
            .from('br_registrations')
            .select('id')
            .eq('tournament_id', tData.id)
            .or(`captain_id.eq.${profile.id},player2_id.eq.${profile.id},player3_id.eq.${profile.id},player4_id.eq.${profile.id}`)
            .maybeSingle();
          setIsRegistered(!!reg);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTournament();
  }, [id, profile]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-accent" /></div>;
  if (!tournament) return <div className="min-h-screen flex items-center justify-center text-muted font-rajdhani text-2xl">Tournament not found</div>;

  const isFull = tournament.current_entries >= tournament.max_entries;
  const isOpen = tournament.status === 'open';

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg-primary)' }}>
      {/* ─── HERO BANNER ─── */}
      <div className="relative h-64 md:h-80 w-full">
        <Image src={tournament.banner_url || `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80`} alt={tournament.name} fill className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-primary) 0%, rgba(6,6,14,0.4) 100%)' }} />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`badge ${tournament.mode === 'mp' ? 'badge-mp' : 'badge-br'}`}>{tournament.mode.toUpperCase()}</span>
                <span className="badge badge-format">{getTournamentFormatLabel(tournament.mode, tournament.mp_format, tournament.br_format)}</span>
                <span className={`badge ${tournament.status === 'live' ? 'badge-live' : tournament.status === 'open' ? 'badge-open' : 'badge-ended'}`}>
                  {tournament.status === 'live' && <span className="live-dot mr-1" />}
                  {tournament.status.toUpperCase()}
                </span>
              </div>
              <h1 className="font-rajdhani font-bold text-4xl md:text-5xl text-primary drop-shadow-lg" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                {tournament.name}
              </h1>
            </div>
            
            <button onClick={handleShare} className="btn-secondary h-10 w-10 p-0 justify-center flex-shrink-0" title="Share Tournament">
              {copied ? <Check size={18} className="text-neon-green" /> : <Share2 size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ─── STATS ROW ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="frag-card p-4 text-center">
            <Users size={20} className="mx-auto mb-2 text-accent" />
            <div className="font-orbitron font-bold text-xl text-primary">{getTournamentSlotLabel(tournament)}</div>
            <div className="text-xs text-muted uppercase tracking-widest mt-1">Registered</div>
          </div>
          <div className="frag-card p-4 text-center">
            <Calendar size={20} className="mx-auto mb-2 text-accent" />
            <div className="font-orbitron font-bold text-xl text-primary">{formatDate(tournament.start_date)}</div>
            <div className="text-xs text-muted uppercase tracking-widest mt-1">Start Date</div>
          </div>
          <div className="frag-card p-4 text-center">
            <Clock size={20} className="mx-auto mb-2 text-accent" />
            <div className="font-orbitron font-bold text-xl text-primary">{getCountdown(tournament.start_date)}</div>
            <div className="text-xs text-muted uppercase tracking-widest mt-1">Countdown</div>
          </div>
          <div className="frag-card p-4 text-center" style={{ border: tournament.has_prize ? '1px solid rgba(255,215,0,0.3)' : undefined }}>
            <Trophy size={20} className={`mx-auto mb-2 ${tournament.has_prize ? 'text-gold' : 'text-accent'}`} />
            <div className={`font-orbitron font-bold text-xl ${tournament.has_prize ? 'text-gold text-shadow-gold' : 'text-primary'}`}>
              {tournament.has_prize ? tournament.prize_1st : 'FOR GLORY'}
            </div>
            <div className="text-xs text-muted uppercase tracking-widest mt-1">Prize</div>
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex gap-2 overflow-x-auto border-b border-border mb-8 scrollbar-hide">
          {['overview', 'participants', 'matches', 'rules', 'results'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`tab-btn whitespace-nowrap ${activeTab === tab ? 'active' : ''}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ─── TAB CONTENT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-slide-up">
                <section>
                  <h3 className="font-rajdhani font-bold text-2xl text-primary mb-4">About Tournament</h3>
                  <div className="prose prose-invert max-w-none text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: tournament.description || 'No description provided.' }} />
                </section>

                <section>
                  <h3 className="font-rajdhani font-bold text-2xl text-primary mb-4">Schedule</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <div>
                        <div className="font-bold text-primary">Registration Opens</div>
                        <div className="text-sm text-muted">{formatDateTime(tournament.registration_opens)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-accent" />
                      <div>
                        <div className="font-bold text-primary">Registration Closes</div>
                        <div className="text-sm text-muted">{formatDateTime(tournament.registration_closes)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-neon-green" style={{ boxShadow: '0 0 10px rgba(0,255,135,0.5)' }} />
                      <div>
                        <div className="font-bold text-primary">Tournament Starts</div>
                        <div className="text-sm text-muted">{formatDateTime(tournament.start_date)}</div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
            
            {activeTab === 'participants' && (
              <div className="frag-card-static p-8 text-center text-muted animate-slide-up">Participants view not implemented yet.</div>
            )}
            {activeTab === 'matches' && (
              <div className="frag-card-static p-8 text-center text-muted animate-slide-up">Matches/Standings view not implemented yet.</div>
            )}
            {activeTab === 'rules' && (
              <div className="frag-card-static p-8 animate-slide-up prose prose-invert text-secondary">
                {tournament.rules ? <div dangerouslySetInnerHTML={{ __html: tournament.rules }} /> : 'No specific rules provided. Standard FRAG.GG rules apply.'}
              </div>
            )}
            {activeTab === 'results' && (
              <div className="frag-card-static p-8 text-center text-muted animate-slide-up">Results view not implemented yet.</div>
            )}
          </div>

          {/* ─── SIDEBAR / REGISTER ─── */}
          <div>
            <div className="frag-card p-6 sticky top-24">
              <h3 className="font-rajdhani font-bold text-xl text-primary mb-4 border-b border-border pb-2">Registration</h3>
              
              {isRegistered ? (
                <div className="text-center p-4 rounded-xl bg-neon-green/10 border border-neon-green/30">
                  <Check size={32} className="mx-auto mb-2 text-neon-green" />
                  <p className="font-bold text-neon-green">Registered ✓</p>
                  <p className="text-xs text-muted mt-1">You are in this tournament.</p>
                </div>
              ) : !isOpen ? (
                <div className="text-center p-4 rounded-xl bg-secondary border border-border">
                  <p className="font-bold text-muted">Registration Closed</p>
                </div>
              ) : isFull ? (
                <div className="text-center p-4 rounded-xl bg-secondary border border-border">
                  <p className="font-bold text-gold">Tournament Full</p>
                </div>
              ) : (
                <button onClick={() => executeProtectedAction(() => setShowRegModal(true))} className="btn-accent w-full justify-center py-3 text-lg">
                  {tournament.mode === 'mp' && tournament.mp_format !== '1v1' ? 'Register Team' : 
                   tournament.mode === 'br' && tournament.br_format !== 'solo' ? 'Register Squad/Duo' : 'Register Now'}
                </button>
              )}

              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Organizer</h4>
                <div className="flex items-center gap-3">
                  <Image src={getAvatarUrl(tournament.creator?.avatar_url || null, tournament.creator?.username || 'Unknown')} 
                    alt="Organizer" width={40} height={40} className="rounded-full" />
                  <div>
                    <div className="font-bold text-primary">{tournament.creator?.username || 'Unknown'}</div>
                    <div className="text-xs text-muted">{tournament.organizer_contact || 'No contact provided'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRegModal && profile && (
        <RegistrationModal 
          tournament={tournament} 
          currentUser={profile} 
          onClose={() => setShowRegModal(false)} 
          onSuccess={() => { setShowRegModal(false); fetchTournament(); }} 
        />
      )}

      <RequireAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
