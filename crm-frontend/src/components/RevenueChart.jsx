// src/components/RevenueChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

/**
 * Soft thin gradient bars (minimal, elegant)
 * Props:
 *  - data: optional array [{month, revenue}, ...]
 *  - height: optional number (default 320)
 *  - onBarClick: function(payload) => called when user clicks a bar
 */

const defaultData = [
  { month: "Jan", revenue: 420 },
  { month: "Feb", revenue: 700 },
  { month: "Mar", revenue: 1200 },
  { month: "Apr", revenue: 900 },
  { month: "May", revenue: 1400 },
  { month: "Jun", revenue: 1500 },
  { month: "Jul", revenue: 1150 },
  { month: "Aug", revenue: 1250 },
  { month: "Sep", revenue: 1050 },
  { month: "Oct", revenue: 1300 },
  { month: "Nov", revenue: 1400 },
  { month: "Dec", revenue: 1550 },
];

function SoftTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "rgba(255,255,255,0.96)",
      padding: 10,
      borderRadius: 10,
      boxShadow: "0 8px 20px rgba(16,24,40,0.08)",
      border: "1px solid rgba(15,23,42,0.04)",
      fontSize: 13,
      color: "#0f172a",
      minWidth: 120,
      textAlign: "center"
    }}>
      <div style={{ fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 6, color: "#6b21a8", fontWeight: 700 }}>
        ₹ {Number(d.revenue).toLocaleString()}
      </div>
    </div>
  );
}

export default function RevenueChart({ data = defaultData, height = 320, onBarClick = () => {} }) {
  const gradId = "thinBarGrad_v1";

  const handleClick = (e) => {
    const payload = e && e.activePayload && e.activePayload[0] && e.activePayload[0].payload;
    if (payload) onBarClick(payload);
  };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 10, left: 0, bottom: 6 }}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.98} />
              <stop offset="65%" stopColor="#7c3aed" stopOpacity={0.66} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.12} />
            </linearGradient>

            <filter id="softGlow" x="-20%" y="-50%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} padding={{ left: 8, right: 8 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={56} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
          <Tooltip content={<SoftTooltip />} />

          {/* thin rounded bars */}
          <Bar dataKey="revenue" fill={`url(#${gradId})`} radius={[10, 10, 6, 6]} barSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#${gradId})`}
                style={{ filter: index === data.length - 1 ? "url(#softGlow)" : "none" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
