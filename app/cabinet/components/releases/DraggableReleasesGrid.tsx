"use client";
import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { Release } from './types';
import { UserRole } from '../../lib/types';
import { SortableReleaseCard } from './SortableReleaseCard';
import { TrashZone } from './TrashZone';
import { AddReleaseCard } from './ReleaseCard';

interface DraggableReleasesGridProps {
  releases: Release[];
  userRole?: UserRole;
  showArchive: boolean;
  onReleaseClick: (release: Release) => void;
  onAddRelease: () => void;
  onDeleteDraft?: (releaseId: string) => Promise<void>;
  onReorderDrafts?: (releaseId: string, newPosition: number, releaseType: 'basic' | 'exclusive') => Promise<boolean>;
}

export function DraggableReleasesGrid({
  releases,
  userRole,
  showArchive,
  onReleaseClick,
  onAddRelease,
  onDeleteDraft,
  onReorderDrafts,
}: DraggableReleasesGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [localReleases, setLocalReleases] = useState(releases);

  // Обновляем локальные релизы при изменении пропсов
  React.useEffect(() => {
    setLocalReleases(releases);
  }, [releases]);

  // Настройка сенсоров для drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Начинаем drag после 8px движения (предотвращает случайный drag при клике)
      },
    })
  );

  // Получаем перетаскиваемый релиз
  const activeRelease = activeId ? releases.find(r => r.id === activeId) : null;

  // Обработчик начала перетаскивания
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  // Обработчик перемещения над элементами
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    
    // Проверяем, находимся ли мы над корзиной
    if (over?.id === 'trash-zone') {
      setIsOverTrash(true);
    } else {
      setIsOverTrash(false);
    }
  };

  // Обработчик окончания перетаскивания
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setIsOverTrash(false);

    if (!over) {
      // Отпустили в пустоту - возвращаем на место
      setActiveId(null);
      return;
    }

    // СЛУЧАЙ 1: Перетащили на корзину - УДАЛЕНИЕ
    if (over.id === 'trash-zone') {
      const releaseToDelete = releases.find(r => r.id === active.id);
      
      if (releaseToDelete && releaseToDelete.status === 'draft') {
        // Показываем визуальный эффект удаления
        setLocalReleases(prev => prev.filter(r => r.id !== active.id));
        
        // Вызываем функцию удаления
        if (onDeleteDraft) {
          try {
            await onDeleteDraft(active.id as string);
          } catch (error) {
            console.error('Ошибка удаления:', error);
            // Восстанавливаем элемент в случае ошибки
            setLocalReleases(releases);
          }
        }
      }
      
      setActiveId(null);
      return;
    }

    // СЛУЧАЙ 2: Перетащили на другой релиз - СОРТИРОВКА
    if (active.id !== over.id) {
      // Работаем только с черновиками из localReleases
      const draftReleases = localReleases.filter(r => r.status === 'draft');
      const oldIndex = draftReleases.findIndex(r => r.id === active.id);
      const newIndex = draftReleases.findIndex(r => r.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Оптимистичное обновление UI
        const reorderedDrafts = arrayMove(draftReleases, oldIndex, newIndex);
        
        // Обновляем локальное состояние: сначала не-черновики, потом черновики
        const nonDrafts = localReleases.filter(r => r.status !== 'draft');
        setLocalReleases([...nonDrafts, ...reorderedDrafts]);

        // Сохраняем в базу данных
        if (onReorderDrafts) {
          const draggedRelease = draftReleases[oldIndex];
          const newPosition = newIndex + 1; // draft_order начинается с 1

          try {
            const success = await onReorderDrafts(
              draggedRelease.id,
              newPosition,
              draggedRelease.release_type as 'basic' | 'exclusive'
            );

            if (!success) {
              // Откатываем изменения при ошибке
              setLocalReleases(releases);
            }
          } catch (error) {
            console.error('Ошибка при изменении порядка:', error);
            setLocalReleases(releases);
          }
        }
      }
    }

    setActiveId(null);
  };

  // Обработчик отмены перетаскивания (ESC)
  const handleDragCancel = () => {
    setActiveId(null);
    setIsOverTrash(false);
  };

  // Фильтруем только черновики для sortable context
  const draftReleases = localReleases.filter(r => r.status === 'draft');
  const draftIds = draftReleases.map(r => r.id);

  // Проверка на пустое состояние
  const isEmpty = releases.length === 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[snapCenterToCursor]}
    >
      <div className="relative">
        {/* Сетка с релизами */}
        <SortableContext items={draftIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pb-32">
            {/* Карточка добавления релиза */}
            {!showArchive && (
              <>
                {userRole === 'exclusive' && <AddReleaseCard onClick={onAddRelease} />}
                {userRole === 'basic' && <AddReleaseCard onClick={onAddRelease} />}
                {(userRole === 'admin' || userRole === 'owner') && <AddReleaseCard onClick={onAddRelease} />}
              </>
            )}

            {/* Карточки релизов */}
            {localReleases.map((release) => (
              <SortableReleaseCard
                key={release.id}
                release={release}
                onClick={() => onReleaseClick(release)}
                isDragging={activeId === release.id}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      {/* Зона корзины - вынесена наружу для правильного fixed-позиционирования */}
      {showArchive && draftReleases.length > 0 && (
        <TrashZone isActive={activeId !== null} isOver={isOverTrash} />
      )}

      {/* Overlay для перетаскиваемого элемента */}
      <DragOverlay
        dropAnimation={{
          duration: 300,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeRelease && (
          <div style={{ cursor: 'grabbing' }}>
            <SortableReleaseCard
              release={activeRelease}
              onClick={() => {}}
              isDragging={false}
              isOverlay
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
