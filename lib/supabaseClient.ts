import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Dev fallback: when "Confirm email" is disabled in Supabase, users are
// auto-confirmed and can sign in immediately. Set NEXT_PUBLIC_DEV_AUTO_CONFIRM=1
// in .env.local to skip the "check your email" step during local development.
export const DEV_AUTO_CONFIRM = process.env.NEXT_PUBLIC_DEV_AUTO_CONFIRM === "1";

// Resolve the site URL from env (production) or fall back to the current origin (dev).
// In production, set NEXT_PUBLIC_SITE_URL=https://gsic-research-hub.vercel.app
function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

// Auth helpers
export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${getSiteUrl()}/auth`,
    },
  })
  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth?mode=reset`,
  })
  if (error) throw error
}