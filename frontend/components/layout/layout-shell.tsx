"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideGlobalChrome = pathname.startsWith("/operator") || pathname.startsWith("/panel-operatora") || pathname.startsWith("/admin");
  return (
    <>
      {!hideGlobalChrome && <Header />}
      {children}
      {!hideGlobalChrome && <Footer />}
    </>
  );
} 