// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DatasetProvider } from "../lib/hooks/useDataset";
import Navbar from "../components/layout/Navbar/page";
import Footer from "../components/layout/Footer/Page";
import Sidebar from "../components/layout/Sidebar/Page";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoML Studio",
  description: "No-code machine learning pipeline builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]`}
      >
        <DatasetProvider>
          <Navbar />
          <div className="flex flex-1 mt-16">
            <Sidebar />
            <div className="flex-1">
              <main>{children}</main>
              <Footer />
            </div>
          </div>
        </DatasetProvider>
      </body>
    </html>
  );
}
