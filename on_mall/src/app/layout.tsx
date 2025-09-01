import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { Toaster } from "sonner";
import { ConditionalHeader } from "../components/ConditionalHeader";
import { RouteLoaderProvider } from "@/components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnMall",
  description: "An ecommerce store design for seamless shopping experience",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <RouteLoaderProvider>
            <ConditionalHeader />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster position="top-right" />
          </RouteLoaderProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
