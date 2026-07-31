(function installPromptPerfectEditorAdapter(global) {
    'use strict';

    const EDITABLE_SELECTOR = [
        'textarea', 'input[type="text"]', 'input:not([type])',
        '.ProseMirror[contenteditable="true"]', '.ql-editor[contenteditable="true"]',
        '#prompt-textarea[contenteditable="true"]', '[contenteditable="plaintext-only"]',
        '[contenteditable="true"][role="textbox"]', '[contenteditable="true"]'
    ].join(', ');

    function isTextControl(element) {
        return !!element && (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT');
    }

    function resolveSurface(element) {
        if (!element || element.nodeType !== 1) return null;
        const contentEditable = element.getAttribute('contenteditable');
        if (isTextControl(element) || element.isContentEditable ||
            contentEditable === 'true' || contentEditable === 'plaintext-only') return element;

        if (element.tagName === 'RICH-TEXTAREA') {
            return element.querySelector('.ql-editor[contenteditable="true"], [contenteditable="true"][role="textbox"], [contenteditable="true"], textarea');
        }
        const descendant = element.querySelector && element.querySelector(EDITABLE_SELECTOR);
        if (descendant) return descendant;
        const closest = element.closest && element.closest(EDITABLE_SELECTOR + ', rich-textarea');
        if (!closest || closest === element) return null;
        return closest.tagName === 'RICH-TEXTAREA' ? resolveSurface(closest) : closest;
    }

    function normalizeText(text) {
        return String(text || '').replace(/\r\n?/g, '\n').replace(/[\u200B\uFEFF]/g, '');
    }

    function readText(element) {
        const surface = resolveSurface(element);
        if (!surface) return '';
        if (isTextControl(surface)) return normalizeText(surface.value);
        if (typeof surface.innerText === 'string') return normalizeText(surface.innerText);
        const blocks = Array.from(surface.children || []);
        if (blocks.length > 0) return normalizeText(blocks.map((block) => block.textContent || '').join('\n'));
        return normalizeText(surface.textContent || '');
    }

    function dispatchInput(element, text) {
        const view = element.ownerDocument.defaultView || global;
        try {
            element.dispatchEvent(new view.InputEvent('input', {
                bubbles: true, composed: true, inputType: 'insertReplacementText', data: text
            }));
        } catch (error) {
            element.dispatchEvent(new view.Event('input', { bubbles: true, composed: true }));
        }
        element.dispatchEvent(new view.Event('change', { bubbles: true, composed: true }));
    }

    function selectContents(element) {
        const doc = element.ownerDocument;
        const selection = doc.defaultView && doc.defaultView.getSelection();
        if (!selection) return;
        const range = doc.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function moveCaretToEnd(element) {
        const doc = element.ownerDocument;
        const selection = doc.defaultView && doc.defaultView.getSelection();
        if (!selection) return;
        const range = doc.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function replaceContentEditableDom(element, text) {
        const doc = element.ownerDocument;
        const normalized = normalizeText(text);
        if (element.getAttribute('contenteditable') === 'plaintext-only') {
            element.replaceChildren(doc.createTextNode(normalized));
            return;
        }
        const fragment = doc.createDocumentFragment();
        normalized.split('\n').forEach((line) => {
            const paragraph = doc.createElement('p');
            if (line) paragraph.textContent = line;
            else paragraph.appendChild(doc.createElement('br'));
            fragment.appendChild(paragraph);
        });
        element.replaceChildren(fragment);
    }

    function writeText(element, text) {
        const surface = resolveSurface(element);
        if (!surface) return false;
        const normalized = normalizeText(text);
        surface.focus();
        if (isTextControl(surface)) {
            const view = surface.ownerDocument.defaultView || global;
            const prototype = surface.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
            const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
            if (nativeSetter) nativeSetter.call(surface, normalized);
            else surface.value = normalized;
            dispatchInput(surface, normalized);
            try { surface.setSelectionRange(normalized.length, normalized.length); } catch (error) {}
            return normalizeText(surface.value) === normalized;
        }

        selectContents(surface);
        let inserted = false;
        try {
            inserted = !!surface.ownerDocument.execCommand && surface.ownerDocument.execCommand('insertText', false, normalized);
        } catch (error) {}
        if (!inserted || normalizeText(readText(surface)).trim() !== normalized.trim()) {
            replaceContentEditableDom(surface, normalized);
            dispatchInput(surface, normalized);
        }
        moveCaretToEnd(surface);
        surface.focus();
        return normalizeText(readText(surface)).trim() === normalized.trim();
    }

    global.PromptPerfectEditorAdapter = Object.freeze({
        selector: EDITABLE_SELECTOR, resolveSurface, readText, writeText, normalizeText
    });
})(globalThis);