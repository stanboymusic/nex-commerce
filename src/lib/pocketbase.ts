import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';
import type { User } from '@/types/pocketbase-types';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Create a singleton instance
let pb: PocketBase | null = null;

export function getPocketBase(): PocketBase {
    if (!pb) {
        pb = new PocketBase(POCKETBASE_URL);
        pb.autoCancellation(false);
    }
    return pb;
}

// Export a default instance
export const pocketbase = getPocketBase();

// Server-side helper to load auth from cookies or Authorization header
export async function initPocketBase(req?: Request) {
    const pb = getPocketBase();
    const cookieStore = await cookies();
    let token = cookieStore.get('pb_auth')?.value || '';

    // Fallback to Authorization header if no cookie
    if (!token && req) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    pb.authStore.save(token, null);

    try {
        if (pb.authStore.isValid) {
            // Validate token and get user model
            const authData = await pb.collection('users').authRefresh();
            pb.authStore.save(authData.token, authData.record);
        }
    } catch (_) {
        pb.authStore.clear();
    }

    return pb;
}

export function isAuthenticated(): boolean {
    return pocketbase.authStore.isValid;
}

export function getCurrentUser() {
    return pocketbase.authStore.model as unknown as User;
}

export function logout() {
    pocketbase.authStore.clear();
}



export default pocketbase;
