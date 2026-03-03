'use client';

import { useState, useEffect } from 'react';
import { MenuBuilder } from '@/components/admin/menu-builder';
import { MenuItem } from '@/components/admin/menu-builder/types';
import { toast } from 'sonner'; // Или любой другой нотификатор

export default function AdminMenuPage() {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Загружаем меню из Облака при открытии
  useEffect(() => {
    fetch('/api/cms')
      .then(res => res.json())
      .then(data => {
        setMenuData(data.menu || []);
        setLoading(false);
      });
  }, []);

  // 2. Сохраняем всё дерево в Vercel KV
  const handleSave = async (updatedMenu: MenuItem[]) => {
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_menu',
          payload: { menu: updatedMenu }
        })
      });

      if (res.ok) {
        toast.success('Меню успешно обновлено в облаке!');
      }
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  if (loading) return <div className="p-10 text-center">Загрузка конфигурации...</div>;

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif mb-2">Навигация сайта</h1>
        <p className="text-muted-foreground text-sm">
          Управляйте структурой меню (до 3-х уровней). Перетаскивайте пункты для сортировки.
        </p>
      </div>

      <MenuBuilder initialData={menuData} onSave={handleSave} />
    </div>
  );
}