"use client";
import React from 'react';

export default function ArchiveTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <p className="text-zinc-500 text-sm">Архивные записи и отклонённые материалы</p>
      </div>
      <div className="text-center py-20 text-zinc-600">
        <div className="text-6xl mb-4">🗄️</div>
        <p>Архив пуст</p>
      </div>
    </div>
  );
}
