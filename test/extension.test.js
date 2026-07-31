import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Chrome Extension Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock chrome storage correctly', () => {
    chrome.storage.local.set({ key: 'value' });
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ key: 'value' });
  });

  it('should mock chrome runtime messaging correctly', () => {
    chrome.runtime.sendMessage({ action: 'test' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'test' });
  });

  it('loads the editor adapter before the content script', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'manifest.json'), 'utf8'));
    expect(manifest.content_scripts[0].js).toEqual(['editor-adapter.js', 'content.js']);
  });

  it.each([
    'https://api.deepseek.com/*',
    'https://api.openai.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://api.nvidia.com/*',
    'https://api.moonshot.cn/*'
  ])('allows requests to configured optimization provider %s', (origin) => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'manifest.json'), 'utf8'));
    expect(manifest.host_permissions).toContain(origin);
  });
});
