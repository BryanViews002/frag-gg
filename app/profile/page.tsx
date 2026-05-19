'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { authUser, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!authUser) {
      router.replace('/login');
      return;
    }

    if (!profile?.username || profile.onboarding_complete === false) {
      router.replace('/onboarding');
      return;
    }

    router.replace(`/players/${encodeURIComponent(profile.username)}`);
  }, [authUser, loading, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-accent" />
    </div>
  );
}
