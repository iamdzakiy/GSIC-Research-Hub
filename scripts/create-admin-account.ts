import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.adminAccount.upsert({
    where: { email: 'admin@gsic.km.itb.ac.id' },
    update: {
      name: 'GSIC Admin',
      role: 'admin',
      isGenerated: true,
      generatedBy: 'system',
    },
    create: {
      email: 'admin@gsic.km.itb.ac.id',
      name: 'GSIC Admin',
      role: 'admin',
      isGenerated: true,
      generatedBy: 'system',
    },
  });
  console.log('✅ Admin account created successfully:', JSON.stringify(admin, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
