import { NextResponse } from 'next/server';
import { getAllClients, createClient } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getAllClients());
  } catch {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    return NextResponse.json(await createClient(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
