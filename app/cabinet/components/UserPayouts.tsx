"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserPayoutsProps {
  userId?: string | null;
}

export default function UserPayouts({ userId }: UserPayoutsProps) {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingP, setLoadingP] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) { setPayouts([]); setLoadingP(false); return; }

    const load = async () => {
      setLoadingP(true);
      try {
        if (!supabase) {
          setPayouts([]);
          setLoadingP(false);
          return;
        }
        const { data } = await supabase.from('payouts').select('*').eq('user_id', userId).order('year', { ascending: false }).order('quarter', { ascending: false });
        setPayouts(data || []);
      } catch (e) {
        console.warn('Не удалось загрузить выплаты:', e);
        setPayouts([]);
      } finally {
        setLoadingP(false);
      }
    };
    load();
  }, [userId]);

  if (loadingP) return <div className="text-zinc-600">Загрузка выплат...</div>;
  if (!payouts.length) return <div className="text-zinc-600">Платежей за текущие периоды не найдено</div>;

  // Группируем по году и кварталу
  const grouped: Record<string, any[]> = {};
  payouts.forEach(p => {
    const key = `${p.year}-Q${p.quarter}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  return (
    <div className="space-y-4">
      {Object.keys(grouped).map(key => {
        const items = grouped[key];
        const total = items.reduce((s, it) => s + Number(it.amount || 0), 0);
        const info = items[0];
        return (
          <div key={key} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
            <div>
              <div className="text-sm text-zinc-400">Квартал</div>
              <div className="text-lg font-black">{key}</div>
              {info?.note && <div className="text-xs text-zinc-500 mt-1">Примечание: {info.note}</div>}
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400">Выплачено</div>
              <div className="text-3xl font-black text-[#9d8df1]">{total.toFixed(2)} ₽</div>
              <div className="text-xs text-zinc-500 mt-1">Заполнил: {info?.paid_by || '—'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
