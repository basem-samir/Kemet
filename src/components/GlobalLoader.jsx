import React from 'react';

export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-navy-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Decorative Egyptian sun rays in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 flex justify-center items-center">
        <div className="w-[150vw] h-[150vw] border-[5vw] border-dashed border-gold-500 rounded-full animate-[spin_40s_linear_infinite]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Pyramid Loading Animation */}
        <div className="relative w-32 h-32 flex justify-center items-end mb-8">
          {/* Back face / shadow */}
          <div className="absolute border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[70px] border-b-gold-700 opacity-60 ml-4 animate-pulse"></div>
          
          {/* Front face */}
          <div className="absolute border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[70px] border-b-gold-500"></div>
          
          {/* Glowing Sun above Pyramid */}
          <div className="absolute top-2 w-8 h-8 bg-gold-300 rounded-full animate-bounce shadow-[0_0_40px_15px_rgba(252,211,77,0.5)]"></div>
        </div>

        <h1 className="text-3xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 tracking-[0.2em] uppercase mb-4 drop-shadow-sm">
          Kemet
        </h1>
        
        {/* Loading Dots */}
        <div className="flex space-x-3 mt-2">
          <div className="w-2 h-2 bg-gold-500 rounded-sm rotate-45 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gold-500 rounded-sm rotate-45 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gold-500 rounded-sm rotate-45 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
