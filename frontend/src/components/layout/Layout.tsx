import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from '@/components/layout/Navbar';
import { AuroraBackground } from '@/components/ui/AuroraBackground';

const FULL_WIDTH_ROUTES = ['/'];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isFullWidth = FULL_WIDTH_ROUTES.includes(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-[#030307] text-slate-100 relative selection:bg-violet-500/30">
      {/* Global Ambient Aurora Background */}
      <AuroraBackground />

      <Navbar />

      <main className={`flex-1 ${isFullWidth ? 'w-full' : 'pt-20'}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={isFullWidth ? '' : 'mx-auto w-full max-w-6xl px-4 py-2 sm:px-6'}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
