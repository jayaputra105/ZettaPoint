'use client';

import Image from 'next/image';

interface CardGamesProps {
  title: string;
  description: string;
  imageSrc: string;
  className?: string; // Buat handle ukuran asimetris bento grid
  onClick: () => void;
}

export default function CardGames({
  title,
  description,
  imageSrc,
  className = '',
  onClick,
}: CardGamesProps) {
  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-3xl bg-[#1b1926]/60 backdrop-blur-md border border-slate-800/60 cursor-pointer hover:bg-[#222032] hover:border-cyan-500/30 transition-all duration-300 active:scale-95 flex flex-col justify-between overflow-hidden group shadow-xl ${className}`}
    >
      {/* ATAS: GAMBAR LOGO DARI CANVA (MELAYANG DI KANAN) */}
      <div className="w-full flex justify-end mb-4">
        <div className="relative w-20 h-20 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
          />
        </div>
      </div>

      {/* BAWAH: DETAIL KONTEN GAME */}
      <div className="w-full font-mono z-10">
        <h3 className="text-xs font-black tracking-widest text-slate-100 group-hover:text-cyan-400 transition-colors uppercase">
          {title}
        </h3>
        <p className="text-[10px] text-slate-400/80 mt-1 leading-snug line-clamp-2 font-medium">
          {description}
        </p>
      </div>

      {/* EFEK GLOW HALUS PAS KARTU DI-HOVER */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}