import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// EMERGENCY: Intercept .map() calls on non-arrays to debug production error
const originalMap = Array.prototype.map;
// @ts-ignore
Array.prototype.map = function(...args) {
  if (!Array.isArray(this)) {
    console.error('[CRITICAL] .map() called on non-array:', {
      type: typeof this,
      value: this,
      isArray: Array.isArray(this),
      stack: new Error().stack
    });
    // Return empty array to prevent crash
    return [];
  }
  // @ts-ignore
  return originalMap.apply(this, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
