// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useDataset } from "../../../lib/hooks/useDataset";
import { useAuth } from "../../../lib/AuthContext";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "History", href: "/history" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { clearSession, datasetId, trainingResult } = useDataset();
  const { user, isAuthenticated, logout } = useAuth();

  const hasActiveSession = !!(datasetId || trainingResult);

  const handleNewSession = () => {
    if (hasActiveSession && !confirm("Start a new session? Your current progress will be cleared.")) return;
    clearSession();
    window.location.href = "/model-type";
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
      setMenuOpen(false);
    }
  };

  return (
    <header className="bg-gray-900/95 backdrop-blur-md shadow-xl border-b border-gray-800 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group" onClick={() => setMenuOpen(false)}>
            <motion.div
              className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-base">A</span>
            </motion.div>
            <motion.span
              className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-purple-400 hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              AutoML Studio
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  pathname === item.href ? "text-indigo-300" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {pathname === item.href && (
                  <motion.div
                    className="absolute inset-0 bg-indigo-900/30 rounded-lg -z-10"
                    layoutId="navbarIndicator"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-3">
            {hasActiveSession && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNewSession}
                title="Start a fresh session"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-amber-400 bg-gray-800/60 hover:bg-amber-900/20 border border-gray-700 hover:border-amber-700/50 rounded-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Session
              </motion.button>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-lg"
                    title="View Profile"
                  >
                    {user?.username.charAt(0).toUpperCase() || "U"}
                  </motion.div>
                </Link>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-700 transition-all"
                >
                  Logout
                </motion.button>
              </div>
            ) : (
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 20px -4px rgba(99,102,241,0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-bold shadow-md transition-all duration-200"
                >
                  Login
                </motion.button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ rotate: menuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </motion.svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-800 bg-gray-900/98 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-indigo-900/30 text-indigo-300"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {hasActiveSession && (
                <button
                  onClick={() => { setMenuOpen(false); handleNewSession(); }}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-900/20 transition-colors"
                >
                  ↺ New Session
                </button>
              )}
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-indigo-300 hover:bg-indigo-900/30 transition-colors"
                  >
                    👤 Profile
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium bg-indigo-600 text-white text-center hover:bg-indigo-700 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
