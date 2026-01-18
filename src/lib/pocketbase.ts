import PocketBase from 'pocketbase';
import { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';

let pb: PocketBase;

export function getPocketBase(): PocketBase {
  if (!pb) {
    pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://nexcommerce.fly.dev');
    pb.autoCancellation(false);
  }
  return pb;
}

export async function initPocketBase(req: NextRequest): Promise<PocketBase> {
  const client = getPocketBase();

  // Reset the auth store for each request to avoid state leakage between requests in the singleton
  client.authStore.clear();

  const authValue = req.cookies.get('pb_auth')?.value;
  const authHeader = req.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    client.authStore.save(token, null);
  } else if (authValue) {
    try {
      // Intentamos cargar como cookie serializada (token + model)
      client.authStore.loadFromCookie('pb_auth=' + authValue);
    } catch (_) {
      // Si falla, lo tratamos como token plano
      client.authStore.save(authValue, null);
    }
  }

  // Si tenemos token pero no modelo, intentamos refrescar para obtener los datos del usuario (incluyendo el rol)
  if (client.authStore.token && !client.authStore.model) {
    try {
      await client.collection('users').authRefresh();
    } catch (_) {
      client.authStore.clear();
    }
  }

  return client;
}

export async function initPocketBaseServer(): Promise<PocketBase> {
  const client = getPocketBase();
  client.authStore.clear();

  const cookieStore = await cookies();
  const headerStore = await headers();

  const authValue = cookieStore.get('pb_auth')?.value;
  const authHeader = headerStore.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    client.authStore.save(token, null);
  } else if (authValue) {
    try {
      client.authStore.loadFromCookie('pb_auth=' + authValue);
    } catch (_) {
      client.authStore.save(authValue, null);
    }
  }

  if (client.authStore.token && !client.authStore.model) {
    try {
      await client.collection('users').authRefresh();
    } catch (_) {
      client.authStore.clear();
    }
  }

  return client;
}
