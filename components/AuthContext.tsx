"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/types";
import { ensureProfile, getUserProfile } from "@/services/userService";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const profile = await getUserProfile(user.id);
    if (profile) setUserProfile(profile);
  };

  // Fetch the profile; create it once if the account has no row yet. Never throws.
  const loadProfile = async (currentUser: User | null) => {
    setUser(currentUser);
    try {
      if (!currentUser) return setUserProfile(null);
      setUserProfile((await getUserProfile(currentUser.id)) ?? (await ensureProfile(currentUser)));
    } catch (e) {
      console.error("Profile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: supabase-js must not be called inside this callback.
      setTimeout(() => void loadProfile(session?.user ?? null), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => loadProfile(session?.user ?? null));
    return () => listener?.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Admin status is controlled solely by the user's `role` field set to "admin"
  // in the Supabase database (User table). No separate admin account system.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(userProfile?.role === "admin");
  }, [userProfile]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}