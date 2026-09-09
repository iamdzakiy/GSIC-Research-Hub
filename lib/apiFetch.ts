import { supabase } from "@/lib/supabaseClient";

/**
 * Returns headers carrying the current Supabase access token so server
 * `requireUser` / `requireAdmin` guards succeed on mutation endpoints.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * `fetch` wrapper that attaches the current user's auth token. Used by the
 * client-side services that hit protected API routes.
 */
export async function apiFetch(
  url: string,
  options: RequestInit & { headers?: Record<string, string> } = {}
): Promise<Response> {
  const headers = { ...(await getAuthHeaders()), ...(options.headers || {}) };
  return fetch(url, { ...options, headers });
}

/** Convenience for parsing an error detail from a failed response. */
export async function extractError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}