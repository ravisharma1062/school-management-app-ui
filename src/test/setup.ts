import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// RTL auto-cleanup does not run when vitest globals are disabled, so do it explicitly.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
