// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';      // <— point at YOUR App.js
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />                     {/* <— not <SchedulerApp /> */}
  </React.StrictMode>
);
