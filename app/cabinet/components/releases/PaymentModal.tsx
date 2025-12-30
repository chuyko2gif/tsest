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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/10" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Декоративные градиенты */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Кнопка закрытия */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition group"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-400 group-hover:text-white transition">
            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2.5"/>
            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.5"/>
          </svg>
        </button>

        {/* Заголовок */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4 ring-1 ring-amber-500/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <h3 className="text-2xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-2">Оплата релиза</h3>
          <p className="text-sm text-zinc-500">Переведите 500₽ и прикрепите чек оплаты</p>
        </div>

        {/* Информация о стоимости */}
        <div className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-zinc-400 text-sm block mb-1">Стоимость публикации</span>
              <span className="text-3xl font-black text-amber-400">500 ₽</span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-500/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
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
          className={`relative w-full px-6 py-4 rounded-xl font-bold transition overflow-hidden group ${
            paymentReceipt && !paymentLoading
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black cursor-pointer shadow-lg shadow-amber-500/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {paymentReceipt && !paymentLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          )}
          <span className="relative flex items-center justify-center gap-2">
            {paymentLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Обработка...
              </>
            ) : (
              <>
                Подтвердить оплату
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </span>
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
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Можно добавить toast уведомление
  };

  return (
    <div className="mb-6 space-y-3">
      <h4 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        Реквизиты для перевода
      </h4>
      
      <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:border-purple-500/30 transition group">
        <div className="text-xs text-zinc-500 mb-1">Номер карты (Тинькофф)</div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-white font-medium">2200 7007 1234 5678</div>
          <button 
            onClick={() => copyToClipboard('2200700712345678', 'Номер карты')}
            className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Копировать
          </button>
        </div>
      </div>

      <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:border-purple-500/30 transition group">
        <div className="text-xs text-zinc-500 mb-1">Получатель</div>
        <div className="text-white font-medium">THQ Label</div>
      </div>

      <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:border-purple-500/30 transition group">
        <div className="text-xs text-zinc-500 mb-1">СБП (Номер телефона)</div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-white font-medium">+7 900 123 45 67</div>
          <button 
            onClick={() => copyToClipboard('+79001234567', 'Номер телефона')}
            className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Копировать
          </button>
        </div>
      </div>
      
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div className="flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-400 flex-shrink-0 mt-0.5" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="text-xs text-yellow-300">
            В комментарии к переводу укажите ваш email для идентификации платежа
          </div>
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
      <label className="text-sm font-bold text-zinc-300 mb-3 block flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Загрузите чек оплаты
      </label>
      {receipt ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div className="text-sm text-white font-medium">{receipt.name}</div>
              <div className="text-xs text-emerald-400">{(receipt.size / 1024).toFixed(1)} KB • Готово к отправке</div>
            </div>
          </div>
          <button 
            onClick={() => setReceipt(null)}
            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium transition"
          >
            Удалить
          </button>
        </div>
      ) : (
        <label className="block p-6 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5 transition text-center group">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setReceipt(file);
            }}
          />
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/10 group-hover:ring-purple-500/30 transition">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-400 group-hover:text-purple-400 transition" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="text-sm text-zinc-300 font-medium mb-1 group-hover:text-white transition">Нажмите или перетащите файл</div>
          <div className="text-xs text-zinc-500">Скриншот или фото чека (JPG, PNG до 5 МБ)</div>
        </label>
      )}
    </div>
  );
}
