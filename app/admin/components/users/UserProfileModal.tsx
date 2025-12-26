'use client';

import { Profile, Transaction, Release, Payout, Ticket } from './types';
import { TransactionList } from './TransactionList';

interface UserProfileModalProps {
  user: Profile;
  profileLoading: boolean;
  userReleases: Release[];
  userPayouts: Payout[];
  userTickets: Ticket[];
  userTransactions: Transaction[];
  currentUserRole: string;
  editingProfile: boolean;
  setEditingProfile: (value: boolean) => void;
  editNickname: string;
  setEditNickname: (value: string) => void;
  editAvatar: string;
  setEditAvatar: (value: string) => void;
  onSaveProfile: () => void;
  onClose: () => void;
}

export function UserProfileModal({
  user,
  profileLoading,
  userReleases,
  userPayouts,
  userTickets,
  userTransactions,
  currentUserRole,
  editingProfile,
  setEditingProfile,
  editNickname,
  setEditNickname,
  editAvatar,
  setEditAvatar,
  onSaveProfile,
  onClose,
}: UserProfileModalProps) {
  const roleColorClass = user.role === 'owner' ? 'bg-purple-500/20 text-purple-300' :
    user.role === 'admin' ? 'bg-red-500/20 text-red-300' :
    user.role === 'exclusive' ? 'bg-amber-500/20 text-amber-300' :
    'bg-zinc-500/20 text-zinc-300';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Шапка профиля */}
        <div className="sticky top-0 bg-[#1a1a1f]/95 backdrop-blur border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div 
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2 overflow-hidden ${user.avatar ? 'bg-cover bg-center' : 'bg-gradient-to-br from-[#6050ba] to-[#4a3d8f]'} border-[#6050ba]/50`}
              style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : 'none' }}
            >
              {!user.avatar && (user.nickname?.charAt(0)?.toUpperCase() || '?')}
            </div>
            <div>
              <h2 className="text-xl font-black">{user.nickname || 'Без никнейма'}</h2>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${roleColorClass}`}>
                  {user.role?.toUpperCase() || 'BASIC'}
                </span>
                <span className="text-[10px] text-zinc-500">{user.member_id}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Кнопка редактирования (только для Owner) */}
            {currentUserRole === 'owner' && (
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className={`p-3 rounded-xl transition ${editingProfile ? 'bg-[#8b5cf6]/30 text-[#a78bfa]' : 'hover:bg-white/10'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {profileLoading ? (
          <div className="p-12 text-center text-zinc-500">Загрузка данных...</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Форма редактирования (только для Owner) */}
            {currentUserRole === 'owner' && editingProfile && (
              <div className="p-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-xl space-y-4">
                <h3 className="font-bold text-[#a78bfa] flex items-center gap-2">
                  <span>♛</span> Редактирование профиля (Owner)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Никнейм</label>
                    <input
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">URL аватара</label>
                    <input
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSaveProfile}
                    className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c4dff] rounded-xl text-sm font-bold transition"
                  >
                    Сохранить изменения
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
            
            {/* Статистика */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-400">{Number(user.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, '.')} ₽</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Баланс</div>
              </div>
              <div className="p-4 bg-[#6050ba]/10 border border-[#6050ba]/20 rounded-xl text-center">
                <div className="text-2xl font-black text-[#9d8df1]">{userReleases.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Релизов</div>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <div className="text-2xl font-black text-amber-400">{userPayouts.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Выплат</div>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                <div className="text-2xl font-black text-blue-400">{userTickets.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Тикетов</div>
              </div>
            </div>
            
            {/* Все транзакции */}
            <TransactionList transactions={userTransactions} />
            
            {/* Дополнительная информация */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <h3 className="font-bold mb-4">Информация о профиле</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">ID пользователя:</span>
                  <span className="ml-2 text-zinc-300 font-mono text-xs">{user.id}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Member ID:</span>
                  <span className="ml-2 text-zinc-300">{user.member_id || '—'}</span>
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
          </div>
        )}
      </div>
    </div>
  );
}
