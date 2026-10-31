import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { iniciarActualizaciones } from './lib/actualizacion';
import App from './App';
import './index.css';

iniciarActualizaciones();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
