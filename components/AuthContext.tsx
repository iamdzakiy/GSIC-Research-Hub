"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/types";
import { getUserProfile, saveUserProfile } from "@/services/userService";
import { getAdminAccounts } from "@/lib/firestore";

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

function createDefaultProfile(uid: string, email: string, name: string): UserProfile {
  return {
    uid,
    htaId: `HTA-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    email,
    name,
    faculty: "",
    major: "",
    year: new Date().getFullYear(),
    whatsapp: "",
    avatarUrl: null,
    classcardTheme: "blue",
    skills: [],
    bio: "",
    isVerified: false,
    role: "user",
    createdAt: new Date().toISOString(),
  };
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

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        getUserProfile(session.user.id).then(profile => setUserProfile(profile));
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (userProfile?.role === "admin") {
        setIsAdmin(true);
        return;
      }
      if (user?.email) {
        try {
          const admins = await getAdminAccounts();
          const isGeneratedAdmin = admins.some((a) => a.email.toLowerCase() === user.email!.toLowerCase());
          setIsAdmin(isGeneratedAdmin);
        } catch (e) {
          console.error("Admin check error:", e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user, userProfile]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}