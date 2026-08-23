import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@gsic.km.itb.ac.id';

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'GSIC Admin',
      role: 'admin',
    },
    create: {
      email,
      htaId: `HTA-${new Date().getFullYear()}-ADMIN`,
      name: 'GSIC Admin',
      role: 'admin',
      isVerified: true,
      classcardTheme: 'blue',
    },
  });
  console.log('✅ Admin account created successfully:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});