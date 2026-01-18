import PocketBase from 'pocketbase';
import { NextRequest } from 'next/server';

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

  // Reset the auth store for each request to avoid state leakage
  client.authStore.clear();

  // We primarily use 'pb_auth' cookie for both user and admin apps
  const authValue = req.cookies.get('pb_auth')?.value;
  const authHeader = req.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    client.authStore.save(token, null);
  } else if (authValue) {
    try {
      // Try to load as a serialized cookie (token + model) or just the token
      if (authValue.includes('%7B')) { // Simple check for JSON-like content
        client.authStore.loadFromCookie('pb_auth=' + authValue);
      } else {
        client.authStore.save(authValue, null);
      }
    } catch (_) {
      client.authStore.save(authValue, null);
    }
  }

  // If we have a token but no model, try to refresh to get user data
  if (client.authStore.token && !client.authStore.model) {
    try {
      await client.collection('users').authRefresh();
    } catch (_) {
      client.authStore.clear();
    }
  }

  return client;
}
