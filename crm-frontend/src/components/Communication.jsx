import React, { useState } from 'react';
export default function Communication({ notifications, setNotifications }) {
  const [note, setNote] = useState('');
  const add = () => {
    if(!note) return;
    setNotifications(prev => [{ id: Date.now(), text: note, seen:false }, ...prev]);
    setNote('');
  };
  return (
    <div>
      <div className="card">
        <h3>Messages & Notes</h3>
        <div className="form-row">
          <input placeholder="Quick note or message" value={note} onChange={e=>setNote(e.target.value)} />
          <button className="btn" onClick={add}>Post</button>
        </div>

        <ul className="list">
          {notifications.map(n => <li key={n.id} className={n.seen ? 'muted' : ''}>{n.text}</li>)}
        </ul>
      </div>
    </div>
  );
}

