import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

export async function getAdminPocketBase(): Promise<PocketBase> {
    const adminPb = new PocketBase(POCKETBASE_URL);
    adminPb.autoCancellation(false);

    await adminPb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL!,
        process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    return adminPb;
}
