'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, FolderTree, Save, Plus } from 'lucide-react';

// Ширина шага вложенности в пикселях
const INDENTATION_WIDTH = 30;

// --- Вспомогательные функции ---

// Находит всех потомков элемента в плоском списке и возвращает их с индексами
const getDescendants = (items: any[], startIndex: number) => {
  const descendants = [];
  const parentDepth = items[startIndex].depth;
  for (let i = startIndex + 1; i < items.length; i++) {
    if (items[i].depth > parentDepth) {
      descendants.push({ ...items[i], index: i });
    } else {
      break;
    }
  }
  return descendants;
};

// --- Компонент элемента меню (для основного списка и фантома) ---

const MenuElementProps = {
  id: String,
  text: String,
  depth: Number,
  isOverlay: Boolean, // Флаг: рисуем ли мы фантом
  isDragging: Boolean, // Флаг: тащится ли этот конкретный элемент
  hasChildren: Boolean,
  onDelete: Function,
  onTextChange: Function,
  isGhost: Boolean, // Новое: элемент является частью перетаскиваемой группы (ребенок)
};

const MenuElement = ({ id, text, depth, isOverlay, isDragging, hasChildren, onDelete, onTextChange, isGhost }: any) => {
  // Вычисляем отступ. Если это фантом-потомок (isGhost), его отступ будет относительным в DragOverlay
  const marginLeft = isOverlay && isGhost ? `${depth * INDENTATION_WIDTH}px` : `${depth * INDENTATION_WIDTH}px`;

  const baseClasses = "flex items-center gap-3 p-3 bg-card border rounded-xl shadow-sm transition-all duration-150";
  const borderClasses = isOverlay 
    ? 'border-primary shadow-xl bg-background ring-2 ring-primary/20 scale-[1.02]' 
    : 'border-border hover:border-primary/40';
  
  // Элемент, который "остался на месте", делаем почти невидимым
  const opacityClass = isDragging && !isOverlay ? 'opacity-0' : 'opacity-100';

  return (
    <div style={{ marginLeft }} className={`group mb-1 relative ${opacityClass}`}>
      <div className={`${baseClasses} ${borderClasses}`}>
        {/* Хендл для захвата (только для родителя или одиночного пункта) */}
        {!isGhost && (
           <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary p-1">
            <GripVertical size={18} />
          </div>
        )}
        
        {/* Дети в фантоме не имеют хендла, добавляем отступ для выравнивания */}
        {isGhost && <div className="w-7" />}

        {/* Текст или инпут */}
        {isOverlay ? (
          <span className="flex-1 text-sm font-semibold truncate select-none">{text}</span>
        ) : (
          <input
            className="flex-1 bg-transparent border-none p-0 text-sm font-semibold focus:ring-0"
            value={text}
            onChange={(e) => onTextChange(id, e.target.value)}
          />
        )}

        {/* Индикаторы и кнопки */}
        <div className="flex items-center gap-2">
          {hasChildren && <FolderTree size={14} className="text-primary/40" title="Имеет подпункты" />}
          {!isOverlay && !isDragging && (
            <button 
              onClick={() => onDelete(id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Компонент-обертка для Sortable ---

const SortableMenuElement = (props: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    // Мы не применяем opacity здесь, чтобы не скрывать детей родителя
  };

  // Передаем listeners и attributes только если это сам перемещаемый элемент (а не его потомок)
  const spreadProps = isDragging ? {} : { ...attributes, ...listeners };

  return (
    <div ref={setNodeRef} style={style} {...spreadProps}>
      <MenuElement {...props} isDragging={isDragging} />
    </div>
  );
};

// --- Основной компонент ---

export const MenuBuilder = ({ initialData, onSave }: { initialData: any[], onSave: (data: any[]) => void }) => {
  const [items, setItems] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  useEffect(() => {
    if (initialData) {
      setItems(initialData.map(i => ({ ...i, id: String(i.id), depth: i.depth || 0 })));
    }
  }, [initialData]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Индекс активного элемента
  const activeIndex = useMemo(() => items.findIndex(i => i.id === activeId), [activeId, items]);
  
  // Список потомков перетаскиваемого элемента (для фантома)
  const activeDescendants = useMemo(() => {
    return activeIndex !== -1 ? getDescendants(items, activeIndex) : [];
  }, [activeIndex, items]);

  // Расчет допустимой глубины "на лету"
  const getProjectedDepth = (actId: string, dragX: number, overId: string | null = null) => {
    const actIndex = items.findIndex((i) => i.id === actId);
    if (actIndex === -1) return 0;

    let referenceIndex = actIndex;
    if (overId && overId !== actId) referenceIndex = items.findIndex((i) => i.id === overId);

    const prevIndex = referenceIndex > 0 ? referenceIndex - (actIndex < referenceIndex ? 0 : 1) : -1;
    
    let maxAllowed = 0;
    if (prevIndex >= 0) maxAllowed = items[prevIndex].depth + 1;

    const currentDepth = items[actIndex].depth;
    const delta = Math.round(dragX / INDENTATION_WIDTH);
    
    return Math.max(0, Math.min(currentDepth + delta, maxAllowed, 3));
  };

  const handleDragMove = (event: any) => setOffsetLeft(event.delta.x);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    const activeIdStr = String(active.id);
    const overIdStr = over ? String(over.id) : null;

    if (activeIndex === -1) return;

    const newDepth = getProjectedDepth(activeIdStr, offsetLeft, overIdStr);
    const actualDelta = newDepth - items[activeIndex].depth;

    if (over && activeIdStr !== overIdStr) {
      const overIndex = items.findIndex((i) => i.id === overIdStr);
      const branch = [items[activeIndex], ...activeDescendants];

      const remainingItems = [...items];
      remainingItems.splice(activeIndex, branch.length);

      let insertIndex = remainingItems.findIndex((i) => i.id === overIdStr);
      if (activeIndex < overIndex) insertIndex += 1;

      const updatedBranch = branch.map(item => ({
        ...item,
        depth: item.depth + actualDelta
      }));

      const result = [...remainingItems];
      result.splice(insertIndex, 0, ...updatedBranch);
      setItems(result);
    } else if (actualDelta !== 0) {
      const newItems = items.map((item) => {
        if (item.id === activeIdStr) return { ...item, depth: newDepth };
        if (activeDescendants.some(d => d.id === item.id)) return { ...item, depth: item.depth + actualDelta };
        return item;
      });
      setItems(newItems);
    }
    
    setActiveId(null);
    setOffsetLeft(0);
  };

  return (
    <div className="p-4 bg-muted/10 rounded-2xl border border-border shadow-inner min-h-[450px]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col relative">
            {items.map((item, index) => (
              <SortableMenuElement 
                key={item.id} 
                {...item} 
                hasChildren={index < items.length - 1 && items[index+1].depth > item.depth}
                // Логика скрытия детей в основном списке (чтобы тащилась вся "дыра")
                isDragging={item.id === activeId || activeDescendants.some(d => d.id === item.id)}
                onDelete={(id: string) => setItems(items.filter(i => i.id !== id))}
                onTextChange={(id: string, text: string) => 
                  setItems(items.map(i => i.id === id ? { ...i, text } : i))
                }
              />
            ))}
          </div>
        </SortableContext>

        {/* СЛОЙ ПРЕДПРОСМОТРА (ФАНТОМ): Теперь рендерит всю ветку целиком */}
        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeId && activeIndex !== -1 ? (
            <div className="flex flex-col opacity-90 cursor-grabbing pointer-events-none">
               {/* Родительский элемент в фантоме */}
               <MenuElement 
                id={activeId} 
                text={items[activeIndex].text} 
                depth={getProjectedDepth(activeId, offsetLeft)} 
                isOverlay 
              />
              
              {/* Все потомки в фантоме (isGhost) */}
              {activeDescendants.map(desc => (
                <MenuElement
                  key={`overlay-${desc.id}`}
                  {...desc}
                  depth={desc.depth + (getProjectedDepth(activeId, offsetLeft) - items[activeIndex].depth)}
                  isOverlay
                  isGhost // Добавляем флаг, что это ребенок в группе
                />
              ))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-8 pt-6 border-t border-border flex gap-4">
        <button
          onClick={() => setItems([...items, { id: `item-${Date.now()}`, text: 'Новый пункт', depth: 0 }])}
          className="flex-1 h-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-sm font-medium hover:bg-accent transition-all"
        >
          <Plus size={18} /> Добавить пункт
        </button>
        <button
          onClick={() => onSave(items)}
          className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} /> Сохранить меню
        </button>
      </div>
    </div>
  );
};