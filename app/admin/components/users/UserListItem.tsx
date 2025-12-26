'use client';

import { Profile, RoleColors, roleColors, getUserRole } from './types';

interface UserListItemProps {
  user: Profile;
  currentUserRole: string;
  onRoleChange: (userId: string, newRole: 'admin' | 'exclusive' | 'basic' | 'owner') => void;
  onViewProfile: (user: Profile) => void;
  onCopyEmail: (email: string) => void;
}

export function UserListItem({
  user,
  currentUserRole,
  onRoleChange,
  onViewProfile,
  onCopyEmail,
}: UserListItemProps) {
  const role = getUserRole(user) || 'basic';
  const rc = roleColors[role] || roleColors.basic;

  return (
    <div className={`p-4 ${rc.bg} border ${rc.border} rounded-xl flex items-center gap-4 hover:scale-[1.005] transition-all`}>
      {/* Аватар */}
      <div 
        className={`w-12 h-12 rounded-xl ${!user.avatar && rc.bg} flex items-center justify-center text-xl ${rc.text} font-black border ${rc.border} ${user.avatar ? 'bg-cover bg-center' : ''}`}
        style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : {}}
      >
        {!user.avatar && (user.nickname?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?')}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white truncate">{user.nickname || 'Без никнейма'}</span>
          <select 
            value={role}
            onChange={(e) => onRoleChange(user.id, e.target.value as 'admin' | 'exclusive' | 'basic' | 'owner')}
            className="text-[9px] px-2 py-1 bg-black/30 border border-white/20 rounded-full font-bold cursor-pointer hover:bg-black/50 transition"
            disabled={currentUserRole === 'admin' && (role === 'admin' || role === 'owner')}
          >
            <option value="basic">○ BASIC</option>
            <option value="exclusive">◆ EXCLUSIVE</option>
            {currentUserRole === 'owner' && <option value="admin">★ ADMIN</option>}
            {currentUserRole === 'owner' && <option value="owner">♛ OWNER</option>}
            {currentUserRole === 'admin' && role === 'admin' && <option value="admin">★ ADMIN</option>}
            {currentUserRole === 'admin' && role === 'owner' && <option value="owner">♛ OWNER</option>}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          <button
            onClick={() => onCopyEmail(user.email)}
            className="p-1 hover:bg-white/10 rounded transition flex-shrink-0"
          >
            <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <div className="text-[10px] text-zinc-600">ID: {user.member_id || user.id?.slice(0, 8)}</div>
      </div>
      
      {/* Баланс */}
      <div className="text-right">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Баланс</div>
        <div className="text-lg font-black text-[#9d8df1]">
          {Number(user.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2}).replace(/\s/g, '.')} ₽
        </div>
        <div className="text-[9px] text-zinc-700 mt-0.5">
          {user.created_at && new Date(user.created_at).toLocaleDateString('ru-RU')}
        </div>
      </div>
      
      {/* Кнопка просмотра профиля */}
      <button
        onClick={() => onViewProfile(user)}
        className="p-3 bg-[#6050ba]/20 hover:bg-[#6050ba]/40 border border-[#6050ba]/30 rounded-xl transition-all"
        title="Просмотреть профиль"
      >
        <svg className="w-5 h-5 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>
  );
}
