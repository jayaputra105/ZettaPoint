"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CheckSquare, PieChart, CircleStar, Wallet } from "lucide-react";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { id: "spin", label: "Spin", icon: PieChart, href: "/spin" },
  { id: "leaderboard", label: "Rank", icon: Circlestar, href: "/leaderboard" },
  { id: "wallet", label: "Wallet", icon: Wallet, href: "/wallet" },
];

export default function BottomNav() {
  const pathname = usePathname();
  
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3"
      style={{
        background:
          "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.95) 100%)",
        pointerEvents: "none",
      }}
    >
      <div
        className="relative mx-auto flex items-center justify-around max-w-md rounded-2xl px-2 py-2.5"
        style={{
          pointerEvents: "auto",
          background:
            "linear-gradient(180deg, rgba(20,15,5,0.95) 0%, rgba(8,6,2,0.98) 100%)",
          backgroundImage: `
            linear-gradient(180deg, rgba(20,15,5,0.95) 0%, rgba(8,6,2,0.98) 100%),
            linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)
          `,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          border: "1.5px solid transparent",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(255,215,0,0.15), inset 0 1px 0 rgba(255,215,0,0.2), inset 0 -1px 0 rgba(255,215,0,0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {navItems.map(({ id, label, icon: Icon, href }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={id}
              href={href}
              className="relative flex flex-col items-center justify-center flex-1"
              style={{ textDecoration: "none", minHeight: 56 }}
            >
              {isActive ? (
                <>
                  <motion.div
                    layoutId="bottomnav-active-fab"
                    animate={{ y: -18, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="absolute flex items-center justify-center rounded-full"
                    style={{
                      width: 54,
                      height: 54,
                      background:
                        "radial-gradient(circle at 30% 25%, #FFF7C4 0%, #FFD700 40%, #E6A800 75%, #B8860B 100%)",
                      border: "2px solid rgba(255,247,196,0.7)",
                      boxShadow:
                        "0 0 20px rgba(255,215,0,0.7), 0 0 40px rgba(255,215,0,0.35), 0 6px 16px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.5), inset 0 -3px 8px rgba(139,101,0,0.4)",
                    }}
                  >
                    <motion.div
                      animate={{ skewX: -10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    >
                      <Icon
                        size={26}
                        strokeWidth={2.5}
                        style={{
                          color: "#8B6500",
                          filter: "drop-shadow(0 1px 2px rgba(255,255,255,0.4))",
                        }}
                      />
                    </motion.div>
                  </motion.div>

                  <motion.span
                    animate={{ skewX: -8, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-[10px] font-black tracking-wider uppercase"
                    style={{
                      marginTop: 38,
                      color: "#FFD700",
                      textShadow:
                        "0 0 8px rgba(255,215,0,0.8), 0 0 4px rgba(255,215,0,0.5)",
                      fontStyle: "italic",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {label}
                  </motion.span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ skewX: 0, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="flex items-center justify-center"
                    style={{ width: 32, height: 32 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={2}
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    />
                  </motion.div>

                  <motion.span
                    animate={{ skewX: 0, opacity: 0.55 }}
                    transition={{ duration: 0.25 }}
                    className="text-[10px] font-black tracking-wider uppercase"
                    style={{
                      marginTop: 4,
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {label}
                  </motion.span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
