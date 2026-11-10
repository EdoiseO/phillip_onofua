import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { OffTheClock } from './pages/OffTheClock.jsx';

hydrateRoot(
  document.getElementById('off-clock-root'),
  <StrictMode>
    <OffTheClock />
  </StrictMode>,
);
