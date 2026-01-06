// import React, { useState } from 'react';
// import axios from 'axios';
//
// const LeadForm = ({ onLeadAdded }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     source: '',
//     qualified: false,
//     assigned_to: ''
//   });
//
//   const handleChange = (e) => {
//     const { name, value, type } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'radio' ? value === 'Yes' : value
//     }));
//   };
//
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     axios.post('http://127.0.0.1:8000/api/leads/', formData)
//       .then(response => {
//         onLeadAdded(response.data);
//         setFormData({
//           name: '',
//           email: '',
//           phone: '',
//           source: '',
//           qualified: false,
//           assigned_to: ''
//         });
//       })
//       .catch(error => console.error('Error adding lead:', error));
//   };
//
//   return (
//     <form onSubmit={handleSubmit}>
//       <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} />
//       <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
//       <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
//       <input name="source" placeholder="Source" value={formData.source} onChange={handleChange} />
//       <div>
//         Qualified:
//         <label><input type="radio" name="qualified" value="Yes" checked={formData.qualified === true} onChange={handleChange} /> Yes</label>
//         <label><input type="radio" name="qualified" value="No" checked={formData.qualified === false} onChange={handleChange} /> No</label>
//       </div>
//       <select name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
//         <option value="">Unassigned</option>
//         <option value="Amit">Amit</option>
//         <option value="Sarvesh">Sarvesh</option>
//         <option value="Arun">Arun</option>
//       </select>
//       <button type="submit">Add Lead</button>
//     </form>
//   );
// };
//
// export default LeadForm;








import React, { useState } from 'react';

function LeadForm({ onLeadAdded }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !company) return;

    const newLead = { id: Date.now(), name, email, company };
    onLeadAdded(newLead);

    // Clear form
    setName('');
    setEmail('');
    setCompany('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Add New Lead</h2>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Lead
      </button>
    </form>
  );
}

export default LeadForm;
