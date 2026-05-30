import { useState } from "react";

export default function ArcadePortal({ url, onClose }: { url: string; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0d0b14]/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Container Utama dengan Border Neon (bordergame.jpg) */}
      <div className="w-full max-w-md h-[80vh] relative p-1 rounded-3xl overflow-hidden 
                      bg-[url('/images/bordergame.jpg')] bg-cover bg-center 
                      shadow-[0_0_40px_rgba(212,175,55,0.2)]">
        
        {/* Inner Container untuk Iframe */}
        <div className="w-full h-full rounded-[20px] bg-[#0d0b14] overflow-hidden relative flex flex-col">
          
          {/* Header Portal (Setinggi h-12) */}
          <div className="h-12 flex items-center justify-between px-4 bg-[#1a0b2e]/80 border-b border-[#D4AF37]/30 flex-shrink-0">
            <span className="text-[10px] font-black text-[#D4AF37] tracking-widest uppercase">Cosmic Active</span>
            <button 
              onClick={onClose} 
              className="px-3 py-1 bg-[url('/images/mainmenu.jpg')] bg-cover rounded-lg text-[9px] font-black text-white uppercase border border-[#D4AF37] active:scale-95 transition-transform"
            >
              Close
            </button>
          </div>

          {/* Area Konten Game (Mengambil sisa ruang tinggi yang tersedia) */}
          <div className="flex-1 w-full relative bg-black">
            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#D4AF37] bg-[#0d0b14] z-10">
                <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[9px] font-bold tracking-widest uppercase">Connecting to Galaxy...</p>
              </div>
            )}

            <iframe 
              src={url} 
              className={`w-full h-full border-none ${isLoading ? 'hidden' : 'block'}`}
              onLoad={() => setIsLoading(false)}
              // Membuka fitur esensial game seperti audio, fullscreen, dan penyimpanan data local storage
              allow="autoplay; fullscreen; gamepad; write-cookie"
              // Ditambahkan allow-downloads agar aset game yang di-compress bisa terunduh sempurna ke memori internal Telegram
              sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-downloads"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
