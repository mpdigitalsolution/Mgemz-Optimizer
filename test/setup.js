import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

expect.extend(matchers);

window.eval(readFileSync(resolve(process.cwd(), 'editor-adapter.js'), 'utf8'));

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    }
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn()
    }
  }
};
