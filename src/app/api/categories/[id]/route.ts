import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const record = await pb.collection('categories').getOne(id);
    return NextResponse.json(record);
  } catch (error) {
    const err = error as { status?: number; message?: string };
    if (err.status === 404) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await pb.collection('categories').getOne(id);
    const isAdmin = user.role === 'ADMIN';

    if (!isAdmin && existing.user !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const updated = await pb.collection('categories').update(id, data);

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as { message?: string };
    console.error("Error updating category:", err);
    return NextResponse.json({ error: err.message || 'Error al actualizar la categoría' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await pb.collection('categories').getOne(id);
    const isAdmin = user.role === 'ADMIN';

    if (!isAdmin && existing.user !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pb.collection('categories').delete(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const err = error as { message?: string };
    console.error("Error deleting category:", err);
    return NextResponse.json({ error: err.message || 'Error al eliminar la categoría' }, { status: 500 });
  }
}
