import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

let adminClient: PocketBase | null = null;

/**
 * Provides a PocketBase instance authenticated with many admin privileges.
 * Designed for use in Server Actions inside nex-admin.
 */
export async function getAdminPB(): Promise<PocketBase> {
    if (adminClient && adminClient.authStore.isValid) {
        return adminClient;
    }

    const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://nexcommerce.fly.dev';
    adminClient = new PocketBase(url);
    adminClient.autoCancellation(false);

    // Use the same environment variables as the main app
    const email = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
    const password = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

    try {
        if (!email || !password) {
<<<<<<< ours
            const cookieStore = cookies();
=======
            const cookieStore = await cookies();
>>>>>>> theirs
            const token = cookieStore.get('pb_auth')?.value;
            if (!token) {
                throw new Error('Missing PB admin credentials and no auth cookie found.');
            }
            adminClient.authStore.save(token, null);
            return adminClient;
        }

        await adminClient.admins.authWithPassword(email, password);
    } catch (error: any) {
        console.error('[PB-ADMIN] Auth failed:', error);
        // Legacy fallback check if needed (main lib has it, we might need it too if FB returns 404)
        if (error?.status === 404) {
            const legacyResponse = await fetch(`${url}/api/admins/auth-with-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: email, password })
            });
            if (legacyResponse.ok) {
                const data = await legacyResponse.json();
                adminClient.authStore.save(data.token, data.admin);
            } else {
                throw error;
            }
        } else {
            throw error;
        }
    }

    return adminClient;
}
