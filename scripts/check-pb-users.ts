import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import path from 'path';

// Force load from root .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function checkUsers() {
    const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
    const email = process.env.POCKETBASE_ADMIN_EMAIL;
    const password = process.env.POCKETBASE_ADMIN_PASSWORD;

    console.log("Using URL:", POCKETBASE_URL);
    console.log("Admin Email:", email);

    const pb = new PocketBase(POCKETBASE_URL);

    try {
        if (email && password) {
            await pb.admins.authWithPassword(email, password);
            console.log("Admin Auth Success!");
        } else {
            console.warn("No admin credentials found in .env.local");
        }

        const collections = await pb.collections.getFullList();
        console.log("Collections found:", collections.map(c => c.name));

        const users = await pb.collection('users').getList(1, 10);
        console.log("Users in collection 'users':", users.totalItems);
        users.items.forEach(u => {
            console.log(`- User: ${u.email}, Role: ${u.role}, ID: ${u.id}`);
        });

    } catch (e: any) {
        console.error("Error checking PocketBase:", e.message);
        if (e.response && e.response.data) console.error("Response data:", JSON.stringify(e.response.data));
    }
}

checkUsers();
