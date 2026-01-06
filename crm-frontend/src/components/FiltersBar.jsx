import React from "react";

export default function FiltersBar({
  region = "India",
  period = "This Month",
  onChange = () => {}
}) {
  const regions = ["India", "USA", "Canada"];

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      {/* Left: Region + Period */}
      <div className="flex items-center gap-3">
        {/* Region selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Region</label>
          <select
            value={region}
            onChange={(e) => onChange({ region: e.target.value })}
            className="px-3 py-2 rounded-lg bg-white/90 border border-slate-200 text-sm"
          >
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Period selector (simple) */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Period</label>
          <select
            value={period}
            onChange={(e) => onChange({ period: e.target.value })}
            className="px-3 py-2 rounded-lg bg-white/90 border border-slate-200 text-sm"
          >
            <option>This Month</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
            <option>Custom</option>
          </select>
        </div>
      </div>

      {/* Right: Quick filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange({ filter: "all" })}
          className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm"
        >
          All
        </button>
        <button
          onClick={() => onChange({ filter: "clients" })}
          className="px-3 py-2 rounded-lg bg-white/90 border border-slate-200 text-sm"
        >
          Clients
        </button>
        <button
          onClick={() => onChange({ filter: "employees" })}
          className="px-3 py-2 rounded-lg bg-white/90 border border-slate-200 text-sm"
        >
          Employees
        </button>
      </div>
    </div>
  );
}
