import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
    const name = process.env.SEED_ADMIN_NAME || 'Admin';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        if (existing.role !== 'ADMIN') {
            await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
            console.log(`Promoted existing user ${email} to ADMIN`);
        } else {
            console.log(`Admin ${email} already exists`);
        }
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, passwordHash, name, role: 'ADMIN' } });
    console.log(`Created ADMIN user ${email}`);
}

main().finally(async () => { await prisma.$disconnect(); });
