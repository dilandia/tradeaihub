import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next/cache if needed
vi.mock('next/cache', () => ({
  cache: (fn: any) => fn,
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Setup global mocks
global.matchMedia = global.matchMedia || function() {
  return {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
};
