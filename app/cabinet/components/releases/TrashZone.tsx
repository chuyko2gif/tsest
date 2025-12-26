"use client";
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface TrashZoneProps {
  isActive: boolean; // Есть ли активное перетаскивание
  isOver: boolean;   // Находится ли элемент над корзиной
}

export function TrashZone({ isActive, isOver }: TrashZoneProps) {
  const { setNodeRef } = useDroppable({
    id: 'trash-zone',
  });

  // Показываем корзину только когда идет перетаскивание
  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        transition-all duration-300 ease-out
        pointer-events-auto
        ${isOver ? 'scale-110' : 'scale-100'}
      `}
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      {/* Контейнер корзины */}
      <div className="relative flex flex-col items-center gap-2">
        {/* Иконка корзины */}
        <div className={`
          relative p-4 rounded-2xl
          transition-all duration-200 ease-out
          ${isOver 
            ? 'bg-red-500 shadow-2xl shadow-red-500/60' 
            : 'bg-red-500/20 backdrop-blur-md border-2 border-red-500/40'
          }
        `}>
          {/* Свечение при hover */}
          {isOver && (
            <div className="absolute inset-0 bg-red-400 rounded-2xl blur-xl opacity-50 -z-10" />
          )}

          {/* Иконка */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`
              transition-colors duration-200
              ${isOver ? 'text-white' : 'text-red-400'}
            `}
          >
            <path d="M3 6h18" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </div>

        {/* Текст подсказки - только при hover */}
        {isOver && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-bounce">
              Отпустите для удаления
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
