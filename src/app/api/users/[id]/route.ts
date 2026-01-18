import { NextRequest, NextResponse } from 'next/server';
import { initPocketBase } from '@/lib/pocketbase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await initPocketBase(req);
    const currentUser = pb.authStore.model;

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only ADMIN or the user themselves can view their details
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const record = await pb.collection('users').getOne(id);
      
      const user = {
        id: record.id,
        name: record.name,
        email: record.email,
        role: record.role,
        created: record.created,
        updated: record.updated,
      };

      return NextResponse.json(user);
    } catch (error: any) {
      if (error.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Fetch user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await initPocketBase(req);
    const currentUser = pb.authStore.model;

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only ADMIN can change roles or other sensitive info
    // Users might be able to change their own name, but for now let's restrict to ADMIN
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    
    // Safety check: don't allow non-admins to change roles via this API if we opened it to users
    // But since it's already ADMIN-only, it's fine.

    const updatedRecord = await pb.collection('users').update(id, data);

    const user = {
      id: updatedRecord.id,
      name: updatedRecord.name,
      email: updatedRecord.email,
      role: updatedRecord.role,
      updated: updatedRecord.updated,
    };

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message || 'Error updating user' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await initPocketBase(req);
    const currentUser = pb.authStore.model;

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only ADMIN can delete users
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent deleting yourself
    if (currentUser.id === id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await pb.collection('users').delete(id);

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message || 'Error deleting user' }, { status: 500 });
  }
}
