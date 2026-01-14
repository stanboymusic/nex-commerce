const PocketBase = require('pocketbase/cjs');

async function createAdminUser() {
    const pb = new PocketBase('http://127.0.0.1:8090');

    // Auth as superuser using the credentials found in .env.local
    // User credentials from step 482 summary and .env.local
    const adminEmail = 'nexcommerce9@gmail.com';
    const adminPassword = '31671702!!';

    try {
        console.log('Authenticating as superuser...');
        await pb.admins.authWithPassword(adminEmail, adminPassword);

        const email = 'admin@nexcommerce.com';
        const password = 'admin123456!!'; // Stronger password

        console.log(`Creating/Updating app admin user: ${email}`);

        // Check if user exists
        try {
            const existingUser = await pb.collection('users').getFirstListItem(`email="${email}"`);
            console.log('User exists, updating role...');
            await pb.collection('users').update(existingUser.id, {
                role: 'ADMIN',
                name: 'Nex Admin'
            });
            console.log('User updated successfully.');
        } catch (e) {
            // User doesn't exist, create new
            if (e.status === 404) {
                console.log('User usually does not exist. Creating new...');
                await pb.collection('users').create({
                    email: email,
                    password: password,
                    passwordConfirm: password,
                    name: 'Nex Admin',
                    role: 'ADMIN'
                });
                console.log('User created successfully.');
            } else {
                throw e;
            }
        }

    } catch (err) {
        console.error('Failed to create admin user:', err);
        // Log more details
        if (err.data) console.error(err.data);
    }
}

createAdminUser();
