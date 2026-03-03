import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuItem } from './types';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SortableMenuItem({ item, onEdit, onDelete }: { item: MenuItem, onEdit: () => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-md shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab hover:text-primary transition-colors">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>
      
      <div className="flex-1">
        <div className="font-medium text-sm">{item.title}</div>
        <div className="text-xs text-muted-foreground">{item.href}</div>
      </div>

      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(item.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}