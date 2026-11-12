"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { MeshDrift } from "@/components/mesh-drift";
import { LiquidNavbar, NimbusIcons, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar";

const links: (LiquidNavItem & { href: string })[] = [
  { href: "/dashboard", label: "Dashboard", icon: NimbusIcons.home, fx: "glow" },
  { href: "/customers", label: "Customers", icon: NimbusIcons.user, fx: "wave" },
  { href: "/schemes", label: "Schemes", icon: NimbusIcons.drop, fx: "drop" },
  { href: "/archived", label: "Archived", icon: NimbusIcons.globe, fx: "spin" },
  { href: "/settings", label: "Settings", icon: NimbusIcons.plane, fx: "plane" },
];

function activeIndex(pathname: string) {
  const index = links.findIndex((link) => pathname === link.href || pathname.startsWith(`${link.href}/`));
  return index < 0 ? 0 : index;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const firstView = useRef(true);
  useEffect(() => {
    const heading = document.querySelector("main h1");
    if (!(heading instanceof HTMLElement)) return;
    heading.tabIndex = -1;
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    heading.focus();
  }, [pathname]);

  return (
    <div className="isolate min-h-dvh text-zinc-950">
      <MeshDrift />
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 px-4 py-4">
        <div className="flex justify-center">
          <LiquidNavbar
            tone="light"
            sound={false}
            active={activeIndex(pathname)}
            items={links.map(({ label, icon, fx }) => ({ label, icon, fx }))}
            onChange={(index) => router.push(links[index].href)}
          />
        </div>
      </header>
      <main id="content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
