import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  const menu = await kv.get('site_menu');
  return NextResponse.json({ menu: menu || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Данные получены сервером:', body); // Увидишь это в терминале VS Code

    if (body.action === 'save_menu') {
      await kv.set('site_menu', body.payload.menu);
      console.log('Данные успешно записаны в Redis!');
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
  } catch (error) {
    console.error('Ошибка API:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}