'use client';

import { Profile } from './types';
import { UserListItem } from './UserListItem';

interface UserListProps {
  users: Profile[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentUserRole: string;
  onRoleChange: (userId: string, newRole: 'admin' | 'exclusive' | 'basic' | 'owner') => void;
  onViewProfile: (user: Profile) => void;
  onCopyEmail: (email: string) => void;
  onRefresh: () => void;
}

export function UserList({
  users,
  loading,
  error,
  totalCount,
  currentUserRole,
  onRoleChange,
  onViewProfile,
  onCopyEmail,
  onRefresh,
}: UserListProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Зарегистрированные пользователи ({users.length})</h3>
        <button onClick={onRefresh} className="text-[10px] px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition">
          Обновить
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
          <p className="text-red-400 text-sm">Ошибка: {error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="text-zinc-600 py-8 text-center">Загрузка пользователей...</div>
      ) : users.length === 0 ? (
        <div className="text-zinc-600 py-8 text-center">
          <p>Пользователей не найдено</p>
          <p className="text-xs mt-2">Всего в базе: {totalCount}</p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2" style={{ scrollbarWidth: 'none' }}>
          {users.map(user => (
            <UserListItem
              key={user.id}
              user={user}
              currentUserRole={currentUserRole}
              onRoleChange={onRoleChange}
              onViewProfile={onViewProfile}
              onCopyEmail={onCopyEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
