'use client';

import React from 'react';
import TicketAvatar from '@/components/icons/TicketAvatar';
import { UserProfile, UserTransaction } from '../types';

interface UserProfileModalProps {
  user: UserProfile;
  loading: boolean;
  releases: any[];
  payouts: any[];
  tickets: any[];
  transactions: UserTransaction[];
  onClose: () => void;
}

export default function ProfileModal({
  user,
  loading,
  releases,
  payouts,
  tickets,
  transactions,
  onClose,
}: UserProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8">
      <div className="bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border border-white/10 rounded-3xl max-w-4xl w-full overflow-y-auto">
        {/* Шапка */}
        <div className="sticky top-0 bg-[#1a1a1f]/95 backdrop-blur border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <TicketAvatar
              src={user.avatar}
              name={user.nickname}
              email={user.email}
              size="xl"
              role={user.role}
              showRing
              className="rounded-2xl"
            />
            <div>
              <h2 className="text-xl font-black">{user.nickname || 'Без никнейма'}</h2>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <UserRoleBadge role={user.role} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-xl transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Загрузка данных...</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard value={`${Number(user.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, '.')} ₽`} label="Баланс" color="emerald" />
              <StatCard value={releases.length} label="Релизов" color="purple" />
              <StatCard value={payouts.length} label="Выплат" color="amber" />
              <StatCard value={tickets.length} label="Тикетов" color="blue" />
            </div>
            
            {/* Транзакции */}
            <TransactionsList transactions={transactions} />
            
            {/* Дополнительная информация */}
            <ProfileInfo user={user} />
          </div>
        )}
      </div>
    </div>
  );
}

function UserRoleBadge({ role }: { role?: string }) {
  const config = {
    owner: 'bg-purple-500/20 text-purple-300',
    admin: 'bg-red-500/20 text-red-300',
    exclusive: 'bg-amber-500/20 text-amber-300',
  }[role || ''] || 'bg-zinc-500/20 text-zinc-300';

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${config}`}>
      {role?.toUpperCase() || 'BASIC'}
    </span>
  );
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple: 'bg-[#6050ba]/10 border-[#6050ba]/20 text-[#9d8df1]',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };

  return (
    <div className={`p-4 border rounded-xl text-center ${colorClasses[color]}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function TransactionsList({ transactions }: { transactions: UserTransaction[] }) {
  const typeConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    payout: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Выплата', icon: '+' },
    withdrawal: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Вывод', icon: '−' },
    refund: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Возврат', icon: '↺' },
    adjustment: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Корректировка', icon: '±' },
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'В обработке' },
    approved: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Одобрено' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отклонено' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Завершена' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отменена' },
    failed: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Ошибка' },
  };

  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        Все транзакции ({transactions.length})
      </h3>
      {transactions.length === 0 ? (
        <p className="text-zinc-500 text-sm">Нет транзакций</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map((tx) => {
            const isWithdrawalRequest = tx.source === 'withdrawal_request';
            const type = typeConfig[tx.type] || { bg: 'bg-zinc-500/20', text: 'text-zinc-300', label: tx.type, icon: '?' };
            const status = statusConfig[tx.status] || statusConfig.pending;
            
            return (
              <div key={`${tx.source}-${tx.id}`} className="p-3 bg-black/30 rounded-lg border border-white/5 hover:border-white/10 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 rounded ${type.bg} ${type.text} font-bold`}>
                      {type.icon} {isWithdrawalRequest ? 'Заявка на вывод' : type.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className={`font-bold text-sm ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {tx.type === 'withdrawal' ? '−' : '+'}{Number(tx.amount).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div className="space-y-1">
                  {isWithdrawalRequest ? (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-red-400 font-mono font-bold">№ ЗАЯВКИ:</span>
                        <span className="text-red-300 font-mono text-[10px]">{tx.id}</span>
                      </div>
                      {tx.bank_name && (
                        <div className="text-xs text-zinc-500">
                          <span className="text-zinc-600">Банк:</span> {tx.bank_name} | <span className="text-zinc-600">Карта:</span> {tx.card_number}
                        </div>
                      )}
                      {tx.admin_comment && (
                        <div className="text-xs text-blue-400">Комментарий: {tx.admin_comment}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-purple-400 font-mono font-bold">TX:</span>
                        <span className="text-purple-300 font-mono text-[10px]">{tx.id}</span>
                      </div>
                      {tx.reference_id && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-blue-400 font-mono font-bold">REF:</span>
                          <span className="text-blue-300 font-mono text-[10px]">{tx.reference_id}</span>
                        </div>
                      )}
                      {tx.description && (
                        <div className="text-xs text-zinc-500">{tx.description}</div>
                      )}
                    </>
                  )}
                  <div className="text-[10px] text-zinc-600">
                    {new Date(tx.created_at).toLocaleString('ru-RU', { 
                      day: 'numeric', month: 'long', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileInfo({ user }: { user: UserProfile }) {
  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
      <h3 className="font-bold mb-4">Информация о профиле</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-zinc-500">ID пользователя:</span>
          <span className="ml-2 text-zinc-300 font-mono text-xs">{user.id}</span>
        </div>
        <div>
          <span className="text-zinc-500">Дата регистрации:</span>
          <span className="ml-2 text-zinc-300">{user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}</span>
        </div>
        <div>
          <span className="text-zinc-500">Роль:</span>
          <span className="ml-2 text-zinc-300">{user.role || 'basic'}</span>
        </div>
      </div>
    </div>
  );
}
