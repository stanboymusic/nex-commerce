const PocketBase = require('pocketbase/cjs');

async function addRoleField() {
    const pb = new PocketBase('http://127.0.0.1:8090');
    const adminEmail = 'nexcommerce9@gmail.com';
    const adminPassword = '31671702!!';

    try {
        await pb.admins.authWithPassword(adminEmail, adminPassword);

        const collection = await pb.collections.getOne('users');
        const hasRole = collection.schema.find(f => f.name === 'role');

        if (!hasRole) {
            console.log('Adding role field to users collection...');
            collection.schema.push({
                system: false,
                id: 'role_field_123',
                name: 'role',
                type: 'select',
                required: false,
                presentable: false,
                unique: false,
                options: {
                    maxSelect: 1,
                    values: ['USER', 'ADMIN']
                }
            });

            await pb.collections.update('users', collection);
            console.log('Role field added successfully.');

            // Re-update the admin user to ensure role is set
            const user = await pb.collection('users').getFirstListItem('email="admin@nexcommerce.com"');
            await pb.collection('users').update(user.id, { role: 'ADMIN' });
            console.log('Admin user role confirmed.');
        } else {
            console.log('Role field already exists.');
        }

    } catch (err) {
        console.error('Failed to update schema:', err);
    }
}

addRoleField();
