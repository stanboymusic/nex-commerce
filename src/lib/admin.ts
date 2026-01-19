import PocketBase from 'pocketbase';

let adminClient: PocketBase | null = null;

export async function getAdminPocketBase(): Promise<PocketBase> {
    // If we have a valid client, return it
    if (adminClient && adminClient.authStore.isValid) {
        return adminClient;
    }

    let url = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
    
    // Ensure protocol
    if (url && !url.startsWith('http')) {
        url = `https://${url}`;
    }

    console.log(`[AdminAuth] Attempting connection to: ${url}`);
    adminClient = new PocketBase(url);
    adminClient.autoCancellation(false);

    try {
        const email = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        const password = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            console.error("[AdminAuth] Missing credentials. PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD not set.");
            throw new Error("Missing admin credentials");
        }

        console.log(`[AdminAuth] Authenticating as: ${email}`);
        try {
            await adminClient.admins.authWithPassword(email, password);
        } catch (sdkError: any) {
            // FALLBACK for PocketBase < 0.23 (Old routing)
            if (sdkError?.status === 404) {
                console.log("[AdminAuth] Standard auth failed with 404, trying legacy fallback...");
                const legacyResponse = await fetch(`${url}/api/admins/auth-with-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identity: email, password })
                });

                if (legacyResponse.ok) {
                    const data = await legacyResponse.json();
                    adminClient.authStore.save(data.token, data.admin);
                    console.log("[AdminAuth] Successfully authenticated via legacy path.");
                } else {
                    throw sdkError; // If legacy also fails, throw original 404
                }
            } else {
                throw sdkError;
            }
        }
        console.log("[AdminAuth] Successfully authenticated.");
    } catch (error: any) {
        console.error("[AdminAuth] Authentication failed:", {
            message: error.message,
            status: error.status,
            data: error.data,
            url: url
        });
        adminClient = null; 
        throw new Error(`Admin authentication failed: ${error.message} (Status: ${error.status})`);
    }

    return adminClient;
}
