// Client component for layout logic
"use client";

import { usePathname } from "next/navigation";
import { DatasetProvider } from "../lib/hooks/useDataset";
import { AuthProvider } from "../lib/AuthContext";
import Navbar from "../components/layout/Navbar/page";
import Footer from "../components/layout/Footer/Page";
import Sidebar from "../components/layout/Sidebar/Page";
import CacheButton from "../components/CacheButton/CacheButton";

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth");

  return (
    <AuthProvider>
      <DatasetProvider>
        {!isAuthRoute && <Navbar />}
        <div className={`flex flex-1 ${!isAuthRoute ? 'mt-16' : ''}`}>
          {!isAuthRoute && <Sidebar />}
          <div className="flex-1">
            <main>{children}</main>
            {!isAuthRoute && <Footer />}
          </div>
        </div>
        {!isAuthRoute && <CacheButton />}
      </DatasetProvider>
    </AuthProvider>
  );
}
