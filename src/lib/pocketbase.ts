import PocketBase from 'pocketbase';
import { NextRequest } from 'next/server';

let pb: PocketBase;

export function getPocketBase(): PocketBase {
  if (!pb) {
    pb = new PocketBase('https://nexcommerce.fly.dev');
    pb.autoCancellation(false);
  }
  return pb;
}

export async function initPocketBase(req: NextRequest): Promise<PocketBase> {
  const client = getPocketBase();

  const token = req.cookies.get('pb_auth')?.value;
  if (token) {
    client.authStore.save(token, null);
  }

  return client;
}
