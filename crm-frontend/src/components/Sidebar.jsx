import React, { useState } from 'react';
import logo from '../assets/logo.jpg';

export default function Sidebar({
  collapsed: initialCollapsed = false,
  onNavigate,
  onLogout
}) {

  const [collapsed] = useState(false);

  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { key: 'leads', label: 'Leads', icon: '📋' },
    { key: 'clients', label: 'Clients', icon: '👥' },
    { key: 'projects', label: 'Projects / Work', icon: '🧾' },
    { key: 'employees', label: 'Employees', icon: '🧑‍💼' },
    { key: 'reports', label: 'Reports', icon: '📊' },
    { key: 'assign', label: 'Assign', icon: '🔄' },
    { key: 'communication', label: 'Communication', icon: '💬' },
    { key: 'calendar', label: 'Calendar / Tasks', icon: '📅' },
    { key: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{
        width: collapsed ? '80px' : '240px',
        background: 'linear-gradient(145deg, #0F2F6F, #123B8C, #1A4BB5)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 10px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.25s ease',
        minHeight: "100vh",
        height: "auto",

      }}
    >


      {/* Top Logo Section */}
      <div className="sidebar-top"
        style={{
          padding: '14px 0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 10
        }}
      >
        <img
          src={logo}
          alt="Accounts2Arun Logo"
          style={{
            height: "68px",
            width: "68px",
            borderRadius: "8px",
            boxShadow: "0 0 12px rgba(198, 243, 106, 0.7)",
            backgroundColor: "#0b1d2e",
            padding: "1px",
          }}
        />
        {!collapsed && (
          <div style={{ color: '#c6f36a', fontWeight: 750, fontSize: 19 }}>
            Accounts2Arun
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="nav" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px' }}>
        {items.map(it => (
          <button
            key={it.key}
            className="nav-item"
            onClick={() => onNavigate && onNavigate(it)}
            title={it.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span className="nav-icon" style={{ width: 24, textAlign: 'center' }}>{it.icon}</span>
            {!collapsed && <span className="nav-label" style={{ flex: 1 }}>{it.label}</span>}
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />


      {/* Footer */}
      <div className="sidebar-bottom" style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        {!collapsed && (
          <div className="signed" style={{ color: '#fff', marginBottom: 8 }}>
            Signed in as <strong>Admin</strong>
          </div>
        )}

        <button
          className="logout"
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: 'none',
            background: '#1e3a8a',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
