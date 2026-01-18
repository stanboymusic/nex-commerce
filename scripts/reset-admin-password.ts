import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function resetPassword() {
    const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
    const email = process.env.POCKETBASE_ADMIN_EMAIL;
    const password = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!email || !password) {
        console.error("Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD");
        return;
    }

    const pb = new PocketBase(POCKETBASE_URL);

    try {
        await pb.admins.authWithPassword(email, password);
        console.log("Admin Authenticated.");

        const targetEmail = 'admin@nexcommerce.com';
        const newPassword = 'admin123456';

        const user = await pb.collection('users').getFirstListItem(`email="${targetEmail}"`);

        await pb.collection('users').update(user.id, {
            password: newPassword,
            passwordConfirm: newPassword,
            role: 'ADMIN' // Ensure it has the correct role
        });

        console.log(`Password for ${targetEmail} has been reset to: ${newPassword}`);

    } catch (e: any) {
        console.error("Error resetting password:", e.message);
        if (e.response && e.response.data) console.error("Response data:", JSON.stringify(e.response.data));
    }
}

resetPassword();
