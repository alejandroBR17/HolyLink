import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Força a verificação de uma nova versão do SW no servidor a cada carregamento
      reg.update().catch(() => {});

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Quando o novo worker assumir, forçar um reload para garantir que o cliente pegue o código novo
              console.log('Nova versão do PWA encontrada. Preparando atualização automática...');
            }
          });
        }
      });
    }).catch(err => {
      console.log('SW registration failed: ', err);
    });

    // Se o controller mudar (novo SW ativado e reivindicou os clients), forçamos reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('Controller atualizado! Recarregando página para nova versão...');
        window.location.reload();
      }
    });
  });
}
