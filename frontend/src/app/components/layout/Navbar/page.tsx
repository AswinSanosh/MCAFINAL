// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Get Started", href: "/model-type" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-xl border-b border-gray-700/50 absolute w-full overflow-hidden top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-xl">A</span>
            </motion.div>
            <motion.span
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              AutoML Studio
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                  pathname === item.href
                    ? "text-indigo-300"
                    : "text-gray-300 hover:text-indigo-300"
                }`}
              >
                {pathname === item.href && (
                  <motion.div
                    className="absolute inset-0 bg-indigo-900/30 rounded-lg -z-10"
                    layoutId="navbarIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href="/model-type">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                Get Started
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
