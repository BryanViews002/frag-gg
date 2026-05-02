'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export function useProtectedAction() {
  const { authUser, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const executeProtectedAction = (action: () => void) => {
    if (loading) return;

    if (!authUser || !profile) {
      // Store current path to redirect back later if needed, though login redirects to dashboard by default
      // but for this requirement we want to redirect straight back.
      sessionStorage.setItem('redirectAfterLogin', pathname);
      setShowAuthModal(true);
      return;
    }

    // Check verification steps
    if (!authUser.email_confirmed_at) {
      // The user object from Supabase auth has an email_confirmed_at field, 
      // though profile doesn't. We'd ideally check this. Assuming profile has an equivalent or we check authUser.
      router.push('/settings?alert=email-unverified');
      return;
    }

    if (profile.ingame_uid === '0000' || !profile.ingame_uid) {
      router.push('/settings?alert=missing-uid');
      return;
    }

    if (profile.ingame_name === 'TBD' || !profile.ingame_name) {
      router.push('/settings?alert=missing-ingame-name');
      return;
    }

    if (!profile.onboarding_complete) {
      router.push('/onboarding');
      return;
    }

    // All checks passed, execute action
    action();
  };

  return {
    executeProtectedAction,
    showAuthModal,
    setShowAuthModal
  };
}
