import { useState } from 'react';
import { MenuItem } from './types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function MenuItemEditor({ item, onClose, onSave }: { 
  item: MenuItem, 
  onClose: () => void, 
  onSave: (item: MenuItem) => void 
}) {
  const [title, setTitle] = useState(item.title);
  const [href, setHref] = useState(item.href);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать пункт</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="href">Ссылка (URL или /category/slug)</Label>
            <Input id="href" value={href} onChange={(e) => setHref(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => onSave({ ...item, title, href })}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}