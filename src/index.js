import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';  // Asegúrate de que esta línea sea exactamente así

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);