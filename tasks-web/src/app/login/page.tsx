'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/Input';
import Link from 'next/link';
import { hasActiveSession, setSession } from '@/lib/session';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (hasActiveSession()) {
      router.replace('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { login, password });
      setSession(res.data.access_token, res.data.user);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Credenciais inválidas ou erro no servidor'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br p-4 relative overflow-hidden">
      {/* from-indigo-600 via-blue-700 to-indigo-900 */}

      {/* BACKGROUND FX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px]" />
      </div>

      {/* CARD */}
      <div className="card w-full max-w-md p-10 rounded-[2rem] shadow-2xl relative z-10">

        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm border border-white/20">
            {/* <span className="text-4xl">🚀</span> */}
            <img src="/taskflow/logov2.png" alt="ABBATECH" style={{ width: 120 }} />
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">
            TaskFlow
          </h1>

          <p className="text-indigo-100/60 mt-2 font-medium">
            Bem-vindo de volta!
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <Input
            label="Usuário ou E-mail"
            placeholder="Usuário ou E-mail"
            className="
              input
              bg-white/5
              border-white/10
              text-white
              placeholder:text-indigo-200/30
              focus:bg-white/10
              focus:border-white/20
            "
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            className="
              input
              bg-white/5
              border-white/10
              text-white
              placeholder:text-indigo-200/30
              focus:bg-white/10
              focus:border-white/20
            "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* ERROR */}
          {error && (
            <div className="urgent-border text-red-200 text-xs p-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            className="
              w-full
              h-12
              px-4
              py-2
              bg-blue-500/10
              hover:bg-blue-500/20
              text-blue-400
              text-sm
              font-bold
              border
              border-blue-500/20
              rounded-xl
            "
            style={{ fontWeight: 700, fontSize: 14 }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>

        </form>

        {/* FOOTER */}
        <p className="text-center mt-8 text-indigo-100/40 text-xs font-medium">
          Esqueceu sua senha?{' '}
          <Link href="/recover-password" className="text-white hover:underline">
            Recuperar acesso
          </Link>
        </p>

      </div>
    </div>
  );
}
