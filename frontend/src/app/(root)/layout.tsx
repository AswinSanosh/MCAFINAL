// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";

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
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.className} flex min-h-screen flex-col bg-(--color-bg) text-(--color-text)`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
