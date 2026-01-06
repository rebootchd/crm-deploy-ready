// add near other top-nav links in your header component
import React, { useRef, useState } from 'react';

export default function HeaderImportDropdown({ onStartImport }) {
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const TEMPLATE = "/mnt/data/Multi_Sheet_Import_Template.xlsx";

  function onFileChange(e) {
    const f = e.target.files[0];
    if (f && onStartImport) onStartImport(f);
    setOpen(false); // close dropdown after select
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((s) => !s)}
        style={{
          background: '#0f62ff', color: '#fff', padding: '8px 12px',
          borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer'
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Import ▾
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, marginTop: 8,
            background: '#fff', borderRadius: 10, boxShadow: '0 8px 30px rgba(14,40,80,0.12)',
            padding: 10, minWidth: 220, zIndex: 50
          }}
        >
          <a
            href={TEMPLATE}
            download
            style={{ display: 'block', padding: '8px 10px', borderRadius: 8, color: '#0f172a', textDecoration: 'none', fontWeight:600 }}
          >
            📄 Download Template
          </a>

          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginTop: 8, borderRadius:8, background:'#eef6ff', border:'none', cursor:'pointer', fontWeight:700 }}
          >
            📁 Import File
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.zip"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />

          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Quick import from header. For advanced options go to Import page.
          </div>
        </div>
      )}
    </div>
  );
}
