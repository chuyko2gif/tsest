// Тестовая страница для проверки ролей
// Откройте в браузере: http://localhost:3000/test-roles

"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestRoles() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function test() {
      const result: any = {
        timestamp: new Date().toISOString(),
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        },
        auth: null,
        profile: null,
        errors: []
      };

      try {
        if (!supabase) {
          result.errors.push('Supabase client is null');
          setInfo(result);
          setLoading(false);
          return;
        }
        
        const sb = supabase; // local alias for TypeScript
        
        // Проверка авторизации
        const { data: { user }, error: authError } = await sb.auth.getUser();
        result.auth = {
          isAuthenticated: !!user,
          email: user?.email,
          id: user?.id,
          error: authError?.message
        };

        if (user) {
          // Проверка профиля
          const { data: profile, error: profileError } = await sb
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          result.profile = {
            data: profile,
            error: profileError?.message,
            hasRole: !!profile?.role,
            role: profile?.role
          };
        }
      } catch (e: any) {
        result.errors.push(e.message);
      }

      setInfo(result);
      setLoading(false);
    }

    test();
  }, []);

  if (loading) return <div className="p-8 text-white">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🔍 Тест проверки ролей</h1>
      
      <div className="bg-zinc-900 rounded-lg p-6 mb-4">
        <h2 className="text-xl font-bold mb-4 text-green-400">Переменные окружения</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(info?.env, null, 2)}</pre>
      </div>

      <div className="bg-zinc-900 rounded-lg p-6 mb-4">
        <h2 className="text-xl font-bold mb-4 text-blue-400">Авторизация</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(info?.auth, null, 2)}</pre>
      </div>

      <div className="bg-zinc-900 rounded-lg p-6 mb-4">
        <h2 className="text-xl font-bold mb-4 text-purple-400">Профиль из БД</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(info?.profile, null, 2)}</pre>
      </div>

      {info?.errors?.length > 0 && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-400">Ошибки</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(info.errors, null, 2)}</pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-zinc-800 rounded">
        <p className="text-sm text-zinc-400">
          ✅ Если вы авторизованы и ваша роль = "admin", то доступ к /admin должен работать
        </p>
        <p className="text-sm text-zinc-400 mt-2">
          ❌ Если роль не "admin" - доступ будет запрещен
        </p>
      </div>

      <div className="mt-4">
        <a href="/admin" className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg inline-block">
          Попробовать открыть /admin
        </a>
      </div>
    </div>
  );
}
