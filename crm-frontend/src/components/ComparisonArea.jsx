import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./comparisonarea.css";

/**
 * ComparisonArea.jsx
 * - layered / stacked soft area chart
 * - props: data (optional), height (optional), onPointClick (optional)
 *
 * Palette matches neon theme.
 */

const defaultData = [
  { month: "Jan", seriesA: 420, seriesB: 300 },
  { month: "Feb", seriesA: 700, seriesB: 520 },
  { month: "Mar", seriesA: 1200, seriesB: 900 },
  { month: "Apr", seriesA: 900, seriesB: 700 },
  { month: "May", seriesA: 1400, seriesB: 1100 },
  { month: "Jun", seriesA: 1500, seriesB: 1250 },
  { month: "Jul", seriesA: 1150, seriesB: 980 },
  { month: "Aug", seriesA: 1250, seriesB: 1040 },
  { month: "Sep", seriesA: 1050, seriesB: 880 },
  { month: "Oct", seriesA: 1300, seriesB: 1100 },
  { month: "Nov", seriesA: 1400, seriesB: 1220 },
  { month: "Dec", seriesA: 1550, seriesB: 1300 },
];

function Tool({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="ca-tooltip">
      <div className="ca-tip-month">{label}</div>
      <div className="ca-tip-val"><span>Series A</span> ₹ {p.seriesA.toLocaleString()}</div>
      <div className="ca-tip-val muted"><span>Series B</span> ₹ {p.seriesB.toLocaleString()}</div>
    </div>
  );
}

export default function ComparisonArea({ data = defaultData, height = 260, onPointClick = () => {} }) {
  const handleClick = (e) => {
    const payload = e && e.activePayload && e.activePayload[0] && e.activePayload[0].payload;
    if (payload) onPointClick(payload);
  };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 8 }} onClick={handleClick}>
          <defs>
            <linearGradient id="caGradA" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.28} />
              <stop offset="60%" stopColor="#7c3aed" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
            </linearGradient>

            <linearGradient id="caGradB" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.22} />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.01} />
            </linearGradient>

            <linearGradient id="caLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#0f172a22" vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9aa3b2", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9aa3b2", fontSize: 12 }} width={64} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
          <Tooltip content={<Tool />} />

          <Area type="monotone" dataKey="seriesB" stroke="#06b6d4" strokeWidth={1.6} fill="url(#caGradB)" activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="seriesA" stroke="url(#caLine)" strokeWidth={2.6} fill="url(#caGradA)" activeDot={{ r: 5 }} />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
