"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { ExternalLink, CheckCircle, Clock, Upload, ChevronRight, Coins } from "lucide-react";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  rewardCoins: number;
  link: string | null;
  active: boolean;
  completion: { status: string; screenshotUrl?: string } | null;
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

const TYPE_ICONS: Record<string, string> = {
  social: "📣",
  screenshot: "📸",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUpload, setActiveUpload] = useState<number | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const getTelegramId = () => {
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user?.id?.toString();
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const tid = getTelegramId();
    if (!tid) return;

    fetch(`/api/tasks?telegramId=${tid}`)
      .then((r) => r.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleVerify = async (task: Task) => {
    const tid = getTelegramId();
    if (task.completion || !tid) return;
    
    setSubmitting(task.id);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, telegramId: tid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast(`+${formatNumber(data.rewardCoins)} Coins claimed successfully!`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completion: { status: "completed" } } : t
        )
      );
    } catch (e: any) {
      showToast(e.message || "Failed to submit", "error");
    } finally {
      setSubmitting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleScreenshotSubmit = async (task: Task) => {
    const tid = getTelegramId();
    if (!uploadUrl) { showToast("Please select a screenshot first", "error"); return; }
    if (!tid) return;

    setSubmitting(task.id);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskId: task.id, 
          screenshotUrl: uploadUrl,
          telegramId: tid 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("Screenshot submitted! Awaiting admin verification.");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completion: { status: "pending" } } : t
        )
      );
      setActiveUpload(null);
      setUploadUrl("");
    } catch (e: any) {
      showToast(e.message || "Submission failed", "error");
    } finally {
      setSubmitting(null);
    }
  };

  const social = tasks.filter((t) => t.type === "social");
  const screenshot = tasks.filter((t) => t.type === "screenshot");
  const completedCount = tasks.filter((t) => t.completion?.status === "completed").length;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #050508 60%, #000 100%)" }}
    >
      <ShootingStars />
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-5 pb-4">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-black text-2xl uppercase tracking-tight" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
              Daily Quests
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Complete missions to earn rewards
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 rounded-2xl p-3 flex items-center gap-3"
            style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)" }}
          >
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Progress</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : "0%",
                      background: "linear-gradient(90deg, #FFD700, #FF8C00)",
                      boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: "#FFD700" }}>
                  {completedCount}/{tasks.length}
                </span>
              </div>
            </div>
          </motion.div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full"
              style={{ border: "3px solid rgba(255,215,0,0.15)", borderTop: "3px solid #FFD700" }}
            />
          </div>
        ) : (
          <>
            {[{ label: "📣 Social Missions", items: social }, { label: "📸 Proof Upload", items: screenshot }].map(({ label, items }) => (
              <section key={label} className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(255,215,0,0.6)" }}>
                  {label}
                </p>
                <div className="flex flex-col gap-3">
                  {items.map((task, i) => {
                    const isDone = task.completion?.status === "completed";
                    const isPending = task.completion?.status === "pending";
                    const isOpen = activeUpload === task.id;

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl overflow-hidden"
                        style={{
                          background: isDone ? "rgba(74,222,128,0.05)" : isPending ? "rgba(251,191,36,0.05)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isDone ? "rgba(74,222,128,0.3)" : isPending ? "rgba(251,191,36,0.3)" : "rgba(255,215,0,0.15)"}`,
                        }}
                      >
                        <div className="flex items-center gap-3 p-3.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}>
                            {TYPE_ICONS[task.type] ?? "✅"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate" style={{ color: isDone ? "#4ade80" : "#fff" }}>
                              {task.title}
                            </p>
                            <p className="text-[11px] truncate opacity-50">{task.description}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Coins size={11} className="text-yellow-500" />
                              <span className="text-xs font-black text-yellow-500">+{formatNumber(task.rewardCoins)}</span>
                            </div>
                          </div>

                          {!isDone && !isPending && (
                            task.type === "social" ? (
                              <div className="flex items-center gap-2">
                                {task.link && (
                                  <a href={task.link} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
                                    <ExternalLink size={14} className="text-yellow-500" />
                                  </a>
                                )}
                                <button onClick={() => handleVerify(task)} disabled={submitting === task.id} className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-yellow-500 text-black disabled:opacity-50">
                                  {submitting === task.id ? "..." : "Verify"}
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => { setActiveUpload(isOpen ? null : task.id); setUploadUrl(""); }} className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20">
                                <ChevronRight size={16} className={`text-yellow-500 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                              </button>
                            )
                          )}
                          {(isDone || isPending) && (
                            isDone ? <CheckCircle size={20} className="text-green-400" /> : <Clock size={20} className="text-amber-400" />
                          )}
                        </div>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="px-3.5 pb-3.5 border-t border-white/5">
                                <p className="text-[10px] my-2 opacity-50">Upload screenshot to verify completion:</p>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                {uploadUrl ? (
                                  <div className="relative mb-2">
                                    <img src={uploadUrl} alt="preview" className="w-full h-28 object-cover rounded-xl" />
                                    <button onClick={() => setUploadUrl("")} className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full text-[10px]">×</button>
                                  </div>
                                ) : (
                                  <button onClick={() => fileRef.current?.click()} className="w-full h-20 rounded-xl flex flex-col items-center justify-center gap-1 border-1.5 border-dashed border-yellow-500/30 bg-yellow-500/5">
                                    <Upload size={18} className="opacity-30" />
                                    <span className="text-[10px] opacity-30 uppercase font-bold">Select Screenshot</span>
                                  </button>
                                )}
                                <button onClick={() => handleScreenshotSubmit(task)} disabled={submitting === task.id || !uploadUrl} className="w-full py-2.5 rounded-xl font-black text-[10px] uppercase bg-yellow-500 text-black disabled:opacity-20">
                                  {submitting === task.id ? "Uploading..." : "Submit for Review"}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3 text-xs font-bold backdrop-blur-xl" style={{ background: toast.type === "success" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${toast.type === "success" ? "#4ade80" : "#f87171"}`, color: toast.type === "success" ? "#4ade80" : "#f87171" }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}