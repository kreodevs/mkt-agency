import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';
// Mantenemos el tema base de PrimeReact para páginas no migradas
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primeicons/primeicons.css';
import './theme/vars.css';
import './index.css';

// Modo styled (default) — páginas migradas usan Tailwind para override
// Páginas no migradas mantienen su apariencia original
const primeReactConfig = {
  unstyled: false,
  pt: {},
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider value={primeReactConfig}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
);
