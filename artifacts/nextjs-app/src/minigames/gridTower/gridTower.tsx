'use client';

import { useEffect, useRef, useState } from 'react';

// Struktur data untuk setiap lapis balok di tower
interface TowerBlock {
  y: number;         // Posisi Y di canvas
  x: number;         // Posisi X saat ini
  width: number;     // Lebar balok (makin ke atas bisa makin kepotong)
  color: string;     // Warna balok (berubah gradual biar estetik)
}

export default function GridTowerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State UI Game
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Ukuran area canvas tetap (fiks buat layar HP)
  const width = 360;
  const height = 500;
  const blockHeight = 35; // Tinggi tiap balok

  // Refs buat game loop biar sinkron dan responsif pas di-tap di HP
  const blocksRef = useRef<TowerBlock[]>([]);
  const currentBlockRef = useRef<TowerBlock | null>(null);
  const directionRef = useRef<number>(1); // 1 = Kanan, -1 = Kiri
  const speedRef = useRef<number>(3);    // Kecepatan geser awal
  const scoreRef = useRef<number>(0);
  const cameraYRef = useRef<number>(0);   // Untuk efek kamera scroll ke atas otomatis

  // Fungsi buat generate warna gradual ala cyberpunk/neon
  const getGradientColor = (index: number) => {
    const hue = (index * 15) % 360;
    return `hsl(${hue}, 85%, 55%)`;
  };

  // Mulai game dari awal
  const startGame = () => {
    scoreRef.current = 0;
    speedRef.current = 3;
    directionRef.current = 1;
    cameraYRef.current = 0;

    // Balok dasar paling bawah (landasan statis, gak gerak)
    const baseBlock: TowerBlock = {
      y: height - blockHeight,
      x: (width - 160) / 2,
      width: 160,
      color: '#1e293b'
    };

    blocksRef.current = [baseBlock];

    // Spawn balok pertama yang bakal gerak bolak-balik
    spawnNextBlock(baseBlock.width, baseBlock.y - blockHeight);

    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  // Spawn balok baru di atas balok sebelumnya
  const spawnNextBlock = (currentWidth: number, targetY: number) => {
    currentBlockRef.current = {
      y: targetY,
      x: directionRef.current === 1 ? -currentWidth : width, // Start dari luar layar kiri/kanan acak
      width: currentWidth,
      color: getGradientColor(scoreRef.current + 1)
    };
  };

  // Main Game Loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Efek kamera smooth scroll ke atas kalau tower udah tinggi melebihi setengah layar
      ctx.translate(0, cameraYRef.current);

      // 1. Gambar Semua Balok yang Udah Ditumpuk Sukses
      blocksRef.current.forEach((block) => {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, blockHeight);
        
        // Kasih border halus biar keliatan tumpukannya
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(block.x, block.y, block.width, blockHeight);
      });

      // 2. Update & Gambar Balok yang Lagi Gerak Aktif
      const curBlock = currentBlockRef.current;
      if (curBlock) {
        // Gerakin koordinat X balok bolak-balik
        curBlock.x += directionRef.current * speedRef.current;

        // Nabrak dinding kanan/kiri balik arah
        if (curBlock.x + curBlock.width > width) {
          directionRef.current = -1;
        } else if (curBlock.x < 0) {
          directionRef.current = 1;
        }

        ctx.fillStyle = curBlock.color;
        ctx.fillRect(curBlock.x, curBlock.y, curBlock.width, blockHeight);
        
        // Border neon efek buat balok jalan
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(curBlock.x, curBlock.y, curBlock.width, blockHeight);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted, gameOver]);

  // Handle Action Pas Layar Di-Tap / Klik
  const handleActionTap = () => {
    if (!gameStarted || gameOver) return;

    const curBlock = currentBlockRef.current;
    const stackedBlocks = blocksRef.current;
    const prevBlock = stackedBlocks[stackedBlocks.length - 1];

    if (!curBlock || !prevBlock) return;

    // Hitung sisa toleransi jarak meleset (kiri/kanan)
    const leftOverLeft = curBlock.x - prevBlock.x;
    
    let newX = curBlock.x;
    let newWidth = curBlock.width;

    // LOGIC POTONG BALOK (Math murni)
    if (curBlock.x < prevBlock.x) {
      // Meleset di sebelah kiri
      const overlap = curBlock.x + curBlock.width - prevBlock.x;
      if (overlap <= 0) {
        setGameOver(true); // Gak kena sama sekali alias jatuh bebas
        return;
      }
      newX = prevBlock.x;
      newWidth = overlap;
    } else if (curBlock.x > prevBlock.x) {
      // Meleset di sebelah kanan
      const overlap = prevBlock.x + prevBlock.width - curBlock.x;
      if (overlap <= 0) {
        setGameOver(true); // Gak kena sama sekali
        return;
      }
      newWidth = overlap;
    }

    // Tumpukan sukses, masukkan balok yang udah kepotong ke array menara
    const fixedBlock: TowerBlock = {
      y: curBlock.y,
      x: newX,
      width: newWidth,
      color: curBlock.color
    };

    stackedBlocks.push(fixedBlock);
    scoreRef.current += 1;
    setScore(scoreRef.current);

    // Naikin speed bertahap biar makin susah pas makin tinggi
    if (scoreRef.current % 3 === 0) {
      speedRef.current += 0.5;
    }

    // Atur pergerakan kamera otomatis ke atas
    const towerTopY = curBlock.y + cameraYRef.current;
    if (towerTopY < height / 2) {
      cameraYRef.current += blockHeight;
    }

    // Spawn balok layer berikutnya di atasnya lagi
    spawnNextBlock(newWidth, curBlock.y - blockHeight);
  };

  return (
    <div className="w-[360px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl mx-auto font-mono text-slate-200">
      
      {/* HEADER SCORE */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
        <div>
          <div className="text-[10px] text-slate-500 font-bold tracking-widest">TOWER STACK</div>
          <div className="text-2xl font-black text-indigo-400">{score} <span className="text-xs text-slate-500">FLOORS</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-bold tracking-widest">CURRENT WIDTH</div>
          <div className="text-sm font-bold text-emerald-400">
            {currentBlockRef.current ? Math.floor(currentBlockRef.current.width) : 0} px
          </div>
        </div>
      </div>

      {/* CORE CANVAS VIEW */}
      <div className="relative bg-slate-950 flex justify-center items-center h-[500px]">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleActionTap}
          className="cursor-pointer bg-gradient-to-b from-slate-950 to-slate-900"
        />

        {/* TAP AREA OVERLAY JIKA BELUM START */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="text-4xl animate-bounce mb-3">🏗️</div>
            <h2 className="text-lg font-black tracking-widest text-indigo-400">NEON_TOWER_STACK</h2>
            <p className="text-[11px] text-slate-500 max-w-[240px] mt-2 mb-6 leading-relaxed">
              TAP EXACTLY WHEN THE MOVING BLOCK IS ALIGNED WITH THE ONE BELOW IT. MISSED PARTS WILL BE CUT OFF!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-indigo-600 font-bold text-xs tracking-widest text-white rounded-xl hover:bg-indigo-500 transition active:scale-95 shadow-lg shadow-indigo-600/30"
            >
              START CONSTRUCTION_
            </button>
          </div>
        )}

        {/* OVERLAY SCREEN: GAME OVER */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="text-rose-500 text-3xl font-black mb-1 tracking-widest">⚠️ TOWER COLLAPSED ⚠️</div>
            <p className="text-[10px] text-slate-500 uppercase mb-6">Block placement missed the alignment</p>
            
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl w-full max-w-[240px] mb-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Final Height</div>
              <div className="text-2xl font-black text-indigo-400">{score} <span className="text-xs text-slate-400">Floors</span></div>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-3 border border-indigo-500 text-indigo-400 font-bold text-xs tracking-widest rounded-xl hover:bg-indigo-500 hover:text-white transition active:scale-95"
            >
              REBUILD TOWER_
            </button>
          </div>
        )}
      </div>

      {/* ACTION HIT BUTTON ALTERNATIVE FOR MOBILE */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <button
          onClick={handleActionTap}
          disabled={!gameStarted || gameOver}
          className={`w-full py-3.5 rounded-xl font-black text-xs tracking-widest transition active:scale-98 ${
            !gameStarted || gameOver
              ? 'bg-slate-850 text-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
          }`}
        >
          {gameOver ? '❌ COLLAPSED' : !gameStarted ? '⌛ WAITING...' : '⚡ PLACE BLOCK NOW'}
        </button>
      </div>
    </div>
  );
}