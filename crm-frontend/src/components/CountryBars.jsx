import React from "react";

const countries = [
  { name: "India North", value: 82 },
  { name: "India South", value: 68 },
  { name: "India West", value: 55 },
  { name: "India East", value: 40 }
];

export default function CountryBars({ onRegionClick = () => {} }) {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {countries.map((c) => (
          <button
            key={c.name}
            onClick={() => onRegionClick(c)}
            className="flex items-center gap-3 w-full"
          >
            <div className="w-28 text-sm text-slate-700 text-left">{c.name}</div>
            <div className="flex-1 bg-slate-200/60 h-3 rounded-full overflow-hidden">
              <div style={{ width: `${c.value}%` }} className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
            </div>
            <div className="w-10 text-right text-sm text-slate-600">{c.value}%</div>
          </button>
        ))}
      </div>
    </div>
  );
}
