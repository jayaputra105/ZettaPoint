import { useEffect, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ShootingStars = lazy(() => import("@/components/ShootingStars"));

interface Step {
  key: string;
  label: string;
}

const STEPS: Step[] = [
  { key: "profile", label: "Profile" },
  { key: "tasks", label: "Tasks" },
  { key: "balance", label: "Balance" },
];

interface Props {
  completedSteps: string[];
  visible: boolean;
}

export default function LoadingScreen({ completedSteps, visible }: Props) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          <Suspense fallback={null}>
            <ShootingStars />
          </Suspense>

          <div className="relative z-10 flex flex-col items-center gap-8 px-8">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.4)]">
                <span className="text-4xl">⚡</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Zetta<span className="text-yellow-400">Point</span>
              </h1>
            </motion.div>

            {/* Step indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-2.5 w-full max-w-[200px]"
            >
              {STEPS.map((step) => {
                const done = completedSteps.includes(step.key);
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      done
                        ? "bg-yellow-400 shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                        : "bg-white/10 border border-white/20"
                    }`}>
                      {done && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          className="text-[10px] text-black font-black"
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                    <span className={`text-xs font-bold transition-colors duration-300 ${
                      done ? "text-yellow-400" : "text-white/40"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]"
            >
              Loading{dots}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
