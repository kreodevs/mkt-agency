import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';
import './theme/vars.css';
import './index.css';
import { superhumanPt } from './theme/pt';

// Unstyled mode — Kreo components via Tailwind + PT Superhuman for non-migrated pages
const primeReactConfig = {
  unstyled: true,
  pt: superhumanPt,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider value={primeReactConfig}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
);
