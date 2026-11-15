"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Shell racine client : masque sidebar/Header sur /a-propos (expérience immersive). */
export function AppChrome({ children, sidebar, header }: { children: ReactNode; sidebar: ReactNode; header: ReactNode }) {
  const pathname = usePathname();
  const immersive = pathname === "/a-propos";

  if (immersive) {
    return (
      <main className="min-h-screen w-full bg-[#E6E0CF] text-encre">
        {children}
      </main>
    );
  }

  return (
    <div className="lg:pl-64">
      {sidebar}
      {header}
      <main className="mx-auto min-h-[68vh] max-w-[920px] px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
