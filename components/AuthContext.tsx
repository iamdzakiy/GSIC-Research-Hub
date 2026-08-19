"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/types";
import { getUserProfile, saveUserProfile, createUserProfile } from "@/services/userService";

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
    if (profile) setUserProfile(profile as UserProfile);
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.id) as UserProfile | null;
        if (profile) {
          setUserProfile(profile);
        } else {
          // Create a new profile if the user doesn't have one yet
          const newProfile = createDefaultProfile(
            currentUser.id,
            currentUser.email || "",
            currentUser.user_metadata?.name || ""
          );
          try {
            await createUserProfile(newProfile);
          } catch (e) {
            console.error("Profile creation error:", e);
          }
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.id) as UserProfile | null;
        if (profile) {
          setUserProfile(profile);
        } else {
          const newProfile = createDefaultProfile(
            currentUser.id,
            currentUser.email || "",
            currentUser.user_metadata?.name || ""
          );
          try {
            await createUserProfile(newProfile);
          } catch (e) {
            console.error("Profile creation error:", e);
          }
          setUserProfile(newProfile);
        }
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
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