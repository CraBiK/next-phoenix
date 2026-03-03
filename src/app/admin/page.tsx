'use client';

import { useState, useEffect } from 'react';
import { MenuBuilder } from '@/components/admin/menu-builder';
import { MenuItem } from '@/components/admin/menu-builder/types';
import { toast } from 'sonner';

export default function AdminPage() {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Загрузка меню из Vercel KV при открытии страницы
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/cms');
        const data = await res.json();
        setMenuData(data.menu || []);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
        toast.error('Не удалось загрузить меню');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Функция сохранения (тот самый POST запрос)
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
        toast.success('Меню сохранено в облако!');
      } else {
        toast.error('Ошибка сервера при сохранении');
      }
    } catch (error) {
      toast.error('Ошибка сети');
    }
  };

  if (loading) return <div className="p-10 text-center">Загрузка конструктора...</div>;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Админка: Управление меню</h1>
      <MenuBuilder initialData={menuData} onSave={handleSave} />
    </div>
  );
}