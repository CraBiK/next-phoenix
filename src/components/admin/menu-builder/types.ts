export interface MenuItem {
  id: string;
  title: string;
  href: string;
  parentId?: string | null;
  items?: MenuItem[]; // Массив вложенных пунктов
}