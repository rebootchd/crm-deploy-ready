import React from "react";
import { FiClock } from "react-icons/fi";
import "./recentActivityDark.css"; // add this css

// Your same activity list (unchanged)
const recentActivity = [
  { id: 1, text: "Invoice paid by Client A", time: "2h ago", type: "invoice", ref: "inv_101" },
  { id: 2, text: "New lead added from Manufacturing", time: "4h ago", type: "lead", ref: "lead_11" },
  { id: 3, text: "Stock updated — Batch No. 12", time: "1d ago", type: "stock", ref: "stk_12" },
  { id: 4, text: "Payment reminder sent to Client X", time: "2d ago", type: "reminder", ref: "rem_5" },
];

export default function RecentActivity({ onItemClick = () => {} }) {
  return (
    <div className="ra-card">
      <div className="ra-title">Recent Activity</div>

      <ul className="ra-list">
        {recentActivity.map((item) => (
          <li key={item.id} className="ra-item">
            <div className="ra-icon">
              <FiClock size={16} />
            </div>

            <button onClick={() => onItemClick(item)} className="ra-btn">
              <div className="ra-text">{item.text}</div>
              <div className="ra-time">{item.time}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
