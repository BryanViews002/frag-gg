'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtime<T>(
  table: string,
  filter: Record<string, string> | null,
  onInsert?: (payload: T) => void,
  onUpdate?: (payload: T) => void,
  onDelete?: (payload: T) => void
) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let channel = supabase.channel(`realtime-${table}-${JSON.stringify(filter)}`);

    channel = channel.on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter ? { filter: Object.entries(filter).map(([k, v]) => `${k}=eq.${v}`).join(',') } : {}),
      },
      (payload: any) => {
        if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new as T);
        if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new as T);
        if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old as T);
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);
}
