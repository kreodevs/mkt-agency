import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'primereact/resources/primereact.min.css';
import { TooltipProvider } from '@/components/molecules/Tooltip';
import { Toaster } from '@/components/molecules/Sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { AppRouter } from '@/router';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { initPwaUpdates } from '@/pwa/registerPwa';
import './index.css';

initPwaUpdates();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppRouter />
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </QueryProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
