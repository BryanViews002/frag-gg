'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RequireAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequireAuthModal({ isOpen, onClose }: RequireAuthModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleAction = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 bg-[#111] border border-[#333] rounded-xl shadow-2xl text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-black italic tracking-tight text-white mb-2">
          YOU NEED AN ACCOUNT
        </h2>
        <p className="text-gray-400 mb-8">
          Create a free FRAG.GG account to access this feature.
          <br />
          <span className="text-sm italic text-gray-500 mt-2 block">
            Takes less than 2 minutes
          </span>
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => handleAction('/register')}
            className="w-full py-3 px-6 bg-[#CCFF00] hover:bg-[#b3e600] text-black font-bold uppercase italic tracking-wider rounded-lg transition-colors"
          >
            CREATE ACCOUNT
          </button>
          <button 
            onClick={() => handleAction('/login')}
            className="w-full py-3 px-6 bg-[#222] hover:bg-[#333] text-white font-bold uppercase italic tracking-wider rounded-lg transition-colors"
          >
            LOGIN
          </button>
        </div>
      </div>
    </div>
  );
}
