'use client';

import Link from 'next/link';
import { Swords, Twitter, Youtube, MessageCircle, ArrowUp } from 'lucide-react';

const NAV_LINKS = [
  { href: '/tournaments',    label: 'Tournaments' },
  { href: '/leaderboards',   label: 'Leaderboards' },
  { href: '/find-teammates', label: 'Find Teammates' },
  { href: '/clans',          label: 'Clans' },
  { href: '/community',      label: 'Community' },
];

const SOCIAL = [
  { icon: Twitter,       href: '#', label: 'Twitter', color: '#1DA1F2' },
  { icon: Youtube,       href: '#', label: 'YouTube',  color: '#FF0000' },
  { icon: MessageCircle, href: '#', label: 'Discord',  color: '#5865F2' },
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer
      style={{
        background: 'var(--bg-secondary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ghost background wordmark */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-0.5rem', right: '-1rem',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(7rem, 18vw, 14rem)',
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.028)',
          letterSpacing: '-0.02em',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        FRAG
      </div>

      <div className="footer-top-bar" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">

          {/* Brand — spans 2 cols on md */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,107,0,0.08))',
                border: '1px solid rgba(255,69,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Swords size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <span
                className="font-rajdhani font-bold text-2xl"
                style={{
                  background: 'linear-gradient(135deg, #FF5500, #FF8C00)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                FRAG.GG
              </span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: '28ch' }}>
              The premier CODM competitive platform. Compete. Dominate. Get Recognized.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-3 mt-6">
              {SOCIAL.map(({ icon: Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="footer-social group"
                  style={{ '--social-color': color } as React.CSSProperties}
                >
                  <Icon size={15} />
                  <span
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: `${color}14` }}
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h3
              className="font-inter font-semibold text-xs uppercase tracking-[0.14em] mb-5"
              style={{ color: 'var(--text-muted)' }}
            >
              Platform
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="footer-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Status + back to top */}
          <div>
            <h3
              className="font-inter font-semibold text-xs uppercase tracking-[0.14em] mb-5"
              style={{ color: 'var(--text-muted)' }}
            >
              Status
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="live-dot" style={{ background: 'var(--neon-green)', animation: 'livePulse 2s ease-in-out infinite' }} />
              <span style={{ color: 'var(--neon-green)', fontSize: '0.82rem', fontWeight: 600 }}>
                All Systems Operational
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              100% Free at launch.<br />No pay-to-win. No BS.
            </p>
            <button
              onClick={scrollToTop}
              className="btn-ghost"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem', gap: '0.4rem' }}
            >
              <ArrowUp size={13} /> Back to Top
            </button>
          </div>
        </div>

        <div className="section-divider mt-12" />
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>
            &copy; {new Date().getFullYear()} FRAG.GG. All rights reserved.
          </p>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>
            Not affiliated with Activision or TiMi Studios.
          </p>
        </div>
      </div>
    </footer>
  );
}
