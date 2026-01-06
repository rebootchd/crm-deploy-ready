// ActivityFeed.jsx
import React, { useEffect, useState } from "react";

/**
 * Props:
 *  - leadId (number)
 *  - pollInterval (ms) optional, default 10000
 *
 * Usage:
 *  <ActivityFeed leadId={123} />
 */
export default function ActivityFeed({ leadId, pollInterval = 10000 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

//   const fetchEvents = async () => {
//     try {
//       const qs = new URLSearchParams({
//         entity_type: "lead",
//         entity_id: leadId,
//         ordering: "-created_at",
//       });
//       const res = await fetch(`/crm/events/?${qs.toString()}`);
//       if (!res.ok) throw new Error("Failed to fetch");
//       const data = await res.json();
//       // if using DRF pagination: results array; otherwise data itself
//       const list = Array.isArray(data) ? data : data.results ?? [];
//       setEvents(list);
//     } catch (err) {
//       console.error("ActivityFeed fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };
    useEffect(() => {
      if (!leadId) return;

      const fetchEvents = async () => {
        try {
          const qs = new URLSearchParams({
            entity_type: "lead",
            entity_id: leadId,
            ordering: "-created_at",
          });
          const res = await fetch(`/crm/events/?${qs.toString()}`);
          if (!res.ok) throw new Error("Failed to fetch");
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.results ?? [];
          setEvents(list);
        } catch (err) {
          console.error("ActivityFeed fetch error:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchEvents();
      const t = setInterval(fetchEvents, pollInterval);
      return () => clearInterval(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadId, pollInterval]);


  if (!leadId) return null;

  return (
    <div className="activity-feed" style={{ maxWidth: 700 }}>
      <h4 style={{ marginBottom: 8 }}>Activity</h4>
      {loading && <div>Loading...</div>}
      {!loading && events.length === 0 && <div>No activity yet.</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {events.map((e) => (
          <li key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: 14, marginBottom: 6 }}>
              <strong style={{ textTransform: "capitalize" }}>{e.event_type.replace(/_/g, " ")}</strong>
              <span style={{ color: "#666", marginLeft: 8, fontSize: 12 }}>
                by {e.user_id ? `User ${e.user_id}` : "system"} • {new Date(e.created_at).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#333" }}>
              {renderMetadata(e.metadata)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// small helper to print metadata object neatly
function renderMetadata(meta) {
  if (!meta) return null;
  try {
    if (typeof meta === "string") return meta;
    // pretty: show key: value pairs
    return Object.entries(meta)
      .map(([k, v]) => {
        if (typeof v === "object") v = JSON.stringify(v);
        return (
          <div key={k} style={{ color: "#444" }}>
            <strong>{k}:</strong> <span style={{ color: "#222" }}>{String(v)}</span>
          </div>
        );
      });
  } catch {
    return JSON.stringify(meta);
  }
}
