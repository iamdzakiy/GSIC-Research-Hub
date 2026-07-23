"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Target,
  GraduationCap,
  Sparkles,
  Shield,
  User,
  LogOut,
  Home,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function Navbar() {
  const { user, userProfile, loading, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const iconProps = { className: "w-3.5 h-3.5" };
  const iconPropsMd = { className: "w-5 h-5" };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#opportunities", label: "Opportunities", icon: Target },
    {
      label: "Events",
      icon: GraduationCap,
      subLinks: [
        { href: "/events/pkm-bootcamp", label: "PKM Bootcamp", icon: GraduationCap },
        { href: "/events/sandbox", label: "The Sandbox", icon: Sparkles },
      ],
    },
  ];

  const handleSignOut = async () => {
    try {
      // Keep empty sign-out stub if real signOut is not wired here
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href.split("#")[0]);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition font-heading">
              G
            </div>
            <span className="text-lg font-bold font-heading">
              <span className="gradient-text">GSIC</span>
              <span className="text-white/50 text-sm font-normal">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-0.5 text-sm font-medium">
            {navLinks.map((link) => {
              if ("subLinks" in link) {
                // Dropdown for Events
                return (
                  <div key={link.label} className="relative group">
                    <button
                      className={`nav-link nav-underline px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5 ${
                        pathname.startsWith("/events") ? "active" : ""
                      }`}
                    >
                      {(() => { const Icon: any = link.icon; return <Icon {...iconProps} />; })()}
                      {link.label}
                    </button>
                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="glass rounded-xl py-2 border border-white/10">
                        {(link as any).subLinks.map((sub: { href: string; label: string; icon: any }) => {
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`block px-4 py-2 text-sm hover:bg-white/5 transition flex items-center gap-2 ${
                                pathname === sub.href ? "text-[#5CE3B6]" : "text-white/70"
                              }`}
                            >
                              {SubIcon && <SubIcon {...iconProps} />}
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
              const LIcon: any = (link as any).icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link nav-underline px-3 py-2 rounded-lg hover:bg-white/5 transition capitalize flex items-center gap-1.5 ${
                    isActive(link.href) ? "active" : ""
                  }`}
                >
                  {LIcon && <LIcon {...iconProps} />}
                  {link.label === "Home" ? "Home" : link.label}
                </Link>
              );
            })}

            {/* Admin Dashboard Link (only for admins) */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`nav-link nav-underline px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5 ${
                  pathname === "/admin" ? "active" : ""
                }`}
              >
                <Shield {...iconProps} />
                Admin
              </Link>
            )}

            {/* Participant Dashboard Link (for logged-in users) */}
            {user && !isAdmin && (
              <Link
                href="/dashboard"
                className={`nav-link nav-underline px-3 py-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5 ${
                  pathname === "/dashboard" ? "active" : ""
                }`}
              >
                <User {...iconProps} />
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Side: User Actions */}
          <div className="flex items-center space-x-2">
            {!loading && (
              <>
                {user ? (
                  <>
                    {/* User Profile Button */}
                    <Link
                      href={isAdmin ? "/admin" : "/dashboard"}
                      className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition group"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-xs font-bold overflow-hidden">
                        {userProfile?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={userProfile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (userProfile?.name || user.email || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium hidden sm:inline">
                        {userProfile?.name || "User"}
                      </span>
                      {userProfile?.role && (
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full hidden sm:inline">
                          {userProfile.role}
                        </span>
                      )}
                    </Link>

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition"
                      title="Sign Out"
                    >
                      <LogOut {...iconProps} />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className="text-xs bg-[#5CE3B6]/20 text-[#5CE3B6] px-3 py-1.5 rounded-full border border-[#5CE3B6]/30 hover:bg-[#5CE3B6]/30 transition"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white/60 hover:text-white ml-1"
            >
              {mobileMenuOpen ? <X {...iconPropsMd} /> : <Menu {...iconPropsMd} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden px-4 pb-4 space-y-1 text-sm font-medium border-t border-white/5 bg-[#0a0a2e]/90 backdrop-blur-xl"
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg hover:bg-white/5"
              >
                🏠 Home
              </Link>
              <Link
                href="/#opportunities"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg hover:bg-white/5"
              >
                🎯 Opportunities
              </Link>
              <Link
                href="/events/pkm-bootcamp"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg hover:bg-white/5"
              >
                🎓 PKM Bootcamp
              </Link>
              <Link
                href="/events/sandbox"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg hover:bg-white/5"
              >
                ✨ The Sandbox
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg hover:bg-white/5"
                >
                  ⚙️ Admin Dashboard
                </Link>
              )}
              {user && !isAdmin && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg hover:bg-white/5"
                >
                  👤 My Dashboard
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}