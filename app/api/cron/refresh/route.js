import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    revalidatePath('/');
    revalidatePath('/api/sheets');
    return NextResponse.json({
      success: true,
      message: 'Cache refrescado correctamente',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return NextResponse.json({ error: 'Error al refrescar cache' }, { status: 500 });
  }
}
