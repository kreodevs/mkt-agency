import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';
import './theme/vars.css';
import './index.css';

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
