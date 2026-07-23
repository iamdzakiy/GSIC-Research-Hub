"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
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
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
      try {
        const localProfile = localStorage.getItem(`gsic_profile_${user.uid}`);
        if (localProfile) {
          setUserProfile(JSON.parse(localProfile));
        }
      } catch {}
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(true);

      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid);

          if (!profile) {
            const defaultProfile = createDefaultProfile(
              firebaseUser.uid,
              firebaseUser.email || "",
              firebaseUser.displayName || "User"
            );
            await saveUserProfile(firebaseUser.uid, defaultProfile);
            profile = defaultProfile;
          }

          setUserProfile(profile);
        } catch (err) {
          console.error("Error fetching profile from Firestore:", err);
          try {
            const localProfile = localStorage.getItem(`gsic_profile_${firebaseUser.uid}`);
            if (localProfile) {
              setUserProfile(JSON.parse(localProfile));
            } else {
              const defaultProfile = createDefaultProfile(
                firebaseUser.uid,
                firebaseUser.email || "",
                firebaseUser.displayName || "User"
              );
              localStorage.setItem(`gsic_profile_${firebaseUser.uid}`, JSON.stringify(defaultProfile));
              setUserProfile(defaultProfile);
            }
          } catch {}
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = userProfile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}