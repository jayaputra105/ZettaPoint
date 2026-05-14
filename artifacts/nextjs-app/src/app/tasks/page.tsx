"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { ExternalLink, CheckCircle, Clock, Upload, ChevronRight, Coins } from "lucide-react";
import { useApp } from "@/context/AppProvider";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  rewardCoins: number;
  link: string | null;
  active: boolean;
  completion: { status: string;screenshotUrl ? : string } | null;
}

export default function TasksPage() {
  const { coins, setCoins } = useApp();
  const [tasks, setTasks] = useState < Task[] > ([]);
  const [loading, setLoading] = useState(true);
  const [activeUpload, setActiveUpload] = useState < number | null > (null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [submitting, setSubmitting] = useState < number | null > (null);
  const [toast, setToast] = useState < { msg: string;type: "success" | "error" } | null > (null);
  const fileRef = useRef < HTMLInputElement > (null);
  
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
      
      // Update Global State Koin tanpa fungsi updater
      const currentCoins = Number(coins) || 0; 
      setCoins(currentCoins + data.rewardCoins);
      
      showToast(`+${data.rewardCoins.toLocaleString()} Coins claimed!`);
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
  
  const handleScreenshotSubmit = async (task: Task) => {
    const tid = getTelegramId();
    if (!uploadUrl) return showToast("Select a screenshot", "error");
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
      if (!res.ok) throw new Error("Upload failed");
      
      showToast("Submitted! Awaiting verification.");
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completion: { status: "pending" } } : t
        )
      );
      setActiveUpload(null);
      setUploadUrl("");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(null);
    }
  };
  
  const social = tasks.filter((t) => t.type === "social");
  const screenshot = tasks.filter((t) => t.type === "screenshot");
  const completedCount = tasks.filter((t) => t.completion?.status === "completed").length;
  
  return (
    <div className="relative min-h-screen w-full bg-[#050508] text-white flex flex-col overflow-x-hidden">
      <ShootingStars />
      
      <div className="relative z-10 flex-1 max-w-md mx-auto w-full px-6 pt-8 pb-32">
        <header className="mb-8">
          <h1 className="text-3xl font-black italic tracking-tighter text-[#FFD700] uppercase">Missions</h1>
          <p className="text-[10px] opacity-40 uppercase tracking-[0.3em] mb-4">Complete & Earn Rewards</p>
          
          <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Daily Progress</span>
              <span className="text-xs font-black text-[#FFD700]">{completedCount}/{tasks.length}</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: tasks.length > 0 ? `${(completedCount/tasks.length)*100}%` : "0%" }} 
                className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]"
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest">Loading Tasks...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* SOCIAL SECTION */}
            <section>
              <h3 className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em] mb-4 px-2">Social Channels</h3>
              <div className="flex flex-col gap-3">
                {social.map(task => (
                  <div key={task.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">📣</div>
                      <div>
                        <p className="text-sm font-black tracking-tight">{task.title}</p>
                        <div className="flex items-center gap-1">
                          <Coins size={10} className="text-yellow-500" />
                          <p className="text-[10px] text-yellow-500 font-black">+{task.rewardCoins.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    {task.completion?.status === "completed" ? (
                      <CheckCircle size={22} className="text-[#4ade80]" />
                    ) : (
                      <div className="flex gap-2">
                        {task.link && (
                          <a href={task.link} target="_blank" className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <ExternalLink size={16} className="text-[#FFD700]"/>
                          </a>
                        )}
                        <button 
                          onClick={() => handleVerify(task)} 
                          disabled={submitting === task.id}
                          className="px-5 py-2.5 bg-[#FFD700] text-black text-[10px] font-black rounded-xl uppercase active:scale-95 transition-transform disabled:opacity-50"
                        >
                          {submitting === task.id ? "..." : "Verify"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* SCREENSHOT SECTION */}
            <section>
              <h3 className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em] mb-4 px-2">Proof Verification</h3>
              <div className="flex flex-col gap-3">
                {screenshot.map(task => (
                  <div key={task.id} className="rounded-[30px] bg-white/5 border border-white/5 overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">📸</div>
                        <div>
                          <p className="text-sm font-black tracking-tight">{task.title}</p>
                          <div className="flex items-center gap-1">
                            <Coins size={10} className="text-yellow-500" />
                            <p className="text-[10px] text-yellow-500 font-black">+{task.rewardCoins.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      {task.completion?.status === "completed" ? <CheckCircle size={22} className="text-[#4ade80]" /> : 
                       task.completion?.status === "pending" ? <Clock size={22} className="text-amber-400 animate-pulse" /> :
                       <button onClick={() => setActiveUpload(activeUpload === task.id ? null : task.id)} className="p-2 bg-white/5 rounded-xl">
                         <ChevronRight size={20} className={`transition-transform duration-300 ${activeUpload === task.id ? "rotate-90 text-[#FFD700]" : "opacity-30"}`} />
                       </button>}
                    </div>
                    
                    <AnimatePresence>
                      {activeUpload === task.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 border-t border-white/5 bg-white/[0.02]">
                            <p className="text-[9px] font-bold opacity-30 uppercase my-3 tracking-widest text-center">Required: Upload image proof</p>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const f = e.target.files?.[0];
                              if(f) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setUploadUrl(ev.target?.result as string);
                                reader.readAsDataURL(f);
                              }
                            }} />
                            {uploadUrl ? (
                              <div className="relative mb-4">
                                <img src={uploadUrl} className="w-full h-40 object-cover rounded-2xl border border-white/10" />
                                <button onClick={() => setUploadUrl("")} className="absolute top-2 right-2 w-8 h-8 bg-black/80 rounded-full flex items-center justify-center border border-white/10 text-xs">✕</button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => fileRef.current?.click()} 
                                className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/5 transition-colors"
                              >
                                <Upload size={20} className="opacity-20" />
                                <span className="text-[10px] uppercase font-black opacity-20">Browse Screenshot</span>
                              </button>
                            )}
                            <button 
                              onClick={() => handleScreenshotSubmit(task)} 
                              disabled={!uploadUrl || submitting === task.id} 
                              className="w-full py-4 bg-[#FFD700] text-black font-black rounded-2xl text-[10px] uppercase shadow-lg disabled:opacity-20"
                            >
                              {submitting === task.id ? "Uploading..." : "Submit for Approval"}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl ${
              toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}