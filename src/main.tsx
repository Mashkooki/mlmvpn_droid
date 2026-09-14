import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { VpnProvider } from './context/VpnContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <VpnProvider>
      <App />
    </VpnProvider>
  </React.StrictMode>
);
