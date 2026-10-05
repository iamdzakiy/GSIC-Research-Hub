/**
 * Local diagnosis for "500 Internal Server Error".   usage:  npx tsx scripts/doctor.ts
 * Checks: env vars, DB connection, schema drift (every model/column in prisma/schema.prisma exists),
 * Supabase service-role key, auth.users access, SMTP login. Prints exactly what to fix.
 */
import "dotenv/config";
import fs from "node:fs";
import { Client } from "pg";

const ok = (m: string) => console.log(`  ✓ ${m}`);
const bad = (m: string, fix?: string) => { console.log(`  ✗ ${m}${fix ? `\n      -> ${fix}` : ""}`); problems++; };
let problems = 0;

function parseSchema() {
  const src = fs.readFileSync("prisma/schema.prisma", "utf8");
  const enums = new Set([...src.matchAll(/^enum\s+(\w+)/gm)].map((m) => m[1]!));
  const scalars = new Set(["String", "Int", "Float", "Boolean", "DateTime", "Json", "BigInt", "Decimal", "Bytes"]);
  const models: Record<string, string[]> = {};
  for (const m of src.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const cols: string[] = [];
    for (const line of m[2]!.split("\n")) {
      const t = line.trim().match(/^(\w+)\s+(\w+)(\[\])?(\?)?/);
      if (!t || line.trim().startsWith("@@") || line.trim().startsWith("//")) continue;
      const [, name, type, list] = t;
      if (scalars.has(type!) || enums.has(type!)) cols.push(name!);
      else if (list && false) cols.push(name!);
    }
    models[m[1]!] = cols;
  }
  return models;
}

async function main() {
  console.log("\n1) Environment");
  const need: [string, string][] = [
    ["DATABASE_URL", "Supabase pooled connection string"], ["DIRECT_URL", "Supabase direct (5432) connection string, needed for prisma db push"],
    ["NEXT_PUBLIC_SUPABASE_URL", ""], ["NEXT_PUBLIC_SUPABASE_ANON_KEY", ""], ["SUPABASE_SERVICE_ROLE_KEY", "Supabase > Project Settings > API > service_role (server only)"],
    ["NEXT_PUBLIC_SITE_URL", "e.g. https://your-domain.tld"], ["SMTP_HOST", ""], ["SMTP_USER", ""], ["SMTP_PASSWORD", ""],
  ];
  for (const [k, h] of need) process.env[k] ? ok(k) : bad(`${k} is missing`, h || "add to .env.local AND to Vercel > Settings > Environment Variables");

  console.log("\n2) Database");
  if (!process.env.DATABASE_URL) { bad("skipped (no DATABASE_URL)"); return; }
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try { await db.connect(); ok("connected"); } catch (e) { bad(`cannot connect: ${(e as Error).message}`, "check DATABASE_URL / password / network"); return; }

  const models = parseSchema();
  const { rows } = await db.query<{ table_name: string; column_name: string }>(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`);
  const have = new Map<string, Set<string>>();
  for (const r of rows) (have.get(r.table_name) ?? have.set(r.table_name, new Set()).get(r.table_name)!).add(r.column_name);
  let drift = 0;
  for (const [model, cols] of Object.entries(models)) {
    const t = have.get(model);
    if (!t) { bad(`table "${model}" does not exist`); drift++; continue; }
    const miss = cols.filter((c) => !t.has(c));
    if (miss.length) { bad(`table "${model}" is missing columns: ${miss.join(", ")}`); drift++; }
  }
  if (drift) console.log("\n      -> FIX:  npx prisma db push      (uses DIRECT_URL; adds the missing tables/columns, keeps your data)\n         This is the most common cause of 500s after applying portal v2: *.sql is in .gitignore, so migrations never reach\n         GitHub/Vercel; the production database has to be updated once with db push.");
  else ok(`schema matches prisma/schema.prisma (${Object.keys(models).length} models)`);

  try { await db.query("SELECT 1 FROM auth.users LIMIT 1"); ok("auth.users readable"); } catch (e) { bad(`auth.users not readable: ${(e as Error).message}`, "magic-link/resend need DB role access to auth schema"); }
  await db.end();

  console.log("\n3) Supabase service role");
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const { error } = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }).auth.admin.listUsers({ page: 1, perPage: 1 });
      error ? bad(`service role rejected: ${error.message}`, "wrong key? use the service_role key, not anon") : ok("service role key works");
    } catch (e) { bad(`supabase error: ${(e as Error).message}`); }
  } else bad("skipped (missing URL or service role key)");

  console.log("\n4) SMTP");
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      const nm = (await import("nodemailer")).default;
      const port = Number(process.env.SMTP_PORT) || 587;
      await nm.createTransport({ host: process.env.SMTP_HOST, port, secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }, connectionTimeout: 10000 }).verify();
      ok("SMTP login works");
    } catch (e) { bad(`SMTP failed: ${(e as Error).message}`, "check host/port/user/password (Gmail needs an App Password)"); }
  } else bad("skipped (SMTP_* not set)");

  console.log(problems ? `\n${problems} problem(s) found. Fix the ones marked ✗ above, then re-run.\n` : "\nAll checks passed.\n");
}
main().catch((e) => { console.error(e); process.exit(1); });
