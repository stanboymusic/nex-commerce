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

// Server-side helper to load auth from cookies
export async function initPocketBase() {
    const pb = getPocketBase();
    const cookieStore = await cookies();
    const token = cookieStore.get('pb_auth')?.value || '';

    pb.authStore.save(token);

    try {
        if (pb.authStore.isValid) {
            await pb.collection('users').authRefresh();
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
