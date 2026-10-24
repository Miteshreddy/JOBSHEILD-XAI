import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { applyTheme, useThemeStore } from '@/store/themeStore';

// Before first paint, so a saved theme never flashes the wrong colours.
const { mode, accent } = useThemeStore.getState();
applyTheme(mode, accent);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
