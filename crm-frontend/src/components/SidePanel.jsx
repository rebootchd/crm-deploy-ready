import React from "react";

export default function SidePanel({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/30 backdrop-blur-sm">

      {/* RIGHT DRAWER */}
      <div
        className="w-full sm:w-[360px] md:w-[420px] h-full bg-white shadow-2xl
                   p-6 overflow-y-auto transform transition-all duration-300"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>

          <button
            className="text-slate-500 hover:text-red-500 text-xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="pb-10">{children}</div>
      </div>
    </div>
  );
}
