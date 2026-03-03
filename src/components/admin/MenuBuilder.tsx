'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, FolderTree, Save, Plus } from 'lucide-react';

const INDENTATION_WIDTH = 30;

interface MenuItem {
  id: string;
  text: string;
  depth: number;
}

const getDescendants = (items: MenuItem[], startIndex: number) => {
  const descendants: (MenuItem & { index: number })[] = [];
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

// --- Компонент элемента ---

interface ElementProps {
  id: string;
  text: string;
  depth: number;
  isOverlay?: boolean;
  isDragging?: boolean;
  hasChildren?: boolean;
  onDelete?: (id: string) => void;
  onTextChange?: (id: string, text: string) => void;
  isGhost?: boolean;
}

const MenuElement = ({ id, text, depth, isOverlay, isDragging, hasChildren, onDelete, onTextChange, isGhost }: ElementProps) => {
  const marginLeft = `${depth * INDENTATION_WIDTH}px`;

  return (
    <div style={{ marginLeft }} className={`group mb-1 relative ${isDragging && !isOverlay ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`
        flex items-center gap-3 p-3 bg-card border rounded-xl shadow-sm transition-all
        ${isOverlay ? 'border-primary shadow-xl bg-background ring-2 ring-primary/20 scale-[1.02]' : 'border-border hover:border-primary/40'}
      `}>
        {!isGhost && (
           <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary p-1">
            <GripVertical size={18} />
          </div>
        )}
        
        {isGhost && <div className="w-7" />}

        {isOverlay ? (
          <span className="flex-1 text-sm font-semibold truncate select-none">{text}</span>
        ) : (
          <input
            className="flex-1 bg-transparent border-none p-0 text-sm font-semibold focus:ring-0"
            value={text}
            onChange={(e) => onTextChange?.(id, e.target.value)}
          />
        )}

        <div className="flex items-center gap-2">
          {hasChildren && (
            <span title="Имеет подпункты">
              <FolderTree size={14} className="text-primary/40" />
            </span>
          )}
          {!isOverlay && !isDragging && (
            <button 
              onClick={() => onDelete?.(id)}
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

const SortableMenuElement = (props: ElementProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const spreadProps = isDragging ? {} : { ...attributes, ...listeners };

  return (
    <div ref={setNodeRef} style={style} {...spreadProps}>
      <MenuElement {...props} isDragging={isDragging} />
    </div>
  );
};

// --- Main ---

export const MenuBuilder = ({ initialData, onSave }: { initialData: MenuItem[], onSave: (data: MenuItem[]) => void }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  useEffect(() => {
    if (initialData) {
      setItems(initialData.map(i => ({ ...i, id: String(i.id), depth: i.depth || 0 })));
    }
  }, [initialData]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeIndex = useMemo(() => items.findIndex(i => i.id === activeId), [activeId, items]);
  const activeDescendants = useMemo(() => activeIndex !== -1 ? getDescendants(items, activeIndex) : [], [activeIndex, items]);

  const getProjectedDepth = (actId: string, dragX: number, overId: string | null = null) => {
    const actIndex = items.findIndex((i) => i.id === actId);
    if (actIndex === -1) return 0;
    let referenceIndex = actIndex;
    if (overId && overId !== actId) referenceIndex = items.findIndex((i) => i.id === overId);
    const prevIndex = referenceIndex > 0 ? referenceIndex - (actIndex < referenceIndex ? 0 : 1) : -1;
    let maxAllowed = 0;
    if (prevIndex >= 0) maxAllowed = items[prevIndex].depth + 1;
    return Math.max(0, Math.min(items[actIndex].depth + Math.round(dragX / INDENTATION_WIDTH), maxAllowed, 3));
  };

  const handleDragMove = (event: DragMoveEvent) => setOffsetLeft(event.delta.x);

  const handleDragEnd = (event: DragEndEvent) => {
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
      const updatedBranch = branch.map(item => ({ ...item, depth: item.depth + actualDelta }));
      const result = [...remainingItems];
      result.splice(insertIndex, 0, ...updatedBranch);
      setItems(result);
    } else if (actualDelta !== 0) {
      setItems(items.map(item => {
        if (item.id === activeIdStr) return { ...item, depth: newDepth };
        if (activeDescendants.some(d => d.id === item.id)) return { ...item, depth: item.depth + actualDelta };
        return item;
      }));
    }
    setActiveId(null);
    setOffsetLeft(0);
  };

  return (
    <div className="p-4 bg-muted/10 rounded-2xl border border-border shadow-inner min-h-[450px]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
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
                isDragging={item.id === activeId || activeDescendants.some(d => d.id === item.id)}
                onDelete={(id) => setItems(items.filter(i => i.id !== id))}
                onTextChange={(id, text) => setItems(items.map(i => i.id === id ? { ...i, text } : i))}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay adjustScale={false} dropAnimation={null}>
          {activeId && activeIndex !== -1 ? (
            <div className="flex flex-col opacity-90 cursor-grabbing pointer-events-none">
               <MenuElement id={activeId} text={items[activeIndex].text} depth={getProjectedDepth(activeId, offsetLeft)} isOverlay />
              {activeDescendants.map(desc => (
                <MenuElement key={`overlay-${desc.id}`} id={desc.id} text={desc.text} isOverlay isGhost
                  depth={desc.depth + (getProjectedDepth(activeId, offsetLeft) - items[activeIndex].depth)} 
                />
              ))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-8 pt-6 border-t border-border flex gap-4">
        <button onClick={() => setItems([...items, { id: `item-${Date.now()}`, text: 'Новый пункт', depth: 0 }])}
          className="flex-1 h-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-sm font-medium hover:bg-accent transition-all">
          <Plus size={18} /> Добавить пункт
        </button>
        <button onClick={() => onSave(items)}
          className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
          <Save size={18} /> Сохранить меню
        </button>
      </div>
    </div>
  );
};