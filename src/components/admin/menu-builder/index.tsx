'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableMenuItem } from './SortableMenuItem';
import { MenuItemEditor } from './MenuItemEditor';
import { MenuItem } from './types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const MenuBuilder = ({ initialData, onSave }: { initialData: MenuItem[], onSave: (data: MenuItem[]) => void }) => {
  const [items, setItems] = useState<MenuItem[]>(initialData || []);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const findAndAddChild = (items: MenuItem[], parentId: string, newItem: MenuItem): MenuItem[] => {
  return items.map(item => {
    if (item.id === parentId) {
      return { ...item, items: [...(item.items || []), newItem] };
    }
    if (item.items) {
      return { ...item, items: findAndAddChild(item.items, parentId, newItem) };
    }
    return item;
  });
};

const handleAddSubItem = (parentId: string) => {
  const newItem: MenuItem = { id: uuidv4(), title: 'Подпункт', href: '/', items: [] };
  setItems(prev => findAndAddChild(prev, parentId, newItem));
};

  const addItem = () => {
    const newItem: MenuItem = { id: uuidv4(), title: 'Новый пункт', href: '/', items: [] };
    setItems([...items, newItem]);
    setEditingItem(newItem);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif">Конструктор меню</h2>
        <Button onClick={addItem} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" /> Добавить пункт
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableMenuItem 
                key={item.id} 
                item={item} 
                onEdit={() => setEditingItem(item)}
                onDelete={(id) => setItems(items.filter(i => i.id !== id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-8 pt-4 border-t">
        <Button onClick={() => onSave(items)} className="w-full">Сохранить изменения в Облако</Button>
      </div>

      {editingItem && (
        <MenuItemEditor 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSave={(updatedItem) => {
            setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};