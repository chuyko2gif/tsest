'use client';

import React from 'react';
import { User, roleConfig } from './types';

interface UserCardProps {
  user: User;
  currentUserRole: 'admin' | 'owner';
  onViewProfile: (user: User) => void;
  onChangeRole: (userId: string, newRole: string) => void;
  onEditBalance: (userId: string, balance: string) => void;
  balanceEdit: { userId: string; balance: string } | null;
  setBalanceEdit: (edit: { userId: string; balance: string } | null) => void;
  onSaveBalance: (userId: string) => void;
}

export default function UserCard({
  user,
  currentUserRole,
  onViewProfile,
  onChangeRole,
  onEditBalance,
  balanceEdit,
  setBalanceEdit,
  onSaveBalance
}: UserCardProps) {
  const role = roleConfig[user.role] || roleConfig.basic;
  const isEditingBalance = balanceEdit?.userId === user.id;

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all">
      <div className="flex items-start gap-4">
        {/* Аватар */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.nickname}
              className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="font-bold text-white truncate">{user.nickname}</h3>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            
            {/* Роль */}
            <select
              value={user.role}
              onChange={(e) => onChangeRole(user.id, e.target.value)}
              disabled={currentUserRole === 'admin' && (user.role === 'admin' || user.role === 'owner')}
              className={`text-xs px-2 py-1 rounded-lg border cursor-pointer ${role.color} bg-transparent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="basic">Basic</option>
              <option value="exclusive">Exclusive</option>
              {currentUserRole === 'owner' && <option value="admin">Admin</option>}
              {currentUserRole === 'owner' && <option value="owner">Owner</option>}
            </select>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-zinc-600 font-mono">{user.member_id}</span>
            <span className="text-[10px] text-zinc-600">
              {new Date(user.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>

          {/* Баланс */}
          <div className="flex items-center gap-2 mt-3">
            {isEditingBalance ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={balanceEdit.balance}
                  onChange={(e) => setBalanceEdit({ ...balanceEdit, balance: e.target.value })}
                  className="w-24 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => onSaveBalance(user.id)}
                  className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs text-white"
                >
                  ✓
                </button>
                <button
                  onClick={() => setBalanceEdit(null)}
                  className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => onEditBalance(user.id, user.balance.toString())}
                className="text-sm font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {Number(user.balance).toLocaleString('ru-RU')} ₽
              </button>
            )}
          </div>
        </div>

        {/* Кнопка профиля */}
        <button
          onClick={() => onViewProfile(user)}
          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
          title="Профиль"
        >
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
