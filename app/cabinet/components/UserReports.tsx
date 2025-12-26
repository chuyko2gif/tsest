"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserReportsProps {
  userId?: string | null;
}

export default function UserReports({ userId }: UserReportsProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) { setReports([]); setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          setReports([]);
          setLoading(false);
          return;
        }
        const { data } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', userId)
          .order('period', { ascending: false });
        setReports(data || []);
      } catch (e) {
        console.warn('Не удалось загрузить отчёты:', e);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const downloadReport = (report: any) => {
    const csvContent = [
      'Период,Платформа,Прослушивания,Доход',
      `${report.period},${report.platform || 'Все'},${report.streams || 0},${report.amount || 0} ₽`
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `THQ_Report_${report.period}.csv`;
    link.click();
  };

  if (loading) return <div className="text-zinc-600">Загрузка отчётов...</div>;
  
  if (!reports.length) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
          <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-zinc-500 mb-2">Отчётов пока нет</p>
        <p className="text-xs text-zinc-600">Отчёты появятся после первой выплаты</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map(report => (
        <div 
          key={report.id} 
          className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-[#6050ba]/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#6050ba]/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-white">{report.period}</div>
                <div className="text-xs text-zinc-500">
                  {report.platform || 'Все платформы'} • {report.streams || 0} прослушиваний
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xl font-black text-emerald-400">{(report.amount || 0).toFixed(2)} ₽</div>
                <div className="text-[10px] text-zinc-500">{new Date(report.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
              <button 
                onClick={() => downloadReport(report)}
                className="p-3 bg-[#6050ba]/20 hover:bg-[#6050ba]/40 rounded-xl transition-all"
                title="Скачать отчёт"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
