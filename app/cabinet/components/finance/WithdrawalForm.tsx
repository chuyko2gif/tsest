'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface WithdrawalFormProps {
  userId: string;
  balance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
  reloadRequests: () => void;
}

export default function WithdrawalForm({
  userId,
  balance,
  onClose,
  onSuccess,
  showNotification,
  reloadRequests,
}: WithdrawalFormProps) {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleSubmit = async () => {
    console.log('🔵 Кнопка "Отправить заявку" нажата!');
    
    if (!supabase || !userId) {
      console.log('❌ Нет авторизации');
      return showNotification('Необходима авторизация', 'error');
    }
    
    const amount = Number(withdrawalAmount);
    
    if (!amount || amount < 1000) {
      return showNotification('Минимальная сумма вывода: 1000 ₽', 'error');
    }
    if (amount > balance) {
      return showNotification('Недостаточно средств на балансе', 'error');
    }
    if (!bankName.trim() || !cardNumber.trim() || !recipientName.trim()) {
      return showNotification('Заполните все обязательные поля', 'error');
    }
    
    try {
      // Замораживаем средства
      const newBalance = balance - amount;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
      
      if (balanceError) {
        console.error('❌ Ошибка обновления баланса:', balanceError);
        throw balanceError;
      }
      
      const { data: insertData, error } = await supabase.from('withdrawal_requests').insert({
        user_id: userId,
        amount,
        bank_name: bankName,
        card_number: cardNumber,
        recipient_name: recipientName,
        additional_info: additionalInfo || null,
        status: 'pending',
      }).select();
      
      if (error) {
        console.error('❌ Ошибка создания заявки:', error);
        await supabase.from('profiles').update({ balance }).eq('id', userId);
        showNotification('Ошибка создания заявки: ' + (error.message || error.hint || 'Проверьте консоль'), 'error');
        return;
      }
      
      console.log('✅ Заявка создана:', insertData);
      onSuccess(newBalance);
      showNotification(`Заявка создана! Средства (${amount.toLocaleString('ru')} ₽) заморожены до рассмотрения`, 'success');
      onClose();
      reloadRequests();
    } catch (e: any) {
      console.error('💥 Исключение:', e);
      showNotification('Ошибка: ' + (e.message || 'Неизвестная ошибка'), 'error');
    }
  };

  const isDisabled = 
    balance === 0 ||
    !withdrawalAmount ||
    Number(withdrawalAmount) < 1000 ||
    Number(withdrawalAmount) > balance ||
    !bankName.trim() ||
    !cardNumber.trim() ||
    !recipientName.trim();

  const getButtonText = () => {
    if (balance === 0) return '❌ Нет средств';
    if (!withdrawalAmount || Number(withdrawalAmount) < 1000) return '⚠️ Минимум 1000 ₽';
    if (Number(withdrawalAmount) > balance) return '❌ Недостаточно средств';
    if (!bankName.trim() || !cardNumber.trim() || !recipientName.trim()) return '📝 Заполните поля';
    return 'Отправить заявку';
  };

  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Заявка на вывод</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition">✕</button>
      </div>
      
      <div className="space-y-4">
        {/* Сумма */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
            Сумма вывода (мин. 1000 ₽)
          </label>
          <input
            type="number"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
            placeholder="1000"
            min="1000"
            max={balance}
            className={`w-full px-4 py-3 bg-black/30 border rounded-xl outline-none transition ${
              withdrawalAmount && (Number(withdrawalAmount) > balance || Number(withdrawalAmount) < 1000)
                ? 'border-red-500/50 focus:border-red-500'
                : 'border-white/10 focus:border-[#6050ba]'
            }`}
          />
          {withdrawalAmount && Number(withdrawalAmount) > balance && (
            <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              Недостаточно средств! Доступно: {balance.toLocaleString('ru-RU')} ₽
            </div>
          )}
          {withdrawalAmount && Number(withdrawalAmount) < 1000 && Number(withdrawalAmount) > 0 && (
            <div className="mt-2 text-xs text-orange-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              Минимальная сумма вывода: 1 000 ₽
            </div>
          )}
          {balance === 0 && (
            <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              На балансе нет средств для вывода
            </div>
          )}
        </div>
        
        {/* Банк */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
            Название банка
          </label>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Сбербанк, Тинькофф и т.д."
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-[#6050ba] transition"
          />
        </div>
        
        {/* Номер карты */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
            Номер карты / счёта
          </label>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="0000 0000 0000 0000"
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-[#6050ba] transition font-mono"
          />
        </div>
        
        {/* ФИО */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
            ФИО получателя
          </label>
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Иванов Иван Иванович"
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-[#6050ba] transition"
          />
        </div>
        
        {/* Доп. инфо */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
            Дополнительная информация (необязательно)
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Комментарий к выводу..."
            rows={3}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-[#6050ba] transition resize-none"
          />
        </div>
        
        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition"
          >
            Отмена
          </button>
          <button
            disabled={isDisabled}
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-[#6050ba] rounded-xl text-sm font-bold hover:bg-[#7060ca] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6050ba]"
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
