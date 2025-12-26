"use client";

const Header = () => {
  return (
    <header className="col-span-12 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gg-accent flex items-center justify-center text-white font-bold">
          G
        </div>
        <h1 className="text-xl font-semibold tracking-wide">GEMINI GUARDIAN</h1>
        <span className="ml-3 text-xs text-gg-muted">
          HYBRID AI ARCHITECTURE · REASONING CORE: FLASH 3.0
        </span>
      </div>
      <button className="rounded px-4 py-2 bg-red-600 text-white text-sm font-medium">
        ALERT EMS
      </button>
    </header>
  );
};

export default Header;
