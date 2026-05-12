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

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleVerify = async (task: Task) => {
    if (task.completion) return;
    setSubmitting(task.id);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`+${formatNumber(data.rewardCoins)} Koin berhasil diklaim!`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completion: { status: "completed" } } : t
        )
      );
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal submit", "error");
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
    if (!uploadUrl) { showToast("Pilih screenshot terlebih dahulu", "error"); return; }
    setSubmitting(task.id);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, screenshotUrl: uploadUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Screenshot terkirim! Menunggu verifikasi admin.");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completion: { status: "pending" } } : t
        )
      );
      setActiveUpload(null);
      setUploadUrl("");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal submit", "error");
    } finally {
      setSubmitting(null);
    }
  };

  const social = tasks.filter((t) => t.type === "social");
  const screenshot = tasks.filter((t) => t.type === "screenshot");
  const completed = tasks.filter((t) => t.completion?.status === "completed").length;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #050508 60%, #000 100%)" }}
    >
      <ShootingStars />
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-5 pb-4">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-black text-2xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
              Misi Harian
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Selesaikan misi & kumpulkan koin
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-3 rounded-2xl p-3 flex items-center gap-3"
            style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)" }}
          >
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Progress</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: tasks.length > 0 ? `${(completed / tasks.length) * 100}%` : "0%",
                      background: "linear-gradient(90deg, #FFD700, #FF8C00)",
                      boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: "#FFD700" }}>
                  {completed}/{tasks.length}
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
            {[{ label: "📣 Misi Sosial", items: social }, { label: "📸 Upload Bukti", items: screenshot }].map(({ label, items }) => (
              <section key={label} className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,215,0,0.5)" }}>
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
                        transition={{ delay: i * 0.07 }}
                        className="rounded-2xl overflow-hidden"
                        style={{
                          background: isDone
                            ? "rgba(74,222,128,0.05)"
                            : isPending
                            ? "rgba(251,191,36,0.05)"
                            : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isDone ? "rgba(74,222,128,0.3)" : isPending ? "rgba(251,191,36,0.3)" : "rgba(255,215,0,0.15)"}`,
                        }}
                      >
                        <div className="flex items-center gap-3 p-3.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}
                          >
                            {TYPE_ICONS[task.type] ?? "✅"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-semibold text-sm leading-tight truncate"
                              style={{ color: isDone ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.9)" }}
                            >
                              {task.title}
                            </p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                              {task.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Coins size={11} style={{ color: "#FFD700" }} />
                              <span className="text-xs font-bold" style={{ color: "#FFD700" }}>
                                +{formatNumber(task.rewardCoins)}
                              </span>
                              {isDone && (
                                <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                                  ✓ Selesai
                                </span>
                              )}
                              {isPending && (
                                <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                                  ⏳ Review
                                </span>
                              )}
                            </div>
                          </div>

                          {!isDone && !isPending && (
                            task.type === "social" ? (
                              <div className="flex items-center gap-1.5">
                                {task.link && (
                                  <a
                                    href={task.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}
                                  >
                                    <ExternalLink size={14} style={{ color: "#FFD700" }} />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleVerify(task)}
                                  disabled={submitting === task.id}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                                  style={{
                                    background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                                    color: "#000",
                                    opacity: submitting === task.id ? 0.6 : 1,
                                  }}
                                >
                                  {submitting === task.id ? "..." : "Verify"}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setActiveUpload(isOpen ? null : task.id); setUploadUrl(""); }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}
                              >
                                <ChevronRight
                                  size={16}
                                  style={{
                                    color: "#FFD700",
                                    transform: isOpen ? "rotate(90deg)" : "none",
                                    transition: "transform 0.2s",
                                  }}
                                />
                              </button>
                            )
                          )}
                          {(isDone || isPending) && (
                            isDone ? (
                              <CheckCircle size={20} style={{ color: "#4ade80", flexShrink: 0 }} />
                            ) : (
                              <Clock size={20} style={{ color: "#fbbf24", flexShrink: 0 }} />
                            )
                          )}
                        </div>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3.5 pb-3.5 pt-0 border-t" style={{ borderColor: "rgba(255,215,0,0.1)" }}>
                                <p className="text-xs mb-2 mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                                  Upload screenshot bukti sebagai verifikasi:
                                </p>
                                <input
                                  ref={fileRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleFileChange}
                                />
                                {uploadUrl ? (
                                  <div className="relative mb-2">
                                    <img src={uploadUrl} alt="preview" className="w-full h-28 object-cover rounded-xl" />
                                    <button
                                      onClick={() => setUploadUrl("")}
                                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                      style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => fileRef.current?.click()}
                                    className="w-full h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 mb-2"
                                    style={{ background: "rgba(255,215,0,0.05)", border: "1.5px dashed rgba(255,215,0,0.25)" }}
                                  >
                                    <Upload size={18} style={{ color: "rgba(255,215,0,0.5)" }} />
                                    <span className="text-xs" style={{ color: "rgba(255,215,0,0.5)" }}>Pilih Screenshot</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleScreenshotSubmit(task)}
                                  disabled={submitting === task.id || !uploadUrl}
                                  className="w-full py-2.5 rounded-xl font-bold text-sm"
                                  style={{
                                    background: uploadUrl ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "rgba(255,215,0,0.1)",
                                    color: uploadUrl ? "#000" : "rgba(255,215,0,0.3)",
                                    opacity: submitting === task.id ? 0.6 : 1,
                                  }}
                                >
                                  {submitting === task.id ? "Mengirim..." : "Kirim untuk Verifikasi"}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 z-50 rounded-2xl px-5 py-3 text-sm font-semibold"
            style={{
              transform: "translateX(-50%)",
              background: toast.type === "success" ? "rgba(74,222,128,0.15)" : "rgba(255,80,80,0.15)",
              border: `1px solid ${toast.type === "success" ? "rgba(74,222,128,0.4)" : "rgba(255,80,80,0.4)"}`,
              color: toast.type === "success" ? "#4ade80" : "#f87171",
              backdropFilter: "blur(12px)",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
