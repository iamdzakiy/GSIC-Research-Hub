// ============================================================
// Auth-link generation (Supabase Admin API) + delivery (GSIC SMTP).
// Supabase only *generates* the one-time action link; the e-mail itself is
// rendered by us and sent through the GSIC mailbox, so the sender, branding
// and wording are fully under our control.
// ============================================================
import "server-only";
import { supabaseAdmin, siteUrl } from "@/lib/supabaseAdmin";
import { renderActionEmail } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export type LinkRequest =
  | { kind: "magic"; email: string; next?: string }
  | { kind: "reset"; email: string };

export type LinkOutcome = "sent" | "skipped";

/**
 * Looks the account up in the Prisma `User` table (every account has a row).
 * Used so magic-link never *creates* accounts as a side effect —
 * generateLink({type:"magiclink"}) would otherwise silently sign up unknown e-mails.
 */
async function userExists(email: string): Promise<boolean> {
  return !!(await prisma.user.findUnique({ where: { email }, select: { id: true } }));
}

const safeNext = (n?: string) => (n && /^\/(?!\/)[\w\-./?=&%]*$/.test(n) ? n : "/dashboard");

/**
 * Generates the link and e-mails it. Returns "skipped" (nothing sent) when the
 * request cannot be honoured *and* telling the caller would leak whether an
 * account exists — routes still answer with the same generic success message.
 */
export async function issueAndSendLink(req: Request, input: LinkRequest): Promise<LinkOutcome> {
  const site = siteUrl(req);
  const admin = supabaseAdmin().auth.admin;
  const callback = (next: string) => `${site}/auth/callback?next=${encodeURIComponent(next)}`;

  let actionLink: string | undefined;
  let name: string | undefined;

  if (input.kind === "reset") {
    const { data, error } = await admin.generateLink({
      type: "recovery",
      email: input.email,
      options: { redirectTo: callback("/auth?mode=reset") },
    });
    if (error) {
      if (/not.?found|no user|does not exist/i.test(error.message)) return "skipped";
      throw error;
    }
    actionLink = data.properties.action_link;
    name = (data.user?.user_metadata?.name as string | undefined) || undefined;
  } else {
    // magic-link sign-in
    if (!(await userExists(input.email))) return "skipped";
    const { data, error } = await admin.generateLink({
      type: "magiclink",
      email: input.email,
      options: { redirectTo: callback(safeNext(input.next)) },
    });
    if (error) throw error;
    actionLink = data.properties.action_link;
    name = (data.user?.user_metadata?.name as string | undefined) || undefined;
  }

  if (!actionLink) throw new Error("Supabase did not return an action link");

  const mail = renderActionEmail(input.kind, { url: actionLink, name, siteUrl: site });
  await sendMail({ to: input.email, ...mail });
  return "sent";
}
