import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';
import './theme/vars.css';
import './index.css';

// Unstyled mode — Kreo UI components inyectan estilos vía Tailwind + CSS vars
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
