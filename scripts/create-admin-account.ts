import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/**
 * Idempotent admin account creation script.
 *
 * Usage:
 *   npx tsx scripts/create-admin-account.ts                          # uses env defaults
 *   ADMIN_EMAIL=you@itb.ac.id ADMIN_PASSWORD=secret123 npm run admin:create
 *   npx tsx scripts/create-admin-account.ts --email you@itb.ac.id --password secret123 --name "Admin"
 *
 * Behavior:
 *   - Upserts the Prisma `User` row with role "admin" (safe to re-run).
 *   - If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are provided and the auth user
 *     does not exist yet, creates the Supabase Auth user too.
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : undefined;
  };
  return {
    email: get('--email') || process.env.ADMIN_EMAIL || 'admin@gsic.km.itb.ac.id',
    password: get('--password') || process.env.ADMIN_PASSWORD,
    name: get('--name') || process.env.ADMIN_NAME || 'GSIC Admin',
  };
}

async function ensureSupabaseAuthUser(email: string, password?: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log('ℹ️  Skipping Supabase Auth creation (SUPABASE_SERVICE_ROLE_KEY not set).');
    console.log('   Create the auth user manually in Supabase Dashboard → Authentication → Users.');
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if the auth user already exists
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users?.find((u) => u.email === email);

  if (existing) {
    // Ensure confirmed so they can sign in immediately
    await admin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      ...(password ? { password } : {}),
      user_metadata: { name: 'GSIC Admin', role: 'admin' },
    });
    console.log('✅ Existing Supabase Auth user updated & confirmed:', email);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    ...(password ? { password } : {}),
    email_confirm: true,
    user_metadata: { name: 'GSIC Admin', role: 'admin' },
  });
  if (error) {
    console.warn('⚠️  Could not create Supabase Auth user:', error.message);
    return;
  }
  console.log('✅ Supabase Auth user created & auto-confirmed:', data.user?.email);
}

async function main() {
  const { email, password, name } = parseArgs();

  // 1. Upsert the Prisma User row (idempotent)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: 'admin',
      isVerified: true,
    },
    create: {
      email,
      htaId: `HTA-${new Date().getFullYear()}-ADMIN`,
      name,
      role: 'admin',
      isVerified: true,
      classcardTheme: 'blue',
    },
  });
  console.log('✅ Admin account upserted successfully:', JSON.stringify(user, null, 2));

  // 2. Ensure the Supabase Auth user exists (optional)
  await ensureSupabaseAuthUser(email, password);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});