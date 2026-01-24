// src/components/layout/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-100">AutoML Studio</span>
            </div>
            <p className="text-gray-400 max-w-md">
              An AI-powered no-code platform for automated machine learning pipeline recommendation, training, and optimization.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="/model-type" className="text-gray-400 hover:text-indigo-400">Get Started</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-indigo-400">About</Link></li>
              <li><Link href="/docs" className="text-gray-400 hover:text-indigo-400">Documentation</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-400 hover:text-indigo-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-indigo-400">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AutoML Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}