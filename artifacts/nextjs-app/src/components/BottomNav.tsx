"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Star, Trophy, Wallet } from "lucide-react";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { id: "spin", label: "Spin", icon: Star, href: "/spin" },
  { id: "leaderboard", label: "Rank", icon: Trophy, href: "/leaderboard" },
  { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,10,0.97) 0%, rgba(5,5,5,0.99) 100%)",
        borderTop: "1px solid rgba(255,215,0,0.25)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map(({ id, label, icon: Icon, href }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={id}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 relative"
              style={{ minWidth: 56, textDecoration: "none" }}
            >
              {isActive && (
                <span
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "rgba(255,215,0,0.08)",
                    border: "1px solid rgba(255,215,0,0.3)",
                  }}
                />
              )}
              <Icon
                size={22}
                style={{
                  color: isActive ? "#FFD700" : "rgba(255,255,255,0.4)",
                  filter: isActive ? "drop-shadow(0 0 6px #FFD700)" : "none",
                  transition: "all 0.2s",
                }}
              />
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{
                  color: isActive ? "#FFD700" : "rgba(255,255,255,0.4)",
                  textShadow: isActive ? "0 0 8px #FFD700" : "none",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
