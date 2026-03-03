import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    const menu = await redis.get('site_menu');
    return NextResponse.json({ menu: menu || [] });
  } catch (error) {
    return NextResponse.json({ menu: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json();

    if (action === 'save_menu') {
      await redis.set('site_menu', payload.menu);
      
      // Очищаем кэш, чтобы Navbar на всех страницах обновился сразу
      revalidatePath('/', 'layout'); 
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}