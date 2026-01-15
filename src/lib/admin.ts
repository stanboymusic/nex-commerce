import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

export async function getAdminPocketBase(): Promise<PocketBase> {
    const adminPb = new PocketBase(POCKETBASE_URL);
    adminPb.autoCancellation(false);

    try {
        const email = process.env.POCKETBASE_ADMIN_EMAIL;
        const password = process.env.POCKETBASE_ADMIN_PASSWORD;

        if (!email || !password) {
            console.error("ADMIN_AUTH_ERROR: Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD environment variables.");
            throw new Error("Missing admin credentials");
        }

        await adminPb.admins.authWithPassword(email, password);
    } catch (error: any) {
        console.error("ADMIN_AUTH_ERROR: Failed to authenticate as admin.", error?.data || error?.message || error);
        throw error;
    }

    return adminPb;
}
