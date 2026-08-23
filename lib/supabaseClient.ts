import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Dev fallback: when "Confirm email" is disabled in Supabase, users are
// auto-confirmed and can sign in immediately. Set NEXT_PUBLIC_DEV_AUTO_CONFIRM=1
// in .env.local to skip the "check your email" step during local development.
const DEV_AUTO_CONFIRM = process.env.NEXT_PUBLIC_DEV_AUTO_CONFIRM === "1";

// Auth helpers
export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      // Redirect back to the app after email confirmation. Update this to your
      // deployed URL in production (e.g. https://gsic-hub.vercel.app/auth).
      emailRedirectTo: `${window.location.origin}/auth`,
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
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}