'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DrawAnimationProps {
  tournamentId: string;
  teams: { id: string; name: string }[];
  onComplete: () => void;
}

export function DrawAnimation({ tournamentId, teams, onComplete }: DrawAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!canvasRef.current || teams.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let drawnTeams: string[] = [];
    let startTime = Date.now();

    // Subscribe to realtime draw channel if another user is watching, or if we trigger it.
    const channel = supabase.channel(`draw_${tournamentId}`)
      .on('broadcast', { event: 'draw_pick' }, ({ payload }) => {
        drawnTeams.push(payload.teamName);
      })
      .on('broadcast', { event: 'draw_complete' }, () => {
        setTimeout(onComplete, 2000);
      })
      .subscribe();

    const render = () => {
      const w = canvasRef.current!.width;
      const h = canvasRef.current!.height;
      
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);

      // Draw particles
      const time = Date.now() - startTime;
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time * 0.001 + i) * w/2) + w/2;
        const y = (Math.cos(time * 0.0012 + i) * h/2) + h/2;
        ctx.fillStyle = `rgba(204, 255, 0, ${Math.abs(Math.sin(time * 0.002 + i)) * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Cards
      const cardWidth = 120;
      const cardHeight = 160;
      const gap = 20;
      const totalWidth = teams.length * cardWidth + (teams.length - 1) * gap;
      const startX = (w - totalWidth) / 2;

      teams.forEach((team, index) => {
        const x = startX + index * (cardWidth + gap);
        const y = h / 2 - cardHeight / 2;
        
        const isDrawn = drawnTeams.includes(team.name);

        if (isDrawn) {
          // Face Up Card
          ctx.fillStyle = '#111';
          ctx.strokeStyle = '#CCFF00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, cardWidth, cardHeight, 8);
          ctx.fill();
          ctx.stroke();

          // Glow
          ctx.shadowColor = '#CCFF00';
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.fillText(team.name, x + cardWidth / 2, y + cardHeight / 2);
        } else {
          // Face Down Card
          ctx.fillStyle = '#222';
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, cardWidth, cardHeight, 8);
          ctx.fill();
          ctx.stroke();
          
          // Logo or pattern placeholder
          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.arc(x + cardWidth/2, y + cardHeight/2, 30, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      supabase.removeChannel(channel);
    };
  }, [teams, tournamentId, onComplete, supabase]);

  // Organizer trigger function
  const startDraw = async () => {
    setIsDrawing(true);
    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < shuffled.length; i++) {
      await new Promise(r => setTimeout(r, 800)); // 0.8s delay
      await supabase.channel(`draw_${tournamentId}`).send({
        type: 'broadcast',
        event: 'draw_pick',
        payload: { teamName: shuffled[i].name }
      });
    }

    await new Promise(r => setTimeout(r, 1000));
    await supabase.channel(`draw_${tournamentId}`).send({
      type: 'broadcast',
      event: 'draw_complete',
      payload: {}
    });
    
    setIsDrawing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center">
      <h2 className="absolute top-12 text-4xl font-black font-rajdhani text-white tracking-widest">
        THE DRAW CEREMONY
      </h2>
      
      <canvas 
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="w-full h-full"
      />

      {!isDrawing && (
        <button 
          onClick={startDraw}
          className="absolute bottom-12 btn-accent px-12 py-4 text-xl shadow-[0_0_30px_rgba(204,255,0,0.4)]"
        >
          START DRAW
        </button>
      )}
    </div>
  );
}
