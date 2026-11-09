// Notification kinds shown on /settings/notifications. Pure (client-safe).
export const NOTIFY_KINDS = {
  partner_response: { label: "New responses to my Seeking Partner posts", admin: false },
  partner_decision: { label: "My responses accepted or declined", admin: false },
  partner_expiring: { label: "My post closes soon and still has free slots", admin: false },
  deadline: { label: "Saved competitions closing in 7 days and 1 day", admin: false },
  event_open: { label: "Events I asked to be notified about open registration", admin: false },
  digest: { label: "Monday digest: competitions and partner posts that fit me", admin: false },
  admin_submission: { label: "Competitions submitted for review (admins)", admin: true },
} as const;
export type NotifyKind = keyof typeof NOTIFY_KINDS;
export const isNotifyKind = (k: unknown): k is NotifyKind => typeof k === "string" && k in NOTIFY_KINDS;

/** Missing or non-false means on. */
export function prefOn(prefs: unknown, kind: string): boolean {
  if (!prefs || typeof prefs !== "object") return true;
  return (prefs as Record<string, unknown>)[kind] !== false;
}
