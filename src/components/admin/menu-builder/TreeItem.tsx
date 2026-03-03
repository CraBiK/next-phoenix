import React from 'react';
import { SortableMenuItem } from './SortableMenuItem';
import { MenuItem } from './types';

interface TreeItemProps {
  item: MenuItem;
  depth: number;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onAddSubItem: (parentId: string) => void;
}

export function TreeItem({ item, depth, onEdit, onDelete, onAddSubItem }: TreeItemProps) {
  return (
    <div className="space-y-2" style={{ marginLeft: `${depth * 24}px` }}>
      <SortableMenuItem 
        item={item} 
        onEdit={() => onEdit(item)}
        onDelete={onDelete}
        // Кнопка "+" появляется только если уровень вложенности < 2 (всего 3 уровня: 0, 1, 2)
        showAddChild={depth < 2}
        onAddChild={() => onAddSubItem(item.id)}
      />
      
      {item.items && item.items.length > 0 && (
        <div className="border-l-2 border-muted ml-4 pl-4 space-y-2 mt-2">
          {item.items.map((child) => (
            <TreeItem 
              key={child.id} 
              item={child} 
              depth={depth + 1} 
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubItem={onAddSubItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}