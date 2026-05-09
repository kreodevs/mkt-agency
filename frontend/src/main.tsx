import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';
import './theme/vars.css';
import './index.css';

// Unstyled mode — Kreo components inyectan estilos vía Tailwind + CSS vars
// Cada wrapper Kreo (Card, DataTable, Dialog, etc.) tiene su propio PT
const primeReactConfig = {
  unstyled: true,
  pt: {},
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider value={primeReactConfig}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
);
