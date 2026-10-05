#!/usr/bin/env python3
"""Adds softSkills / interests / archetype / bccRole to the profile plumbing and makes AuthContext
create the first profile from the sign-up metadata. Idempotent; each step is skipped if already applied."""
import re, sys, pathlib

def patch(path, fn):
    p = pathlib.Path(path)
    if not p.exists():
        print("skip (missing):", path); return
    s = p.read_text(encoding="utf-8"); n = fn(s)
    if n != s:
        p.write_text(n, encoding="utf-8"); print("patched:", path)
    else:
        print("unchanged:", path)

def types(s):
    if "softSkills" in s: return s
    return s.replace("  skills: string[];\n  bio: string;", "  skills: string[];\n  softSkills?: string[];\n  interests?: string[];\n  archetype?: string | null;\n  bccRole?: string | null;\n  bio: string;", 1)

def service(s):
    if "softSkills" in s: return s
    return s.replace("    skills: u.skills || [],\n", "    skills: u.skills || [],\n    softSkills: u.softSkills || [],\n    interests: u.interests || [],\n    archetype: u.archetype || null,\n    bccRole: u.bccRole || null,\n", 1)

def auth(s):
    if "profileFromMeta" in s: return s
    s = s.replace("function createDefaultProfile(uid: string, email: string, name: string): UserProfile {",
        "function profileFromMeta(meta: Record<string, unknown> | undefined) {\n  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === \"string\") : []);\n  const str = (v: unknown) => (typeof v === \"string\" ? v : \"\");\n  return {\n    faculty: str(meta?.faculty), major: str(meta?.major), majorCode: str(meta?.majorCode) || undefined,\n    year: Number(meta?.year) || new Date().getFullYear(), whatsapp: str(meta?.whatsapp),\n    skills: list(meta?.skills), softSkills: list(meta?.softSkills), interests: list(meta?.interests),\n    archetype: str(meta?.archetype) || null, bccRole: str(meta?.bccRole) || null,\n  };\n}\n\nfunction createDefaultProfile(uid: string, email: string, name: string, meta?: Record<string, unknown>): UserProfile {", 1)
    # spread metadata into the returned default profile
    s = s.replace("    faculty: \"\",\n    major: \"\",\n    year: new Date().getFullYear(),\n    whatsapp: \"\",\n", "    faculty: \"\",\n    major: \"\",\n    year: new Date().getFullYear(),\n    whatsapp: \"\",\n", 1)
    s = re.sub(r"(createDefaultProfile\(\s*currentUser\.id,\s*currentUser\.email \|\| \"\",\s*currentUser\.user_metadata\?\.name \|\| \"\")(\s*\))",
               r"\1,\n            currentUser.user_metadata\2", s)
    # after the default object is built, merge the metadata
    s = s.replace("    createdAt: new Date().toISOString(),\n  };\n}\n\nexport function AuthProvider", "    createdAt: new Date().toISOString(),\n    ...profileFromMeta(meta),\n  };\n}\n\nexport function AuthProvider", 1)
    return s

patch("lib/types.ts", types)
patch("services/userService.ts", service)
patch("components/AuthContext.tsx", auth)
