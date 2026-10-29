import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Remove the retired demo-auth flag left by older deployments. Authentication is now API-backed.
try {
  window.localStorage.removeItem('lasynet-demo-auth');
} catch {
  // Storage may be unavailable in restricted browser contexts; API auth remains authoritative.
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
