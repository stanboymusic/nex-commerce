import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Simple singleton for client-side
export const pocketbase = new PocketBase(POCKETBASE_URL);

// Simple server-side init
export async function initPocketBase(req?: Request) {
    const pb = new PocketBase(POCKETBASE_URL);
    pb.autoCancellation(false);

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('pb_auth');

    if (authCookie) {
        pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`);
    } else if (req) {
        // Fallback to header for API calls
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            pb.authStore.save(authHeader.split(' ')[1], null);
        }
    }

    return pb;
}

export function logout() {
    pocketbase.authStore.clear();
    if (typeof document !== 'undefined') {
        document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
}

export default pocketbase;
