import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('cross-site editor adapter', () => {
  const adapter = () => window.PromptPerfectEditorAdapter;

  beforeEach(() => {
    document.body.replaceChildren();
    document.execCommand = vi.fn(() => false);
  });

  it('updates a React-style textarea and dispatches input/change events', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'rough idea';
    document.body.appendChild(textarea);
    const inputListener = vi.fn();
    const changeListener = vi.fn();
    textarea.addEventListener('input', inputListener);
    textarea.addEventListener('change', changeListener);
    expect(adapter().writeText(textarea, 'Optimized prompt')).toBe(true);
    expect(textarea.value).toBe('Optimized prompt');
    expect(inputListener).toHaveBeenCalledOnce();
    expect(changeListener).toHaveBeenCalledOnce();
  });

  it.each([['ChatGPT', 'prompt-textarea'], ['Claude', 'claude-editor']])(
    'replaces multiline text in a %s ProseMirror composer', (_platform, id) => {
      const editor = document.createElement('div');
      editor.id = id;
      editor.className = 'ProseMirror';
      editor.setAttribute('contenteditable', 'true');
      editor.innerHTML = '<p>rough idea</p>';
      document.body.appendChild(editor);
      const inputListener = vi.fn();
      editor.addEventListener('input', inputListener);
      expect(adapter().writeText(editor, 'Act as an expert.\nReturn a checklist.')).toBe(true);
      expect(adapter().readText(editor)).toBe('Act as an expert.\nReturn a checklist.');
      expect(editor.querySelectorAll('p')).toHaveLength(2);
      expect(inputListener).toHaveBeenCalledOnce();
    }
  );

  it('resolves and updates Gemini inner Quill editor from rich-textarea', () => {
    const wrapper = document.createElement('rich-textarea');
    wrapper.innerHTML = '<div class="ql-editor" contenteditable="true" role="textbox"><p>rough idea</p></div>';
    document.body.appendChild(wrapper);
    expect(adapter().resolveSurface(wrapper)).toBe(wrapper.querySelector('.ql-editor'));
    expect(adapter().writeText(wrapper, 'Optimized Gemini prompt')).toBe(true);
    expect(adapter().readText(wrapper)).toBe('Optimized Gemini prompt');
  });

  it('removes editor zero-width markers when reading a prompt', () => {
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    editor.textContent = 'prompt\u200B idea';
    document.body.appendChild(editor);
    expect(adapter().readText(editor)).toBe('prompt idea');
  });
});