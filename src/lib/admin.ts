import PocketBase from 'pocketbase';

let adminClient: PocketBase | null = null;

export async function getAdminPocketBase(): Promise<PocketBase> {
    // If we have a valid client, return it
    if (adminClient && adminClient.authStore.isValid) {
        return adminClient;
    }

    const url = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
    adminClient = new PocketBase(url);
    adminClient.autoCancellation(false);

    try {
        const email = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
        const password = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

        if (!email || !password) {
            console.error("ADMIN_AUTH_ERROR: Missing admin credentials (PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD)");
            throw new Error("Missing admin credentials");
        }

        await adminClient.admins.authWithPassword(email, password);
    } catch (error: any) {
        console.error("ADMIN_AUTH_ERROR: Failed to authenticate as admin.", error?.data || error?.message || error);
        adminClient = null; // Reset so next try can attempt fresh connection
        throw new Error(`Admin authentication failed: ${error.message}`);
    }

    return adminClient;
}
