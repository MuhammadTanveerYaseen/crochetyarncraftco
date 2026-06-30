import React from 'react';

export default function PromoBar() {
  return (
    <div className="w-full bg-gradient-to-r from-[#A855F7] via-[#C084FC] to-[#A855F7] text-[#FFFDF9] text-center py-2.5 px-4 text-xs font-bold tracking-wider flex items-center justify-center gap-2 select-none shadow-sm relative overflow-hidden">
      <span className="flex items-center gap-2 flex-wrap justify-center">
        <span>🧶 SUMMER SALE IS ON:</span>
        <span className="bg-white text-[#A855F7] px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-normal shadow-sm">UP TO 50% OFF</span>
        <span>GET DIGITAL PATTERNS INSTANTLY & START CROCHETING! 🌸</span>
      </span>
    </div>
  );
}
