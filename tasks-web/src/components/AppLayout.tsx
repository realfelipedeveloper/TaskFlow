'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AUTH_SESSION_EVENT, hasActiveSession } from '@/lib/session';
import { Footer } from './Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login' || pathname === '/recover-password';
  const [isAuthorized, setIsAuthorized] = useState(isLoginPage);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const syncSession = () => {
      const authenticated = hasActiveSession();

      if (isLoginPage) {
        setIsAuthorized(true);
        setIsCheckingSession(false);
        return;
      }

      if (!authenticated) {
        setIsAuthorized(false);
        setIsCheckingSession(false);
        router.replace('/login');
        return;
      }

      setIsAuthorized(true);
      setIsCheckingSession(false);
    };

    syncSession();
    window.addEventListener('focus', syncSession);
    window.addEventListener(AUTH_SESSION_EVENT, syncSession);

    return () => {
      window.removeEventListener('focus', syncSession);
      window.removeEventListener(AUTH_SESSION_EVENT, syncSession);
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <main className="flex-1 overflow-x-hidden">{children}</main>;
  }

  if (isCheckingSession || !isAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f172a] text-slate-100">
        <div className="text-blue-500 font-black animate-bounce text-2xl tracking-tighter">
          TASKFLOW
        </div>
      </main>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0f172a] text-slate-100 selection:bg-blue-500/30">
      <Navbar />
      <main className="p-4 md:p-8 animate-fade-in max-w-7xl mx-auto w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
