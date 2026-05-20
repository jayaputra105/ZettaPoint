'use client';

import { useEffect, useRef, useState } from 'react';

// Daftar warna neon cyberpunk buat target
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899']; // Hijau, Biru, Orange, Pink
const COLOR_NAMES = ['GREEN', 'BLUE', 'ORANGE', 'PINK'];

export default function ColorShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State UI Game
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [targetColorIdx, setTargetColorIdx] = useState<number>(0);

  // Ukuran canvas fiks
  const width = 360;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2 - 20;
  const centerRadius = 45; // Ukuran lingkaran tengah
  const orbitRadius = 110; // Jarak putaran laser pointer

  // Refs buat game loop & kalkulasi presisi 60 FPS di HP
  const scoreRef = useRef<number>(0);
  const angleRef = useRef<number>(0); // Sudut putaran laser (dalam radian)
  const speedRef = useRef<number>(0.03); // Kecepatan putar awal
  const curTargetIdxRef = useRef<number>(0);
  const pointerColorIdxRef = useRef<number>(0);
  const timerRef = useRef<number>(100); // Batas waktu tiap sesi (progress bar)

  // Mulai game
  const startGame = () => {
    scoreRef.current = 0;
    angleRef.current = 0;
    speedRef.current = 0.03;
    timerRef.current = 100;

    // Acak warna target tengah dan warna laser pointer awal
    changeColors();

    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  // Fungsi buat ngacak warna target tengah dan warna jarum laser
  const changeColors = () => {
    const nextTargetIdx = Math.floor(Math.random() * COLORS.length);
    curTargetIdxRef.current = nextTargetIdx;
    setTargetColorIdx(nextTargetIdx);

    // Pastikan kadang warna laser sama dengan target, kadang beda biar user mikir/refleks
    // Peluang 40% warna langsung sama, 60% diacak murni
    if (Math.random() < 0.4) {
      pointerColorIdxRef.current = nextTargetIdx;
    } else {
      pointerColorIdxRef.current = Math.floor(Math.random() * COLORS.length);
    }
    
    // Reset timer bar setiap kali warna berubah sukses
    timerRef.current = 100;
  };

  // Main Game Loop (Canvas murni)
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. UPDATE LOGIC PERMAINAN
      // Update sudut putaran pointer laser
      angleRef.current += speedRef.current;
      if (angleRef.current > Math.PI * 2) {
        angleRef.current = 0;
      }

      // Mengurangi timer bar bertahap. Makin tinggi skor, detak timernya makin sadis
      timerRef.current -= 0.15 + (scoreRef.current * 0.01);
      if (timerRef.current <= 0) {
        setGameOver(true); // Kehabisan waktu mikir = mati
        return;
      }

      // 2. RENDERING CANVAS GRAPHICS
      // A. Gambar Orbit Lingkaran Luar (Jalur putar putus-putus)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset garis normal

      // B. Gambar Core/Inti Lingkaran di Tengah (Sesuai warna target)
      ctx.fillStyle = COLORS[curTargetIdxRef.current];
      ctx.shadowColor = COLORS[curTargetIdxRef.current];
      ctx.shadowBlur = 20; // Efek glow neon cyberpunk
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset glow

      // Gambar core dalam (pemanis biar estetik mirip sirkuit komputer)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius - 12, 0, Math.PI * 2);
      ctx.fill();

      // C. Hitung Posisi Koordinat Pointer Laser yang Muter (Garis Trigonometri murni)
      const pointerX = centerX + Math.cos(angleRef.current) * orbitRadius;
      const pointerY = centerY + Math.sin(angleRef.current) * orbitRadius;

      // Gambar Garis Sambungan Laser dari pusat ke pointer luar
      ctx.strokeStyle = COLORS[pointerColorIdxRef.current] + '44'; // Transparan laser line
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(pointerX, pointerY);
      ctx.stroke();

      // Gambar Bola Laser Inti di Ujung Luar Orbit
      ctx.fillStyle = COLORS[pointerColorIdxRef.current];
      ctx.shadowColor = COLORS[pointerColorIdxRef.current];
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(pointerX, pointerY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // D. Gambar Progress Bar Sisa Waktu di Bagian Bawah Canvas
      const barWidth = width - 60;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, height - 40, barWidth, 8);
      
      // Isian progress bar (berubah jadi warna merah kalau kritis)
      ctx.fillStyle = timerRef.current > 35 ? '#10b981' : '#ef4444';
      ctx.fillRect(30, height - 40, barWidth * (timerRef.current / 100), 8);

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted, gameOver]);

  // Handle Eksekusi Tap/Tembak Pas Warna COCOK
  const handleShootTap = () => {
    if (!gameStarted || gameOver) return;

    // Cek apakah warna laser pointer SAAT INI sama dengan warna core tengah
    if (pointerColorIdxRef.current === curTargetIdxRef.current) {
      // BERHASIL! Cocok
      scoreRef.current += 10;
      setScore(scoreRef.current);

      // Naikkan kecepatan putaran biar makin menantang reflex-nya
      speedRef.current += 0.003;

      // Ganti warna acak buat ronde berikutnya
      changeColors();
    } else {
      // SALAH WARNA / MELIRET = LANGSUNG GAGAL (ANTI SPAM TAP)
      setGameOver(true);
    }
  };

  return (
    <div className="w-[360px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl mx-auto font-mono text-slate-200">
      
      {/* STATUS HEADER */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
        <div>
          <div className="text-[10px] text-slate-500 font-bold tracking-widest">CYBER LOCK MATCH</div>
          <div className="text-2xl font-black text-indigo-400">{score} <span className="text-xs text-slate-500">ZP</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-bold tracking-widest">TARGET OVERRIDE</div>
          <div className="text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block" style={{ backgroundColor: COLORS[targetColorIdx] + '22', color: COLORS[targetColorIdx] }}>
            {COLOR_NAMES[targetColorIdx]}
          </div>
        </div>
      </div>

      {/* CORE DISPLAY GAME GRAPHICS */}
      <div className="relative bg-slate-950 flex justify-center items-center h-[500px]">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleShootTap}
          className="cursor-pointer"
        />

        {/* OVERLAY BELUM MAIN */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="text-4xl animate-spin mb-3" style={{ animationDuration: '3s' }}>🎯</div>
            <h2 className="text-lg font-black tracking-widest text-emerald-400">LASER_COLOR_SHOOTER</h2>
            <p className="text-[11px] text-slate-500 max-w-[250px] mt-2 mb-6 leading-relaxed">
              TAP IMMEDIATELY WHEN THE SPINNING LASER NODE COLOR MATCHES THE CORE CIRCLE COLOR IN THE CENTER! MISCLICK WILL TERMINATE LINK.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-xs tracking-widest text-black rounded-xl hover:opacity-90 transition active:scale-95 shadow-md shadow-emerald-500/20"
            >
              INITIALIZE SYNC_
            </button>
          </div>
        )}

        {/* OVERLAY GAME OVER */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="text-rose-500 text-3xl font-black mb-1 tracking-widest">⚠️ SYNC MISALIGNED ⚠️</div>
            <p className="text-[10px] text-slate-500 uppercase mb-6">Laser color mismatch or operation timeout</p>
            
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl w-full max-w-[240px] mb-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Decrypted Core Data</div>
              <div className="text-2xl font-black text-emerald-400">{score} <span className="text-xs text-slate-400">ZP</span></div>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-3 border border-emerald-500 text-emerald-400 font-bold text-xs tracking-widest rounded-xl hover:bg-emerald-500 hover:text-black transition active:scale-95"
            >
              RE-ENGAGE SYNC_
            </button>
          </div>
        )}
      </div>

      {/* CONTROLLER ACTION PAD */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <button
          onClick={handleShootTap}
          disabled={!gameStarted || gameOver}
          className={`w-full py-4 rounded-xl font-black text-sm tracking-widest transition active:scale-98 ${
            !gameStarted || gameOver
              ? 'bg-slate-850 text-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 text-black shadow-lg animate-pulse'
          }`}
        >
          {gameOver ? '🔒 OVERRIDE FAILED' : !gameStarted ? '⌛ LINK OFFLINE' : '🔥 HIT / RE-ALIGN LINK'}
        </button>
      </div>
    </div>
  );
}