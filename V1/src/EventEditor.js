// src/EventEditor.js
import React, { useState, useEffect } from 'react';
import './App.css';

export default function EventEditor({ event, employee, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
  });

  useEffect(() => {
    if (event) {
      // Format the start and end times for the input fields
      const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };

      setFormData({
        title: event.title,
        start: formatTime(event.start),
        end: formatTime(event.end),
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Reconstruct the full date objects before saving
    const newStart = new Date(event.start);
    const [startHours, startMinutes] = formData.start.split(':');
    newStart.setHours(startHours, startMinutes);

    const newEnd = new Date(event.end);
    const [endHours, endMinutes] = formData.end.split(':');
    newEnd.setHours(endHours, endMinutes);

    onSave({
      ...event,
      title: formData.title,
      start: newStart,
      end: newEnd,
    });
  };

  if (!event) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit Task</h3>
        <div className="form-group">
          <label>Task</label>
          <select name="title" value={formData.title} onChange={handleChange}>
            {/* Populate dropdown with the employee's abilities */}
            {employee?.abilities?.map(ability => (
              <option key={ability} value={ability}>{ability}</option>
            ))}
            {/* Add other common tasks */}
            <option value="Lunch">Lunch</option>
            <option value={employee.specialistTask}>{employee.specialistTask} (Specialty)</option>
          </select>
        </div>
        <div className="form-group-inline">
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" name="start" value={formData.start} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" name="end" value={formData.end} onChange={handleChange} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="danger" onClick={() => onDelete(event.id)}>Delete Task</button>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
