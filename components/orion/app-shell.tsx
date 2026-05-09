import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/orion/logout-button";
import { OrionLogo } from "@/components/orion/orion-logo";
import { cn } from "@/lib/cn";

interface AppShellProps {
  active: "home" | "settings";
  children: ReactNode;
}

const navItems = [
  { href: "/home", label: "Home", value: "home" as const, icon: HomeIcon },
  { href: "/settings", label: "Settings", value: "settings" as const, icon: SettingsIcon }
];

export function AppShell({ active, children }: AppShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020514] text-slate-100">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_50%_100%,rgba(109,40,217,0.38),transparent_46%),linear-gradient(180deg,transparent,rgba(3,7,18,0.35))]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-[linear-gradient(135deg,transparent_0_24%,rgba(19,24,56,0.95)_24%_38%,transparent_38%),linear-gradient(45deg,transparent_0_52%,rgba(16,22,49,0.96)_52%_68%,transparent_68%)] opacity-70"
        aria-hidden
      />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[168px_1fr]">
        <aside className="flex flex-col border-white/10 px-4 py-6 lg:border-r">
          <OrionLogo priority className="w-32" />

          <nav className="mt-10 space-y-3" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.value;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-indigo-600/35 text-white shadow-[0_0_28px_rgba(79,70,229,0.18)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-4 pb-3">
            <LogoutButton className="w-full justify-center px-4 py-2.5" />
            <div className="hidden items-start gap-2 text-xs leading-relaxed text-slate-400 lg:flex">
              <ShieldIcon />
              <span>Your data is private and secure.</span>
            </div>
          </div>
        </aside>

        {children}
      </div>
    </main>
  );
}

function HomeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <title>Home</title>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="m3.5 11 8.5-7 8.5 7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M5.5 10v9h5v-5h3v5h5v-9" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <title>Settings</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
        d="m18.8 13.6.1.1 1.6 1.2-1.8 3.1-1.9-.8-.2.1a7 7 0 0 1-1.8 1l-.2.1-.3 2h-3.6l-.3-2-.2-.1a7 7 0 0 1-1.8-1l-.2-.1-1.9.8-1.8-3.1 1.6-1.2.1-.1a7.7 7.7 0 0 1 0-2.2l-.1-.1-1.6-1.2L6.3 7l1.9.8.2-.1a7 7 0 0 1 1.8-1l.2-.1.3-2h3.6l.3 2 .2.1a7 7 0 0 1 1.8 1l.2.1 1.9-.8 1.8 3.1-1.6 1.2-.1.1a7.7 7.7 0 0 1 0 2.2Z"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <title>Privacy shield</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        d="M12 3.5 19 6v5.4c0 4.4-2.8 7.5-7 9.1-4.2-1.6-7-4.7-7-9.1V6l7-2.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="m8.8 12.1 2 2 4.4-5" />
    </svg>
  );
}
