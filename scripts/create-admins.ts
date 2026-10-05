/**
 * Creates (or promotes) admin accounts: a confirmed Supabase Auth user, plus a Prisma User with role "admin".
 *
 *   npx tsx scripts/create-admins.ts --base you@gmail.com
 *       -> you+gsic-admin1@gmail.com ... you+gsic-admin5@gmail.com (all land in your own inbox)
 *   npx tsx scripts/create-admins.ts --emails a@itb.ac.id,b@itb.ac.id,c@itb.ac.id,d@itb.ac.id,e@itb.ac.id
 *   npx tsx scripts/create-admins.ts --base you@gmail.com --reset     -> new passwords for accounts that already exist
 *
 * Passwords are generated here, never stored in the repo. They are written once to
 * admin-credentials.local.txt (mode 600, git-ignored). Store them in a password manager, then delete the file.
 * Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL in .env.
 */
import "dotenv/config";
import { randomInt } from "node:crypto";
import { writeFileSync, existsSync, readFileSync, appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const OUT = "admin-credentials.local.txt";
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const flag = (n: string) => process.argv.includes(`--${n}`);
const COUNT = Number(arg("count") ?? 5);

function emails(): string[] {
  const list = arg("emails");
  if (list) return list.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const base = arg("base")?.trim().toLowerCase();
  const m = base?.match(/^([^@+\s]+)@([^@\s]+\.[^@\s]+)$/);
  if (!m) throw new Error("Give --base you@gmail.com or --emails a@x.com,b@x.com,...");
  return Array.from({ length: COUNT }, (_, i) => `${m[1]}+gsic-admin${i + 1}@${m[2]}`);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function password(len = 20): string {
  const pick = (set: string) => set[randomInt(set.length)]!;
  // guarantee upper, lower and digit, then fill with CSPRNG output
  const chars = [pick("ABCDEFGHJKLMNPQRSTUVWXYZ"), pick("abcdefghijkmnopqrstuvwxyz"), pick("23456789")];
  while (chars.length < len) chars.push(pick(ALPHABET));
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j]!, chars[i]!]; }
  return chars.join("");
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.DATABASE_URL) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL in .env first.");
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const targets = emails();

  // existing auth users, matched by email
  const existing = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    data.users.forEach((u) => u.email && existing.set(u.email.toLowerCase(), u.id));
    if (data.users.length < 200) break;
  }

  const lines: string[] = [];
  for (const [i, email] of targets.entries()) {
    const name = `GSIC Admin ${i + 1}`;
    let id = existing.get(email);
    let pw: string | null = null;
    if (!id) {
      pw = password();
      const { data, error } = await sb.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { name } });
      if (error) throw new Error(`${email}: ${error.message}`);
      id = data.user.id;
    } else if (flag("reset")) {
      pw = password();
      const { error } = await sb.auth.admin.updateUserById(id, { password: pw, email_confirm: true });
      if (error) throw new Error(`${email}: ${error.message}`);
    }
    await prisma.user.upsert({
      where: { email },
      update: { role: "admin", isVerified: true, emailConfirmed: true },
      create: { id, email, name, role: "admin", isVerified: true, emailConfirmed: true, skills: [], },
    });
    lines.push(pw ? `${email}\t${pw}` : `${email}\t(existing account, password unchanged; use --reset to issue a new one)`);
    console.log(`${pw ? "created/reset" : "promoted "}  ${email}`);
  }

  writeFileSync(OUT, `GSIC Hub admin credentials, generated ${new Date().toISOString()}\nSign in at /auth. Change each password after first sign-in, then delete this file.\n\n${lines.join("\n")}\n`, { mode: 0o600 });
  // make sure the file can never be committed by accident
  const gi = existsSync(".gitignore") ? readFileSync(".gitignore", "utf8") : "";
  if (!gi.includes("*.local.txt")) appendFileSync(".gitignore", "\n# local secrets\n*.local.txt\n*.local.json\n");
  console.log(`\nCredentials written to ${OUT} (git-ignored). Nothing was printed to the terminal.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
