import { NextResponse } from 'next/server';
import { updateClient, deleteClient } from '@/lib/notion';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await updateClient(params.id, await req.json());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await deleteClient(params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
