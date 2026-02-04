import PocketBase from 'pocketbase';
import { NextRequest } from 'next/server';

let pb: PocketBase;

export { getAdminPocketBase } from './admin';

export function getPocketBase(): PocketBase {
  if (!pb) {
    let url = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
    
    // Ensure protocol
    if (url && !url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    pb = new PocketBase(url);
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

  console.log('[PocketBase] Auth state:', { 
    hasCookie: !!authValue, 
    hasHeader: !!authHeader,
    path: req.nextUrl.pathname 
  });

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
      console.log('[PocketBase] Auth refresh successful for:', (client.authStore.model as any)?.id);
    } catch (err: any) {
      console.error('[PocketBase] Auth refresh failed:', err.message, err.status);
      // Fallback: decode token payload to keep minimal user context
      try {
        const token = client.authStore.token;
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
        if (payload?.collectionId === '_pb_users_auth_' && payload?.id) {
          client.authStore.save(token, {
            id: payload.id,
            collectionId: payload.collectionId,
            collectionName: payload.collectionName || 'users'
          } as any);
        } else {
          client.authStore.clear();
        }
      } catch (_) {
        client.authStore.clear();
      }
    }
  }

  return client;
}

export function getPBImageUrl(collection: string, recordId: string, filename: string) {
  return `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/${collection}/${recordId}/${filename}`;
}
