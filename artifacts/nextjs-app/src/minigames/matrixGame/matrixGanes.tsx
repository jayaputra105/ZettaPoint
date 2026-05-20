'use client';

import { useEffect, useRef, useState } from 'react';

// Struktur data untuk setiap baris kode yang jatuh
interface CodeTile {
  id: number;
  col: number;      // Kolom 0, 1, 2, atau 3
  y: number;        // Posisi Y di canvas
  text: string;     // Teks biner acak (misal: "0110", "1001")
  isHit: boolean;   // Apakah sudah berhasil di-tap
}

export default function MatrixHackGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State UI Game
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);

  // Ukuran Canvas Tetap (Pas buat layar HP/Telegram Bot)
  const width = 360;
  const height = 500;
  const columns = 4; // 4 Kolom mirip Piano Tiles
  const colWidth = width / columns;
  const tileHeight = 80; // Tinggi ubin kode

  // Refs untuk menampung data game loop agar tidak delay karena re-render React
  const tilesRef = useRef<CodeTile[]>([]);
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const speedRef = useRef<number>(2.5); // Kecepatan awal jatuh ubin
  const nextIdRef = useRef<number>(0);

  // Fungsi untuk memulai ulang game
  const startGame = () => {
    tilesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    speedRef.current = 2.5;
    nextIdRef.current = 0;
    
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameStarted(true);

    // Spawn ubin pertama
    spawnTile();
  };

  // Fungsi spawn ubin baru di kolom acak di bagian atas luar layar
  const spawnTile = () => {
    const randomCol = Math.floor(Math.random() * columns);
    // Bikin teks binary acak sepanjang 4 digit
    const randomBinary = Math.random().toString(2).substring(2, 6);
    
    const newTile: CodeTile = {
      id: nextIdRef.current++,
      col: randomCol,
      y: -tileHeight,
      text: randomBinary,
      isHit: false
    };
    
    tilesRef.current.push(newTile);
  };

  // Main Game Loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let spawnTimer = 0;

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Gambar Garis Pembatas Kolom (Vibe Matrix Terminal)
      ctx.strokeStyle = '#042f1a';
      ctx.lineWidth = 1;
      for (let i = 1; i < columns; i++) {
        ctx.beginPath();
        ctx.moveTo(i * colWidth, 0);
        ctx.lineTo(i * colWidth, height);
        ctx.stroke();
      }

      // 2. Gambar Garis Hit Zone / Firewall Gate di bagian bawah
      const hitZoneY = height - 100;
      ctx.strokeStyle = '#10b981'; // Hijau Emerald Neon
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]); // Garis putus-putus biar futuristik
      ctx.beginPath();
      ctx.moveTo(0, hitZoneY);
      ctx.lineTo(width, hitZoneY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset garis lurus lagi

      // Teks penanda Firewall Gate
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('⚡ FIREWALL GATE ⚡', 10, hitZoneY - 6);

      // 3. Update & Gambar Ubin Kode yang Jatuh
      const currentTiles = tilesRef.current;
      for (let i = currentTiles.length - 1; i >= 0; i--) {
        const tile = currentTiles[i];
        
        // Jalankan ubin ke bawah
        tile.y += speedRef.current;

        // Gambar Ubin Kotak Kode
        if (tile.isHit) {
          // Kalau udah di-tap, warnanya pudar kelap-kelip sukses
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(tile.col * colWidth + 4, tile.y, colWidth - 8, tileHeight);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('BYPASSED', tile.col * colWidth + colWidth / 2, tile.y + tileHeight / 2 + 5);
        } else {
          // Ubin aktif yang wajib di-tap (Warna hacker hitam gelap border neon hijau)
          ctx.fillStyle = '#022c22';
          ctx.fillRect(tile.col * colWidth + 4, tile.y, colWidth - 8, tileHeight);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(tile.col * colWidth + 4, tile.y, colWidth - 8, tileHeight);

          // Gambar baris kode biner di dalam ubin
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(tile.text, tile.col * colWidth + colWidth / 2, tile.y + tileHeight / 2 + 6);
        }

        // Konsekuensi 1: Kalau ubin lolos sampai bawah layar dan belum di-tap
        if (tile.y > height && !tile.isHit) {
          currentTiles.splice(i, 1); // Hapus dari memori
          livesRef.current -= 1;
          setLives(livesRef.current);
          
          // Cek mati
          if (livesRef.current <= 0) {
            setGameOver(true);
          }
        } 
        // Hapus ubin aman yang sudah di-tap kalau sudah lewat bawah layar
        else if (tile.y > height && tile.isHit) {
          currentTiles.splice(i, 1);
        }
      }

      // 4. Atur Interval Spawn Ubin Baru berdasarkan tingkat skor/kecepatan
      spawnTimer += speedRef.current;
      const spawnInterval = Math.max(120, 220 - scoreRef.current * 2); // Makin tinggi skor, makin rapat jarak antar ubin
      if (spawnTimer >= spawnInterval) {
        spawnTile();
        spawnTimer = 0;
      }

      // Looping animasi
      if (livesRef.current > 0) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted, gameOver]);

  // Handle Klik/Tap Layar Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Cari kolom mana yang di-tap
    const targetCol = Math.floor(clickX / colWidth);

    // Cari ubin paling bawah di kolom tersebut yang belum di-hit
    let hitSuccess = false;

    // Looping dari ubin paling bawah/tua
    for (let i = 0; i < tilesRef.current.length; i++) {
      const tile = tilesRef.current[i];
      
      if (tile.col === targetCol && !tile.isHit) {
        // Toleransi area tap (Mirip Piano tiles, ubin harus berada di sekitar Firewall gate / layar bawah)
        // Kita set agar ubin bisa di-tap jika bagian bawahnya sudah melewati Y > 100
        if (tile.y + tileHeight > 80 && tile.y < height) {
          tile.isHit = true;
          hitSuccess = true;
          
          // Update Skor & Kesulitan
          scoreRef.current += 10;
          setScore(scoreRef.current);

          // Tiap naik 50 poin, speed jatuh makin ngebut sedikit biar makin tegang
          if (scoreRef.current % 50 === 0) {
            speedRef.current += 0.4;
          }
          break;
        }
      }
    }

    // Konsekuensi 2: Kalau asal tap kolom kosong (Meleset) -> Kurangi Nyawa
    if (!hitSuccess) {
      livesRef.current -= 1;
      setLives(livesRef.current);
      if (livesRef.current <= 0) {
        setGameOver(true);
      }
    }
  };

  return (
    <div className="w-[360px] bg-black rounded-2xl border border-emerald-900/60 flex flex-col overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)] mx-auto font-mono text-emerald-400">
      
      {/* STATUS HEADER COMPONENT */}
      <div className="p-4 bg-slate-950/90 border-b border-emerald-950 flex justify-between items-center text-sm">
        <div>
          <div className="text-[10px] text-emerald-600 font-bold tracking-widest">ENCRYPTION BYPASS</div>
          <div className="text-xl font-black text-emerald-400">{score} <span className="text-xs text-emerald-600">ZP</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-emerald-600 font-bold tracking-widest">CONNECTION LIVES</div>
          <div className="text-base font-bold flex gap-1 justify-end mt-0.5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <span key={idx} className={idx < lives ? "text-emerald-400" : "text-emerald-950"}>
                ⚡
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CORE DISPLAY GAME SCREEN */}
      <div className="relative bg-black flex justify-center items-center h-[500px]">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleCanvasClick}
          className="cursor-pointer"
        />

        {/* OVERLAY SCREEN: BELUM MAIN */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="text-4xl animate-pulse mb-2">💾</div>
            <h2 className="text-lg font-black tracking-widest text-emerald-400">MATRIX_CYBER_FALL</h2>
            <p className="text-[11px] text-emerald-600 max-w-[240px] mt-2 mb-6 leading-relaxed">
              TAP THE FALLING BINARY CODES BEFORE THEY PENETRATE THE FIREWALL GATE. DON'T MISS!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 border border-emerald-500 bg-emerald-950/30 font-bold text-xs tracking-widest rounded-xl hover:bg-emerald-500 hover:text-black transition active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              RUN INFILTRATION_
            </button>
          </div>
        )}

        {/* OVERLAY SCREEN: GAME OVER */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-10 animate-fadeIn">
            <div className="text-rose-500 text-3xl font-black mb-1 tracking-wider">⚠️ CONNECTION TERMINATED ⚠️</div>
            <div className="text-xs text-rose-700 font-bold uppercase mb-6">[FIREWALL BREACH DETECTED]</div>
            
            <div className="bg-slate-950 border border-rose-950 p-4 rounded-xl w-full max-w-[260px] mb-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Total Reward</div>
              <div className="text-2xl font-black text-rose-400">{score} <span className="text-xs text-slate-400">ZP</span></div>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-3 border border-rose-500 bg-rose-950/20 text-rose-400 font-bold text-xs tracking-widest rounded-xl hover:bg-rose-500 hover:text-black transition active:scale-95"
            >
              REBOOT LINK_
            </button>
          </div>
        )}
      </div>

      {/* FOOTER TERMINAL EFFECT */}
      <div className="p-2 bg-slate-950/50 border-t border-emerald-950/40 text-center text-[9px] text-emerald-700 tracking-wider">
        STATUS: {gameStarted && !gameOver ? 'INFILTRATING SECURE SERVER...' : 'SYSTEM_IDLE'}
      </div>
    </div>
  );
}