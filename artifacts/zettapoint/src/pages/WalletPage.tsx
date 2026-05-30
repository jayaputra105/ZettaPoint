import { useState, lazy, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppProvider";
import { Wallet, ArrowUpRight, History, Coins, Zap, CheckCircle, XCircle, Link } from "lucide-react";

const ShootingStars = lazy(() => import("@/components/ShootingStars"));

const WITHDRAW_METHODS = [
  { id: "TON", label: "TON NETWORK", placeholder: "EQ... or UQ... (48 chars)" },
  { id: "TRC20", label: "USDT TRC20", placeholder: "T... (34 chars)" },
];

const MIN_WD_AMOUNT = 30;

function validateTONAddress(addr: string): boolean {
  return /^[EeUu][Qq][A-Za-z0-9_\-]{46}$/.test(addr.trim());
}

function validateTRC20Address(addr: string): boolean {
  return /^T[A-Za-z1-9]{33}$/.test(addr.trim());
}

function validateAddress(method: string, addr: string): { valid: boolean; message: string } {
  if (!addr.trim()) return { valid: false, message: "" };
  if (method === "TON") {
    return validateTONAddress(addr)
      ? { valid: true, message: "Valid TON address" }
      : { valid: false, message: "Must start with EQ or UQ, 48 characters total" };
  }
  if (method === "TRC20") {
    return validateTRC20Address(addr)
      ? { valid: true, message: "Valid TRC20 address" }
      : { valid: false, message: "Must start with T, 34 characters total" };
  }
  return { valid: false, message: "" };
}

export default function WalletPage() {
  const { coins, usdtBalance, zp, telegramId, tonWalletAddress, setTonWalletAddress } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);

  const totalZp = Object.values(zp).reduce((a, b) => a + b, 0);

  const addressValidation = method && address ? validateAddress(method, address) : null;

  const getTelegramId = () => {
    if (telegramId) return telegramId;
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user?.id?.toString() || null;
  };

  useEffect(() => {
    const tid = getTelegramId();
    if (!tid) return;
    fetch(`/api/wallet?telegramId=${tid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.transactions) setTransactions(data.transactions);
      })
      .catch(() => {});
  }, [telegramId]);

  const validateAmount = (val: string) => {
    const num = parseFloat(val);
    if (!val) { setAmountError(""); return; }
    if (isNaN(num)) { setAmountError("Enter a valid number"); return; }
    if (num < MIN_WD_AMOUNT) { setAmountError(`Minimum is $${MIN_WD_AMOUNT}`); return; }
    if (num > usdtBalance) { setAmountError("Insufficient balance"); return; }
    setAmountError("");
  };

  const handleConnectWallet = async () => {
    const newAddr = prompt("Enter your TON wallet address (EQ... or UQ...)");
    if (!newAddr) return;
    if (!validateTONAddress(newAddr)) {
      alert("Invalid TON address. Must start with EQ or UQ, 48 characters.");
      return;
    }
    const tid = getTelegramId();
    if (!tid) return;
    try {
      const res = await fetch("/api/user/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: tid, tonWalletAddress: newAddr }),
      });
      if (res.ok) {
        setTonWalletAddress(newAddr);
        alert("TON wallet connected successfully!");
      } else {
        alert("Failed to save wallet address.");
      }
    } catch {
      alert("Connection error.");
    }
  };

  const handleProcessWithdraw = async () => {
    const val = parseFloat(amount);
    const tid = getTelegramId();
    if (!tid) return;

    if (!amount || isNaN(val)) return;
    if (val < MIN_WD_AMOUNT || val > usdtBalance) return;
    if (!address) { alert("Please enter your wallet address"); return; }
    if (addressValidation && !addressValidation.valid) {
      alert(addressValidation.message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: tid, method, amount: val, walletAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Withdrawal request submitted! It will be reviewed within 24h.");
      setIsModalOpen(false);
      setAmount("");
      setAddress("");
      setMethod(null);
      fetch(`/api/wallet?telegramId=${tid}`)
        .then((r) => r.json())
        .then((d) => { if (d.transactions) setTransactions(d.transactions); });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white flex flex-col overflow-hidden">
      <Suspense fallback={null}><ShootingStars /></Suspense>

      <div className="relative z-10 flex-1 max-w-md mx-auto w-full px-6 pt-8 pb-32">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-yellow-500 uppercase">Wallet</h1>
            <p className="text-[10px] opacity-30 uppercase tracking-[0.4em] font-bold">Assets & Earnings</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <Wallet className="text-yellow-500" size={20} />
          </div>
        </header>

        {/* TON WALLET CONNECT */}
        <div
          onClick={handleConnectWallet}
          className={`mb-4 p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all active:scale-95 ${
            tonWalletAddress
              ? "bg-green-500/5 border-green-500/20"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <Link size={18} className={tonWalletAddress ? "text-green-400" : "text-white/30"} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">TON Wallet</p>
            <p className={`text-xs font-bold truncate ${tonWalletAddress ? "text-green-400" : "text-white/20"}`}>
              {tonWalletAddress
                ? `${tonWalletAddress.slice(0, 8)}...${tonWalletAddress.slice(-6)}`
                : "Tap to connect TON wallet"}
            </p>
          </div>
          {tonWalletAddress && <CheckCircle size={16} className="text-green-400 shrink-0" />}
        </div>

        {/* USDT CARD */}
        <div className="relative overflow-hidden p-8 rounded-[40px] bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-white/10 shadow-2xl mb-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest text-white">Available USDT</p>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold text-green-500 uppercase">Withdrawal Active</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-10">
            <span className="text-2xl font-black text-white/30">$</span>
            <h2 className="text-6xl font-black tracking-tighter text-white tabular-nums">{usdtBalance.toFixed(2)}</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group w-full py-5 bg-yellow-500 text-black font-black rounded-2xl text-xs uppercase shadow-[0_10px_30px_rgba(234,179,8,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Request Withdrawal
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-zinc-900/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2 opacity-30">
              <Coins size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Total Coins</p>
            </div>
            <p className="text-xl font-black tracking-tight text-white">{coins.toLocaleString()}</p>
          </div>
          <div className="p-5 rounded-3xl bg-zinc-900/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2 opacity-30">
              <Zap size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Total Points</p>
            </div>
            <p className="text-xl font-black tracking-tight text-white">{totalZp.toLocaleString()}</p>
          </div>
        </div>

        {/* HISTORY */}
        <section>
          <div className="flex items-center gap-2 mb-6 px-2 opacity-20">
            <History size={14} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Recent Activity</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
              <p className="text-[11px] font-bold opacity-10 uppercase tracking-widest text-white">No history yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black capitalize">{tx.type}</p>
                    <p className="text-[9px] opacity-30 uppercase">{tx.method} · {new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-yellow-500">-${tx.amount}</p>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      tx.status === "completed" ? "bg-green-500/10 text-green-400" :
                      tx.status === "rejected" ? "bg-red-500/10 text-red-400" :
                      "bg-amber-500/10 text-amber-400"
                    }`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-zinc-900 rounded-t-[50px] p-10 border-t border-white/10 pb-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
              <h3 className="text-2xl font-black text-yellow-500 italic mb-2 uppercase">Payout USDT</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest mb-10">
                Min withdrawal: <span className="text-white font-black">${MIN_WD_AMOUNT}</span>
              </p>

              <div className="flex gap-3 mb-6">
                {WITHDRAW_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setMethod(m.id); setAddress(""); }}
                    className={`flex-1 py-4 rounded-2xl border text-[10px] font-black tracking-tighter transition-all ${
                      method === m.id
                        ? "bg-yellow-500 text-black border-yellow-500"
                        : "bg-white/5 border-white/5 text-white/30"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {method && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                  {/* AMOUNT */}
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); validateAmount(e.target.value); }}
                      className={`w-full p-5 rounded-2xl bg-black border text-white font-bold outline-none transition-colors ${
                        amountError ? "border-red-500/60" : "border-white/10 focus:border-yellow-500"
                      }`}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-yellow-500">USDT</span>
                  </div>
                  {amountError && (
                    <p className="text-[10px] text-red-400 font-bold -mt-2 px-1 flex items-center gap-1">
                      <XCircle size={12} /> {amountError}
                    </p>
                  )}

                  {/* ADDRESS */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={WITHDRAW_METHODS.find((x) => x.id === method)?.placeholder}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`w-full p-5 rounded-2xl bg-black border text-white text-xs outline-none transition-colors ${
                        address && addressValidation
                          ? addressValidation.valid
                            ? "border-green-500/60"
                            : "border-red-500/60"
                          : "border-white/10 focus:border-yellow-500"
                      }`}
                    />
                    {address && addressValidation && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {addressValidation.valid
                          ? <CheckCircle size={16} className="text-green-400" />
                          : <XCircle size={16} className="text-red-400" />}
                      </div>
                    )}
                  </div>
                  {address && addressValidation && (
                    <p className={`text-[10px] font-bold -mt-2 px-1 flex items-center gap-1 ${
                      addressValidation.valid ? "text-green-400" : "text-red-400"
                    }`}>
                      {addressValidation.valid
                        ? <><CheckCircle size={12} /> {addressValidation.message}</>
                        : <><XCircle size={12} /> {addressValidation.message}</>}
                    </p>
                  )}

                  <button
                    onClick={handleProcessWithdraw}
                    disabled={submitting || !!amountError || (!!address && !!addressValidation && !addressValidation.valid)}
                    className="w-full py-5 bg-yellow-500 text-black font-black rounded-3xl uppercase text-xs tracking-widest mt-4 shadow-xl disabled:opacity-30 transition-all"
                  >
                    {submitting ? "Processing..." : "Confirm Payout"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
