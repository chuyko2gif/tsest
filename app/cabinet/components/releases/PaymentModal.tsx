"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

export default function PaymentModal({ isOpen, onClose, userId }: PaymentModalProps) {
  const router = useRouter();
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!paymentReceipt) {
      alert('Прикрепите чек оплаты');
      return;
    }
    
    if (!userId) {
      alert('Ошибка: пользователь не авторизован');
      return;
    }
    
    setPaymentLoading(true);
    
    try {
      if (!supabase) throw new Error('Supabase не инициализирован');
      
      // Проверяем, что файл - изображение
      if (!paymentReceipt.type.startsWith('image/')) {
        alert('Пожалуйста, загрузите изображение (JPG, PNG или GIF)');
        setPaymentLoading(false);
        return;
      }
      
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
      
      // Сохраняем информацию о чеке в localStorage
      localStorage.setItem('basic_payment_receipt', publicUrl);
      localStorage.setItem('basic_payment_amount', '500');
      
      setPaymentLoading(false);
      onClose();
      setPaymentReceipt(null);
      
      // Перенаправляем на страницу создания релиза
      router.push('/cabinet/release-basic/create');
    } catch (error: any) {
      console.error('Ошибка при обработке платежа:', error);
      alert(`Произошла ошибка: ${error.message || 'Попробуйте еще раз'}`);
      setPaymentLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d0d0f] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
        {/* Кнопка закрытия */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
          </svg>
        </button>

        {/* Заголовок */}
        <div className="mb-6">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Оплата релиза</h3>
          <p className="text-sm text-zinc-500">Переведите 500₽ и прикрепите чек оплаты</p>
        </div>

        {/* Информация о стоимости */}
        <div className="p-4 bg-[#6050ba]/10 border border-[#6050ba]/30 rounded-xl mb-6">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Стоимость публикации</span>
            <span className="text-2xl font-bold text-white">500₽</span>
          </div>
        </div>

        {/* Реквизиты */}
        <PaymentDetails />

        {/* Загрузка чека */}
        <ReceiptUpload 
          receipt={paymentReceipt}
          setReceipt={setPaymentReceipt}
        />

        {/* Кнопка оплатить */}
        <button
          onClick={handleSubmit}
          disabled={!paymentReceipt || paymentLoading}
          className="w-full px-6 py-4 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition text-white"
        >
          {paymentLoading ? 'Обработка...' : 'Оплатить'}
        </button>

        <p className="text-xs text-zinc-500 text-center mt-4">
          После проверки платежа вы получите доступ к публикации релиза
        </p>
      </div>
    </div>
  );
}

// Компонент реквизитов
function PaymentDetails() {
  return (
    <div className="mb-6 space-y-3">
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="text-xs text-zinc-500 mb-1">Номер карты</div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-white">2200 7007 1234 5678</div>
          <button 
            onClick={() => navigator.clipboard.writeText('2200700712345678')}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition"
          >
            Копировать
          </button>
        </div>
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="text-xs text-zinc-500 mb-1">Получатель</div>
        <div className="text-white">thqlabel</div>
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="text-xs text-zinc-500 mb-1">СБП (Номер телефона)</div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-white">+7 900 123 45 67</div>
          <button 
            onClick={() => navigator.clipboard.writeText('+79001234567')}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition"
          >
            Копировать
          </button>
        </div>
      </div>
    </div>
  );
}

// Компонент загрузки чека
interface ReceiptUploadProps {
  receipt: File | null;
  setReceipt: (file: File | null) => void;
}

function ReceiptUpload({ receipt, setReceipt }: ReceiptUploadProps) {
  return (
    <div className="mb-6">
      <label className="text-sm text-zinc-400 mb-2 block">Чек или скриншот оплаты *</label>
      {receipt ? (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <div className="text-sm text-white font-medium">{receipt.name}</div>
              <div className="text-xs text-zinc-500">{(receipt.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
          <button 
            onClick={() => setReceipt(null)}
            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition"
          >
            Удалить
          </button>
        </div>
      ) : (
        <label className="block p-6 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#6050ba]/50 transition text-center">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setReceipt(file);
            }}
          />
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/>
              <polyline points="17 8 12 3 7 8" strokeWidth="2"/>
              <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2"/>
            </svg>
          </div>
          <div className="text-sm text-zinc-300 font-medium mb-1">Загрузить файл</div>
          <div className="text-xs text-zinc-500">JPG, PNG до 5 МБ</div>
        </label>
      )}
    </div>
  );
}
