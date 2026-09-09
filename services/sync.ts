import { apiFetch, extractError } from "@/lib/apiFetch";
import { SheetName } from "@/lib/googleSheets";

export interface SyncResult {
  success: boolean;
  error?: string;
  results: Partial<Record<SheetName, number>>;
  summary?: { users: number; registrations: number; testResults: number };
}

/** Triggers a Google Sheets sync for the given targets (defaults to all). */
export async function triggerSync(targets?: SheetName[]): Promise<SyncResult> {
  const res = await apiFetch("/api/sync", {
    method: "POST",
    body: JSON.stringify({ targets }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || (await extractError(res)));
  }
  return data;
}