const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@nexcommerce.com'
    const password = await bcrypt.hash('admin123', 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN', // Ensure role is updated if user exists
            password: password // Reset password to known one
        },
        create: {
            email,
            name: 'NexAdmin',
            password,
            role: 'ADMIN',
            phone: '+0000000000'
        },
    })

    console.log('Admin user created/updated:')
    console.log('Email: admin@nexcommerce.com')
    console.log('Password: admin123')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
