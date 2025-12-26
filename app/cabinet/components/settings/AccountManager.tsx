'use client';
import React from 'react';

interface AccountManagerProps {
  userId: string;
  currentEmail: string;
}

/**
 * AccountManager - компонент для управления учетной записью
 * 
 * ПРИМЕЧАНИЕ: Функциональность связанных аккаунтов была перенесена
 * в отдельный компонент LinkedAccountsManager для улучшения архитектуры.
 * 
 * Этот компонент сохранен для будущих функций управления учетной записью,
 * таких как удаление аккаунта, экспорт данных и т.д.
 */
export default function AccountManager({ userId, currentEmail }: AccountManagerProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-blue-300 mb-1">Управление учетной записью</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Функция связанных аккаунтов была перемещена в секцию <strong>"Связанные аккаунты"</strong> выше.
              <br />
              Здесь будут добавлены дополнительные функции управления учетной записью.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Email учетной записи</span>
            <span className="text-xs text-white font-mono">{currentEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">ID пользователя</span>
            <span className="text-xs text-zinc-500 font-mono truncate max-w-[200px]">{userId}</span>
          </div>
        </div>
      </div>

      {/* Placeholder для будущих функций */}
      <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <p className="text-[10px] text-zinc-600 text-center">
          Дополнительные функции управления учетной записью появятся в будущих обновлениях
        </p>
      </div>
    </div>
  );
}
