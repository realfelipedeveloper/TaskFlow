'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  AUTH_SESSION_EVENT,
  clearSession,
  getSessionToken,
  getSessionUser,
  type SessionUser,
  updateSessionUser,
} from '@/lib/session';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const syncUser = () => {
      setUser(getSessionUser());
    };

    syncUser();
    window.addEventListener('focus', syncUser);
    window.addEventListener(AUTH_SESSION_EVENT, syncUser);

    return () => {
      window.removeEventListener('focus', syncUser);
      window.removeEventListener(AUTH_SESSION_EVENT, syncUser);
    };
  }, [pathname]);

  useEffect(() => {
    const refreshSession = async () => {
      const token = getSessionToken();

      if (!token) return;

      try {
        const res = await api.get('/users/me');
        if (res.data) {
          updateSessionUser(res.data);
          setUser(res.data);
        }
      } catch (error) {
        console.error('Erro ao sincronizar sessão do usuário', error);
        clearSession();
        router.replace('/login');
      }
    };

    void refreshSession();
  }, [pathname, router]);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const roleNames = useMemo(() => {
    if (!Array.isArray(user?.roles)) return [];

    return user.roles
      .map((role: any) => {
        if (typeof role === 'string') return role;
        return role?.role?.name ?? role?.name ?? null;
      })
      .filter(Boolean);
  }, [user]);

  const isAdmin = roleNames.includes('Admin');

  return (
    <nav className="bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-black text-white tracking-tight">
            { /* TaskFlow - <span className="text-blue-500">Dashboard</span> */ }
            <img src="/taskflow/logov3.png" alt="ABBATECH" style={{ width: 200 }} />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">

          {isAdmin && (
            <>
              <Link
                href="/admin/projects"
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all border bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20"
                style={{ fontWeight: 700, fontSize: 14 }}
              >
                Gerenciar Projetos
              </Link>

              <Link
                href="/admin/users"
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all border bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20"
                style={{ fontWeight: 700, fontSize: 14 }}
              >
                Gerenciar Usuários
              </Link>
            </>
          )}

          <div className="h-8 w-px bg-white/10 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-2">

              {/* 🔥 Nome dinâmico */}
              <span className="text-xs font-bold text-white leading-none">
                {user?.name || '...'}
              </span>

              {/* 🔥 Role dinâmica */}
              <span className="text-[10px] text-gray-500 font-medium">
                {roleNames[0] || ''}
              </span>

            </div>

            <button
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-xs font-black transition-all"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
