'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { verifyAdminSessionAction } from '@/lib/auth/adminAction';

const GENERIC_LOGIN_ERROR = 'Email hoặc mật khẩu không chính xác';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // If already authenticated with an active admin role, redirect directly to /admin
  useEffect(() => {
    let isMounted = true;
    const checkExistingSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const check = await verifyAdminSessionAction();
          if (check.ok && isMounted) {
            router.replace('/admin');
          }
        }
      } catch {
        // ignore check failure on login page
      }
    };
    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedInput = email.trim();
    const isAlias = trimmedInput.toLowerCase() === 'admin';
    const configuredAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@nganhaspa.internal';
    const loginEmail = isAlias ? configuredAdminEmail : trimmedInput;

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError || !signInData?.user) {
        // Generic error prevents user enumeration
        setError(GENERIC_LOGIN_ERROR);
        setLoading(false);
        return;
      }

      // Verify active admin role against WebbookingAdminUsers table
      const adminCheck = await verifyAdminSessionAction();
      if (!adminCheck.ok) {
        // Drop session for non-admin or inactive accounts
        await supabase.auth.signOut();
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          // ignore
        }
        setError(GENERIC_LOGIN_ERROR);
        setLoading(false);
        return;
      }

      router.replace('/admin');
      router.refresh();
    } catch (err) {
      console.error('[Admin Login Error]:', err);
      setError(GENERIC_LOGIN_ERROR);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white mb-2">Quản Trị Hệ Thống</h1>
          <p className="text-gray-400 text-sm">Vui lòng đăng nhập để tiếp tục</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email hoặc tên đăng nhập</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="admin hoặc email@domain.com"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
