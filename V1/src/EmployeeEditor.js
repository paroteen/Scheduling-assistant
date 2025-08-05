// src/EmployeeEditor.js
import React, { useState, useEffect } from 'react';
import './App.css'; // We'll share the same CSS file

const ALL_ABILITIES = [
  'Reservations', 'Dispatch', 'Journey Desk', 'Network', 
  'Marketing', 'Security', 'Sales', 'Scheduling', 'Badges/Projects'
];

export default function EmployeeEditor({ employee, onSave, onClose }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // When the component loads or the employee prop changes, populate the form
    // If it's a new employee, provide a default structure including the email.
    setFormData(employee || {
      name: '',
      email: '',
      shift: { start: '09:00', end: '17:00' },
      lunch: { start: '12:00', end: '13:30' },
      hours: 40,
      abilities: [],
      specialistTask: '',
      specialistTarget: 0, // Default for new employee
    });
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      // Handle numeric inputs for target hours
      const finalValue = name === 'specialistTarget' ? parseInt(value, 10) || 0 : value;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleAbilityChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => {
      const newAbilities = checked
        ? [...(prev.abilities || []), name]
        : prev.abilities.filter(ability => ability !== name);
      return { ...prev, abilities: newAbilities };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <form onSubmit={handleSubmit}>
          <h3>{employee ? 'Edit Employee' : 'Add Employee'}</h3>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email || ''} 
              onChange={handleChange} 
              placeholder="employee@email.com" 
              required 
            />
          </div>
          <div className="form-group-inline">
            <div className="form-group">
                <label>Shift Start</label>
                <input type="time" name="shift.start" value={formData.shift?.start || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Shift End</label>
                <input type="time" name="shift.end" value={formData.shift?.end || ''} onChange={handleChange} />
            </div>
          </div>
           <div className="form-group-inline">
            <div className="form-group">
                <label>Lunch Start</label>
                <input type="time" name="lunch.start" value={formData.lunch?.start || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Lunch End</label>
                <input type="time" name="lunch.end" value={formData.lunch?.end || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group-inline">
            <div className="form-group">
              <label>Specialist Task</label>
              <input type="text" name="specialistTask" value={formData.specialistTask || ''} onChange={handleChange} />
            </div>
            {/* --- New Specialist Target Field --- */}
            <div className="form-group">
              <label>Specialist Target (hrs)</label>
              <input 
                type="number" 
                name="specialistTarget" 
                value={formData.specialistTarget || 0} 
                onChange={handleChange} 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Abilities</label>
            <div className="checkbox-group">
              {ALL_ABILITIES.map(ability => (
                <label key={ability}>
                  <input
                    type="checkbox"
                    name={ability}
                    checked={formData.abilities?.includes(ability) || false}
                    onChange={handleAbilityChange}
                  /> {ability}
                </label>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="primary">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
