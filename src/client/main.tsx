import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './index.css';
import { setupMockApiIfNeeded } from './demo/mockApi.js';

// Ativa camada de demonstração estática se estiver rodando no GitHub Pages
setupMockApiIfNeeded();

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
