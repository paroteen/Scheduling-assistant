// src/AdminPanel.js
import React, { useState, useEffect } from 'react';
import './App.css'; // Reuse the main stylesheet

export default function AdminPanel({ employees, rules, onSaveRules, onEditEmployee, onRemoveEmployee, onAddNewEmployee }) { // Receive the new prop
  const [editableRules, setEditableRules] = useState(rules);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditableRules(rules);
  }, [rules]);

  const handleRequirementChange = (period, task, value, type = 'target') => {
    const newValue = parseInt(value, 10);
    if (isNaN(newValue)) return;

    setEditableRules(prevRules => {
      const updatedRules = { ...prevRules };
      
      // Initialize the period if it doesn't exist
      if (!updatedRules.coverage[period]) {
        updatedRules.coverage[period] = { requirements: {}, limits: {} };
      }
      
      // If it's a limit (min/max), store it in the limits object
      if (type === 'min' || type === 'max') {
        if (!updatedRules.coverage[period].limits) {
          updatedRules.coverage[period].limits = {};
        }
        if (!updatedRules.coverage[period].limits[task]) {
          updatedRules.coverage[period].limits[task] = {};
        }
        updatedRules.coverage[period].limits[task][type] = newValue;
      } else {
        // Otherwise, it's a target requirement
        updatedRules.coverage[period].requirements[task] = newValue;
      }
      
      return updatedRules;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveRules(editableRules);
    setIsSaving(false);
  };

  if (!editableRules.coverage) {
    return <div className="loading-overlay">Loading Rules...</div>;
  }

  return (
    <div className="admin-panel">
      <h1>Admin Settings</h1>
      
      <div className="admin-section">
        <h2>Coverage Requirements</h2>
        <div className="rule-card">
          <h4>Primary Hours (08:00 - 17:00)</h4>
          <div className="rule-input-group">
            <label>Reservations (Target):</label>
            <input
              type="number"
              min="0"
              value={editableRules.coverage.primary.requirements.Reservations || ''}
              onChange={(e) => handleRequirementChange('primary', 'Reservations', e.target.value, 'target')}
            />
          </div>
          <div className="rule-input-group">
            <label>Reservations (Min):</label>
            <input
              type="number"
              min="0"
              value={editableRules.coverage.primary.limits?.Reservations?.min || ''}
              onChange={(e) => handleRequirementChange('primary', 'Reservations', e.target.value, 'min')}
              placeholder="Min"
            />
          </div>
          <div className="rule-input-group">
            <label>Reservations (Max):</label>
            <input
              type="number"
              min="0"
              value={editableRules.coverage.primary.limits?.Reservations?.max || ''}
              onChange={(e) => handleRequirementChange('primary', 'Reservations', e.target.value, 'max')}
              placeholder="Max"
            />
          </div>
          <div className="rule-input-group">
            <label>Dispatch:</label>
            <input
              type="number"
              value={editableRules.coverage.primary.requirements.Dispatch}
              onChange={(e) => handleRequirementChange('primary', 'Dispatch', e.target.value)}
            />
          </div>
        </div>
        <div className="rule-card">
          <h4>Evening Hours (17:00+)</h4>
          <div className="rule-input-group">
            <label>Reservations (Target):</label>
            <input
              type="number"
              min="0"
              value={editableRules.coverage.evening.requirements.Reservations || ''}
              onChange={(e) => handleRequirementChange('evening', 'Reservations', e.target.value, 'target')}
            />
          </div>
          <div className="rule-input-group">
            <label>Reservations (Min):</label>
            <input
              type="number"
              min="0"
              value={editableRules.coverage.evening.limits?.Reservations?.min || ''}
              onChange={(e) => handleRequirementChange('evening', 'Reservations', e.target.value, 'min')}
              placeholder="Min"
            />
          </div>
          <div className="rule-input-group">
            <label>Reservations (Max):</label>
            <input
              type="number"
              min="0"
              value={editableRules.coverage.evening.limits?.Reservations?.max || ''}
              onChange={(e) => handleRequirementChange('evening', 'Reservations', e.target.value, 'max')}
              placeholder="Max"
            />
          </div>
           <div className="rule-input-group">
            <label>Dispatch:</label>
            <input
              type="number"
              value={editableRules.coverage.evening.requirements.Dispatch}
              onChange={(e) => handleRequirementChange('evening', 'Dispatch', e.target.value)}
            />
          </div>
        </div>
        <div className="save-rules-container">
            <button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Rule Changes'}
            </button>
        </div>
      </div>

      <div className="admin-section">
        <h2>Manage Employees</h2>
        {/* --- Add New Employee Button --- */}
        <div className="admin-actions">
            <button onClick={onAddNewEmployee} className="add-new">
                Add New Employee
            </button>
        </div>
        <div className="employee-list-admin">
            {Object.keys(employees).sort().map(name => (
                <div key={name} className="employee-item">
                <span>
                    <strong>{name}</strong> ({employees[name].email})<br/>
                    <small>Specialty: {employees[name].specialistTask} (Target: {employees[name].specialistTarget} hrs)</small>
                </span>
                <div>
                    <button className="edit" onClick={() => onEditEmployee(name)}>Edit</button>
                    <button className="remove" onClick={() => onRemoveEmployee(name)}>Remove</button>
                </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
