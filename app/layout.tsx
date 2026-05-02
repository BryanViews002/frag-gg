import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'FRAG.GG — The Premier CODM Competitive Platform',
  description:
    'Compete, dominate, and get recognized. Tournaments, clans, leaderboards, and community for Call of Duty: Mobile players. 100% free.',
  keywords: ['CODM', 'Call of Duty Mobile', 'tournaments', 'esports', 'clans', 'competitive', 'FRAG.GG'],
  openGraph: {
    title: 'FRAG.GG — The Premier CODM Competitive Platform',
    description: 'Compete. Dominate. Get Recognized.',
    siteName: 'FRAG.GG',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Navbar />
        <main className="mobile-nav-padding" style={{ paddingTop: '64px', minHeight: '100vh' }}>
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-accent)',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem',
            },
            success: {
              iconTheme: { primary: '#00FF87', secondary: '#000' },
            },
            error: {
              iconTheme: { primary: '#FF4500', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
