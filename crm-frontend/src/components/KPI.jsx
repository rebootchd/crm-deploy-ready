import React from "react";
import "./KPI.css";

/**
 * KPI component supports two variants:
 *  - variant="default"  -> old rectangular KPI card
 *  - variant="neon"     -> circular neon donut KPI (dark/glow)
 *
 * Props:
 *  - variant: "default" | "neon"
 *  - title: string
 *  - value: string (display main number)
 *  - percent: number (0-100) for neon donut
 *  - subtitle: small text under value
 *  - onClick: optional click handler
 */

export default function KPI({ variant = "default", title, value, percent = 0, subtitle, onClick }) {
  if (variant === "neon") {
    // clamp percent 0..100
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    const radius = 44;
    const stroke = 10;
    const c = 2 * Math.PI * radius;
    const dash = (p / 100) * c;

    return (
      <div className="kpi-card neon" onClick={onClick}>
        <div className="neon-inner">
          <div className="neon-left">
            <div className="neon-title">{title}</div>
            <div className="neon-value">{value}</div>
            {subtitle && <div className="neon-sub">{subtitle}</div>}
          </div>

          <div className="neon-chart" aria-hidden>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="ng1" x1="0" x2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="60%" stopColor="#06b6d4" />
                </linearGradient>
                <filter id="gBlur" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* background ring */}
              <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />

              {/* progress ring (gradient stroke) */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="url(#ng1)"
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${dash} ${c - dash}`}
                transform="rotate(-90 60 60)"
                style={{ filter: "url(#gBlur)" }}
              />

              {/* center small inner circle */}
              <circle cx="60" cy="60" r={radius - stroke - 4} fill="rgba(255,255,255,0.02)" />
              {/* percent label */}
              <text x="60" y="66" textAnchor="middle" fontSize="16" fontWeight="700" fill="#ffffff">
                {p}%
              </text>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // default rectangular KPI
  return (
    <div className="kpi-card default" onClick={onClick}>
      <div className="kpi-top">{title}</div>
      <div className="kpi-main">{value}</div>
      {subtitle && <div className="kpi-sub">{subtitle}</div>}
    </div>
  );
}
