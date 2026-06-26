import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'primereact/resources/primereact.min.css';
import { TooltipProvider } from '@/components/molecules/Tooltip';
import { Toaster } from '@/components/molecules/Sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { AppRouter } from '@/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryProvider>
  </StrictMode>,
);
