'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';
import { Release } from '../releases/types';

interface PaymentModalProps {
  show: boolean;
  release: Release | null;
  userId?: string | null;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export default function PaymentModal({ show, release, userId, onClose, onPaymentComplete }: PaymentModalProps) {
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [paymentComment, setPaymentComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show || !release) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, загрузите изображение (JPG, PNG или GIF)');
        return;
      }
      setPaymentReceipt(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!paymentReceipt) {
      setError('Прикрепите чек оплаты');
      return;
    }
    
    if (!userId || !supabase) {
      setError('Ошибка: пользователь не авторизован');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Загружаем чек в storage
      const fileExt = paymentReceipt.name.split('.').pop();
      const fileName = `${userId}/payment_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, paymentReceipt, {
          contentType: paymentReceipt.type,
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Ошибка загрузки файла: ${uploadError.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(fileName);
      
      // Обновляем релиз - меняем статус на pending (на модерации)
      const { error: updateError } = await supabase
        .from('releases_basic')
        .update({
          status: 'pending',
          payment_status: 'pending',
          payment_receipt_url: publicUrl,
          payment_comment: paymentComment || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', release.id)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      showSuccessToast('Релиз отправлен на модерацию!');
      onPaymentComplete();
      handleClose();
    } catch (err: any) {
      console.error('Ошибка при отправке оплаты:', err);
      setError(err.message || 'Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentReceipt(null);
    setPreviewUrl(null);
    setPaymentComment('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-up scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center ring-1 ring-orange-500/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Оплата релиза
              </h2>
              <p className="text-sm text-zinc-500 mt-1 truncate max-w-[250px]">
                {release.title}
              </p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Стоимость */}
          <div className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-400 mb-1">К оплате</div>
                <div className="text-3xl font-black text-orange-400">500 ₽</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Реквизиты */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Реквизиты для перевода
            </h3>
            
            <div className="space-y-2">
              <div className="p-2.5 bg-white/5 rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5">Сбербанк</div>
                <div className="text-sm font-mono font-bold text-white">5469 XXXX XXXX XXXX</div>
              </div>
              
              <div className="p-2.5 bg-white/5 rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5">Тинькофф</div>
                <div className="text-sm font-mono font-bold text-white">2200 XXXX XXXX XXXX</div>
              </div>
              
              <div className="p-2.5 bg-white/5 rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5">СБП (по номеру телефона)</div>
                <div className="text-sm font-mono font-bold text-white">+7 (XXX) XXX-XX-XX</div>
              </div>
            </div>
          </div>

          {/* Загрузка чека */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Загрузите чек оплаты
            </h3>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                paymentReceipt 
                  ? 'border-emerald-500/50 bg-emerald-500/10' 
                  : 'border-white/20 hover:border-white/40 bg-white/5'
              }`}>
                {previewUrl ? (
                  <div className="space-y-2">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-32 mx-auto rounded-lg shadow-lg"
                    />
                    <div className="text-xs text-emerald-400 font-medium">
                      ✓ Чек загружен
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Нажмите, чтобы заменить
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto text-zinc-500" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div className="text-xs text-zinc-400">
                      Нажмите или перетащите файл
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Комментарий */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Комментарий к оплате
            </h3>
            
            <textarea
              value={paymentComment}
              onChange={(e) => setPaymentComment(e.target.value)}
              placeholder="Имя отправителя, время перевода... (необязательно)"
              className="w-full h-20 px-3 py-2.5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none resize-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20 text-sm"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="text-sm text-red-400 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition text-sm"
            disabled={loading}
          >
            Отмена
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!paymentReceipt || loading}
            className={`px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-sm ${
              paymentReceipt && !loading
                ? 'bg-orange-500 hover:bg-orange-400 text-black cursor-pointer' 
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Отправка...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Отправить на модерацию
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
