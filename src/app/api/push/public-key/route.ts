import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}
