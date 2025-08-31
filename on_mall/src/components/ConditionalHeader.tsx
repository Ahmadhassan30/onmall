"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show header on auth pages
  if (pathname?.startsWith("/auth/")) {
    return null;
  }
  
  return <Header />;
}
