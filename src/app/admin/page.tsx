'use client';

import { useState, useEffect } from 'react';
import { MenuBuilder } from '@/components/admin/MenuBuilder';
import { toast } from 'sonner';

export default function AdminPage() {
  const [menuData, setMenuData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/cms');
        const data = await res.json();
        // ВАЖНО: Приводим всё к строкам сразу при загрузке
        const prepared = (data.menu || []).map((item: any) => ({
          ...item,
          id: String(item.id),
          parent: String(item.parent || "0"),
          droppable: true
        }));
        setMenuData(prepared);
      } catch (e) { toast.error('Ошибка загрузки'); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  const handleSave = async (updatedMenu: any[]) => {
    try {
      // ПРОВЕРКА: Если в массиве всё еще parent: "0", значит дерево не поменялось
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_menu',
          payload: { menu: updatedMenu } // Отправляем как есть
        })
      });

      if (res.ok) toast.success('Сохранено!');
      else toast.error('Ошибка сохранения');
    } catch (e) { toast.error('Ошибка сети'); }
  };

  if (loading) return <div className="p-10 text-center">Загрузка...</div>;

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Управление меню</h1>
      <MenuBuilder initialData={menuData} onSave={handleSave} />
    </div>
  );
}