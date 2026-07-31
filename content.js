/**
 * PromptPerfect Content Script
 * Injects optimize button into DeepSeek and Grok chat interfaces
 */

(function() {
    'use strict';
    
    // Configuration for different platforms
    const PLATFORM_CONFIGS = {
        'chat.deepseek.com': {
            themeClass: 'deepseek-theme',
            inputSelector: 'textarea#chat-input, textarea[placeholder*="Message"], textarea[placeholder*="message"], div[contenteditable="true"][role="textbox"], div[contenteditable="plaintext-only"], div.ProseMirror[contenteditable="true"], [data-testid*="chat-input"]',
            buttonContainerSelector: '.chat-input-container, .input-container',
            sendButtonSelector: 'button[type="submit"], .send-button'
        },
        'grok.com': {
            themeClass: 'grok-theme',
            inputSelector: 'textarea[placeholder*="Grok"], textarea[placeholder*="Ask"], textarea[placeholder*="Message"], textarea.w-full, div.prose textarea, textarea[data-testid="chat-input"], main textarea, textarea, div[contenteditable="true"][role="textbox"], div[contenteditable="plaintext-only"], div.ProseMirror[contenteditable="true"], [data-testid*="chat-input"]',
            buttonContainerSelector: 'form, .input-container, .chat-input, .relative.flex.w-full, div[class*="input"], main form, .w-full.flex-col',
            sendButtonSelector: 'button[aria-label*="Send"], button[aria-label*="send"], button[type="submit"], button[data-testid*="send"], .send-button, button.send-btn'
        },
        'claude.ai': {
            themeClass: 'claude-theme',
            inputSelector: 'div.ProseMirror[contenteditable="true"], div[contenteditable="true"][data-placeholder], div[contenteditable="true"][role="textbox"], div[contenteditable="plaintext-only"], textarea, [data-testid*="chat-input"]',
            buttonContainerSelector: 'fieldset, .flex.w-full.flex-col, form',
            sendButtonSelector: 'button[aria-label="Send Message"], button[aria-label*="send"], button[type="submit"]'
        },
        'gemini.google.com': {
            themeClass: 'gemini-theme',
            inputSelector: 'rich-textarea .ql-editor[contenteditable="true"], rich-textarea [contenteditable="true"], rich-textarea, div.ql-editor[contenteditable="true"], div[contenteditable="true"][role="textbox"], .textarea-container textarea, .chat-input-textarea',
            buttonContainerSelector: '.input-area, .textarea-wrapper, .chat-input, .send-button-container, .bottom-container, .gmat-caption, .rich-textarea-container',
            sendButtonSelector: 'button[aria-label*="Send"], button.send-button, .send-button-container button, button[aria-label*="submit"]'
        },
        'chatgpt.com': {
            themeClass: 'chatgpt-theme',
            inputSelector: '#prompt-textarea[contenteditable="true"], textarea#prompt-textarea, [data-testid="composer-text-input"], div.ProseMirror[contenteditable="true"], div[contenteditable="true"][role="textbox"], div[contenteditable="plaintext-only"], [data-testid*="composer"]',
            buttonContainerSelector: '.flex.w-full.items-center, form, .relative.flex.h-full.max-w-full.flex-1',
            sendButtonSelector: 'button[data-testid="send-button"]'
        },
        'chat.openai.com': {
            themeClass: 'chatgpt-theme',
            inputSelector: '#prompt-textarea, textarea, div[contenteditable="true"][role="textbox"], div[contenteditable="true"]',
            buttonContainerSelector: 'form, .flex.w-full.items-center, .relative.flex.h-full.max-w-full.flex-1',
            sendButtonSelector: 'button[data-testid="send-button"], button[aria-label*="Send"], button[type="submit"]'
        },
        'mail.google.com': {
            themeClass: 'gmail-theme',
            inputSelector: 'div[g_editable="true"][contenteditable="true"], div[aria-label="Message Body"][contenteditable="true"], div[aria-label*="Message Body"][contenteditable="true"], div[role="textbox"][contenteditable="true"]',
            buttonContainerSelector: null,
            sendButtonSelector: 'div[role="button"][data-tooltip*="Send"]'
        },
        'docs.google.com': {
            themeClass: 'docs-theme',
            inputSelector: 'div[role="textbox"][contenteditable="true"], div[contenteditable="true"]',
            buttonContainerSelector: null,
            sendButtonSelector: null
        }
    };
    
    let currentPlatform = null;
    let optimizeButton = null;
    let currentInput = null;
    let lastFocusedInput = null;
    let isProcessing = false;
    let animatedPlatform = false;
    const optimizationCache = new Map();
    const inFlightOptimizations = new Map();
    const OPTIMIZATION_CACHE_TTL_MS = 180000;
    const DEBUG_SERVER_URL = 'http://127.0.0.1:7777/event';
    const DEBUG_SESSION_ID = 'optimize-button-position';
    const DEBUG_RUN_ID = 'post-fix';

    // #region debug-point A:report-helper
    function reportDebugEvent(hypothesisId, location, msg, data) {
        try {
            fetch(DEBUG_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: DEBUG_SESSION_ID,
                    runId: DEBUG_RUN_ID,
                    hypothesisId,
                    location,
                    msg,
                    data,
                    ts: Date.now()
                })
            }).catch(() => {});
        } catch (e) {}
    }
    // #endregion
    
    // Initialize the extension
    function initialize() {
        const hostname = window.location.hostname || '';
        let originHost = hostname;
        if (!originHost || originHost === 'about:blank') {
            try {
                const ref = document.referrer || '';
                originHost = ref ? new URL(ref).hostname : '';
            } catch (e) {
                originHost = hostname;
            }
        }
        
        if (hostname === 'x.com' && window.location && typeof window.location.pathname === 'string' && window.location.pathname.startsWith('/i/grok')) {
            currentPlatform = PLATFORM_CONFIGS['grok.com'];
            document.body.classList.add('grok-theme');
        } else {
            for (const [domain, config] of Object.entries(PLATFORM_CONFIGS)) {
                if ((originHost && originHost.includes(domain)) || (hostname && hostname.includes(domain))) {
                    currentPlatform = config;
                    const themeClass = config.themeClass || (domain.split('.')[0] + '-theme');
                    document.body.classList.add(themeClass);
                    break;
                }
            }
        }
        
        animatedPlatform = (originHost || hostname).includes('chatgpt.com') ||
            (originHost || hostname).includes('gemini.google.com') ||
            (originHost || hostname).includes('claude.ai');
        
        if (!currentPlatform) {
            console.log('PromptPerfect: Unsupported platform:', hostname, 'referrer:', document.referrer || '(none)');
            return;
        }
        
        console.log('PromptPerfect: Initializing for', originHost || hostname);
        injectOptimizeButton();
        setupKeyboardShortcuts();
        
        if ((originHost || hostname).includes('mail.google.com') || (originHost || hostname).includes('docs.google.com')) {
            document.addEventListener('focusin', () => {
                if (!optimizeButton || !document.contains(optimizeButton)) {
                    setTimeout(injectOptimizeButton, 100);
                }
            });
        }
        
        // Track the exact composer the user last typed in. Clicking the floating
        // button moves focus away from it, so this is more reliable than querying
        // the first visible textbox after the click.
        document.addEventListener('focusin', (e) => {
            const target = e.target;
            if (!target) return;
            const candidate = normalizeEditableElement(target);
            const isInput = candidate && isUsableInputElement(candidate);
            if (isInput) {
                lastFocusedInput = candidate;
                currentInput = candidate;
                updateButtonState();
            }
            if (isInput && (!optimizeButton || !document.contains(optimizeButton))) {
                setTimeout(injectOptimizeButton, 150);
            }
        }, true);
        
        // Watch for DOM changes (for SPAs)
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                    break;
                }
                // Also trigger when the input element is removed (SPA re-render)
                if (mutation.removedNodes.length > 0) {
                    for (const node of mutation.removedNodes) {
                        if (node === currentInput || (currentInput && node.contains && node.contains(currentInput))) {
                            shouldCheck = true;
                            break;
                        }
                    }
                    if (shouldCheck) break;
                }
            }
            
            if (shouldCheck && (!optimizeButton || !document.contains(optimizeButton) || (currentInput && !document.contains(currentInput)))) {
                // Debounce injection to prevent multiple rapid calls
                clearTimeout(window.injectionTimeout);
                window.injectionTimeout = setTimeout(injectOptimizeButton, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Create and inject the optimize button
    let retryCount = 0;
    let missingInputLogged = false;
    
    function injectOptimizeButton() {
        // Keep the floating widget mounted while SPA chat editors load or re-render.
        if (optimizeButton && document.contains(optimizeButton)) {
            const refreshedInput = findInputElement();
            if (refreshedInput && refreshedInput !== currentInput) {
                currentInput = refreshedInput;
                currentInput.addEventListener('input', updateButtonState);
                missingInputLogged = false;
                updateButtonState();
                // Snap beside the newly discovered editor unless the user has a saved drag position.
                insertFloatingButton(currentInput);
            } else if (!refreshedInput) {
                currentInput = null;
                updateButtonState();
                setTimeout(injectOptimizeButton, 2000);
            }
            return;
        }
        
        const input = findInputElement();
        if (!input) {
            const host = window.location.hostname || '';
            if (!missingInputLogged) {
                console.log('PromptPerfect: Input element not found on', host, '- will keep trying...');
                missingInputLogged = true;
            }
            // Create the widget now; retry editor discovery independently.
            setTimeout(injectOptimizeButton, 2000);
        }
        
        // Reset retry count on success
        retryCount = 0;
        missingInputLogged = false;
        
        currentInput = input || null;

        // #region debug-point B:input-detected
        if (input) {
            reportDebugEvent('B', 'content.js:injectOptimizeButton', '[DEBUG] Input detected for optimize button', {
                host: window.location.hostname || '',
                tagName: input.tagName || '',
                id: input.id || '',
                role: input.getAttribute ? (input.getAttribute('role') || '') : '',
                contenteditable: input.getAttribute ? (input.getAttribute('contenteditable') || '') : '',
                testid: input.getAttribute ? (input.getAttribute('data-testid') || '') : '',
                placeholder: input.getAttribute ? (input.getAttribute('placeholder') || '') : '',
                rect: (() => {
                    const r = input.getBoundingClientRect();
                    return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
                })()
            });
        }
        // #endregion
        
        // Create optimize button
        optimizeButton = document.createElement('button');
        optimizeButton.id = 'promptperfect-optimize-btn';
        optimizeButton.type = 'button'; // Prevent form submission
        optimizeButton.innerHTML = '✨ Optimize';
        optimizeButton.dataset.defaultLabel = '✨ Optimize';
        optimizeButton.className = 'promptperfect-btn';
        optimizeButton.title = 'Optimize prompt (Ctrl+Shift+O)';
        optimizeButton.setAttribute('aria-disabled', 'true');
        
        // Add click handler
        optimizeButton.addEventListener('click', handleOptimizeClick);
        optimizeButton.addEventListener('pointerdown', rememberActiveEditor, true);
        setupDraggableOptimizeButton(optimizeButton);
        
        // Add input listener to enable/disable button
        if (input) {
            input.addEventListener('input', updateButtonState);
        }
        
        const hostname = window.location.hostname;
        getOptimizationSettings().then((settings) => {
            if (hostname.includes('mail.google.com') && settings.gmailAutoGrammar) {
                setupGmailAutoGrammar(settings);
            }
            if (hostname.includes('docs.google.com') && settings.docsAutoGrammar) {
                setupDocsAutoGrammar(settings);
            }
        });
        
        // Insert button into the DOM
        insertButton(input);
        
        // Initial state update
        updateButtonState();
    }
    
    function normalizeEditableElement(element) {
        if (!element || !(element instanceof Element)) return null;
        const adapter = globalThis.PromptPerfectEditorAdapter;
        return adapter ? adapter.resolveSurface(element) : element;
    }

    function isUsableInputElement(element) {
        if (!element || !(element instanceof Element)) return false;

        const normalized = normalizeEditableElement(element);
        if (!normalized) return false;

        const style = window.getComputedStyle(normalized);
        const rect = normalized.getBoundingClientRect();
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        const isDisabled = normalized.matches(':disabled, [disabled], [aria-disabled="true"], [readonly], [aria-hidden="true"]');

        return isVisible && !isDisabled;
    }

    // Find the input element for the current platform
    function findInputElement() {
        const host = window.location.hostname || '';
        const active = document.activeElement;
        if (active) {
            const normalizedActive = normalizeEditableElement(active);
            const isActiveTextbox = normalizedActive &&
                (normalizedActive.tagName === 'TEXTAREA' ||
                normalizedActive.tagName === 'INPUT' ||
                normalizedActive.tagName === 'RICH-TEXTAREA' ||
                normalizedActive.isContentEditable ||
                normalizedActive.getAttribute('role') === 'textbox');
            if (isActiveTextbox && isUsableInputElement(normalizedActive)) {
                return normalizedActive;
            }
        }
        if (host.includes('mail.google.com')) {
            if (active && active.isContentEditable && active.getAttribute('g_editable') === 'true') {
                return active;
            }
        }
        
        const selectors = currentPlatform.inputSelector.split(', ');
        
        // First try finding an active or visible textarea
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const normalized = normalizeEditableElement(element);
                if (host.includes('mail.google.com')) {
                    const isComposeBody = normalized.getAttribute('g_editable') === 'true' ||
                        (normalized.getAttribute('aria-label') || '').toLowerCase().includes('message body');
                    if (!isComposeBody) {
                        continue;
                    }
                }
                if (isUsableInputElement(normalized)) {
                    return normalized;
                }
            }
        }
        
        // Universal fallback: find ANY visible textarea or contenteditable textbox
        const universalSelectors = [
            'textarea:not([aria-hidden="true"])',
            'div.ProseMirror[contenteditable="true"]:not([aria-hidden="true"])',
            'div[contenteditable="true"][role="textbox"]:not([aria-hidden="true"])',
            'div[contenteditable="true"]:not([aria-hidden="true"])',
            'div[contenteditable="plaintext-only"]:not([aria-hidden="true"])',
            'input[type="text"]:not([aria-hidden="true"])',
            '[data-testid*="composer"]:not([aria-hidden="true"])',
            '[data-testid*="chat-input"]:not([aria-hidden="true"])',
            '[contenteditable="plaintext-only"]:not([aria-hidden="true"])'
        ];
        for (const sel of universalSelectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                const normalized = normalizeEditableElement(el);
                if (isUsableInputElement(normalized)) {
                    console.log('PromptPerfect: Found input via universal fallback:', sel);
                    return normalized;
                }
            }
        }
        
        console.log('PromptPerfect: No input found on', window.location.hostname);
        return null;
    }
    
    function insertButton(input) {
        insertFloatingButton(input);
    }
    
    let floatingPositionCleanup = null;
    let suppressOptimizeClick = false;
    const WIDGET_POSITION_KEY = 'promptperfectWidgetPositionsV2';

    function setupDraggableOptimizeButton(button) {
        let dragState = null;

        const moveDrag = (event) => {
            if (!dragState || event.pointerId !== dragState.pointerId) return;
            const distance = Math.hypot(
                event.clientX - dragState.startX,
                event.clientY - dragState.startY
            );
            if (!dragState.moved && distance < 5) return;

            if (!dragState.moved) {
                dragState.moved = true;
                button.classList.add('promptperfect-dragging');
            }

            event.preventDefault();
            const margin = 8;
            const maxLeft = Math.max(margin, window.innerWidth - button.offsetWidth - margin);
            const maxTop = Math.max(margin, window.innerHeight - button.offsetHeight - margin);
            const left = Math.max(margin, Math.min(maxLeft, event.clientX - dragState.offsetX));
            const top = Math.max(margin, Math.min(maxTop, event.clientY - dragState.offsetY));
            button.style.left = `${left}px`;
            button.style.top = `${top}px`;
        };

        const finishDrag = (event) => {
            if (!dragState || event.pointerId !== dragState.pointerId) return;
            const moved = dragState.moved;
            dragState = null;
            button.classList.remove('promptperfect-dragging');
            document.removeEventListener('pointermove', moveDrag);
            document.removeEventListener('pointerup', finishDrag);
            document.removeEventListener('pointercancel', finishDrag);
            try { button.releasePointerCapture(event.pointerId); } catch (e) {}
            if (!moved) return;

            suppressOptimizeClick = true;
            // Browsers dispatch click after pointerup; keep suppression active long enough
            // to ensure a completed drag never starts optimization.
            setTimeout(() => { suppressOptimizeClick = false; }, 250);
            saveWidgetPosition(button);
        };

        button.addEventListener('pointerdown', (event) => {
            if (event.button !== 0 || isProcessing) return;
            const rect = button.getBoundingClientRect();

            // Convert inline placement before taking pointer capture. Reparenting after
            // capture starts can make browsers release capture and abort the drag.
            if (!button.classList.contains('promptperfect-floating') || button.parentElement !== document.body) {
                if (floatingPositionCleanup) {
                    try { floatingPositionCleanup(); } catch (e) {}
                    floatingPositionCleanup = null;
                }
                button.classList.remove('promptperfect-inline');
                button.classList.add('promptperfect-floating');
                document.body.appendChild(button);
                button.style.left = `${rect.left}px`;
                button.style.top = `${rect.top}px`;
                button.style.right = 'auto';
                button.style.bottom = 'auto';
            }

            dragState = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
                moved: false
            };
            document.addEventListener('pointermove', moveDrag, { passive: false });
            document.addEventListener('pointerup', finishDrag);
            document.addEventListener('pointercancel', finishDrag);
            try { button.setPointerCapture(event.pointerId); } catch (e) {}
        });
    }

    function saveWidgetPosition(button) {
        const rect = button.getBoundingClientRect();
        chrome.storage.local.get([WIDGET_POSITION_KEY], (result) => {
            const positions = result[WIDGET_POSITION_KEY] || {};
            positions[window.location.hostname] = {
                left: Math.round(rect.left),
                top: Math.round(rect.top)
            };
            chrome.storage.local.set({ [WIDGET_POSITION_KEY]: positions });
        });
    }

    function restoreWidgetPosition(button, fallback) {
        chrome.storage.local.get([WIDGET_POSITION_KEY], (result) => {
            const saved = (result[WIDGET_POSITION_KEY] || {})[window.location.hostname];
            if (!saved || !Number.isFinite(saved.left) || !Number.isFinite(saved.top)) {
                fallback();
                return;
            }
            const margin = 8;
            const left = Math.max(margin, Math.min(window.innerWidth - button.offsetWidth - margin, saved.left));
            const top = Math.max(margin, Math.min(window.innerHeight - button.offsetHeight - margin, saved.top));
            button.style.left = `${left}px`;
            button.style.top = `${top}px`;
        });
    }

    function clearButtonPlacementState() {
        if (!optimizeButton) return;
        if (floatingPositionCleanup) {
            try { floatingPositionCleanup(); } catch (e) {}
            floatingPositionCleanup = null;
        }
        optimizeButton.classList.remove('promptperfect-floating');
        optimizeButton.classList.remove('promptperfect-inline');
        optimizeButton.style.top = '';
        optimizeButton.style.left = '';
        optimizeButton.style.right = '';
        optimizeButton.style.bottom = '';
    }

    function findButtonContainer(input) {
        if (!input || !currentPlatform) return null;

        const sendButton = currentPlatform.sendButtonSelector ? document.querySelector(currentPlatform.sendButtonSelector) : null;
        if (sendButton && sendButton.parentElement) {
            return sendButton.parentElement;
        }

        const selectors = (currentPlatform.buttonContainerSelector || '').split(', ').filter(Boolean);
        for (const selector of selectors) {
            const nearest = input.closest(selector);
            if (nearest && nearest instanceof Element) {
                return nearest;
            }
        }

        if (input.parentElement) {
            return input.parentElement;
        }

        return null;
    }

    function insertInlineButton(input, container) {
        if (!optimizeButton || !container) return;

        clearButtonPlacementState();
        optimizeButton.classList.add('promptperfect-inline');

        const sendButton = currentPlatform.sendButtonSelector ? container.querySelector(currentPlatform.sendButtonSelector) || document.querySelector(currentPlatform.sendButtonSelector) : null;
        if (sendButton && sendButton.parentElement) {
            sendButton.insertAdjacentElement('beforebegin', optimizeButton);
        } else {
            container.appendChild(optimizeButton);
        }

        // #region debug-point D:inline-placement
        reportDebugEvent('D', 'content.js:insertInlineButton', '[DEBUG] Inline button placement selected', {
            host: window.location.hostname || '',
            containerTag: container.tagName || '',
            containerClass: typeof container.className === 'string' ? container.className.slice(0, 200) : '',
            hasSendButton: !!sendButton
        });
        // #endregion
    }
    
    function insertFloatingButton(input) {
        if (!optimizeButton) return;

        clearButtonPlacementState();
        optimizeButton.classList.add('promptperfect-floating');
        document.body.appendChild(optimizeButton);
        
        const positionButton = () => {
            const inputIsVisible = input && document.contains(input);
            const rect = inputIsVisible
                ? input.getBoundingClientRect()
                : { left: window.innerWidth - 140, right: window.innerWidth - 140, bottom: window.innerHeight - 56 };
            const btnWidth = 120;
            const btnHeight = 36;
            const gap = 8;
            
            // Default to the upper-right edge of the chat box without covering typed text.
            // While the editor is loading, use the viewport's bottom-right corner.
            let left = inputIsVisible ? rect.right - btnWidth : window.innerWidth - btnWidth - gap;
            let top = inputIsVisible ? rect.top - btnHeight - gap : window.innerHeight - btnHeight - gap;
            if (inputIsVisible && top < gap) {
                top = rect.bottom + gap;
            }
            
            // Keep within viewport bounds
            left = Math.max(gap, Math.min(window.innerWidth - btnWidth - gap, left));
            top = Math.max(gap, Math.min(window.innerHeight - btnHeight - gap, top));
            
            optimizeButton.style.top = `${top}px`;
            optimizeButton.style.left = `${left}px`;

            // #region debug-point A:position-computed
            reportDebugEvent('A', 'content.js:positionButton', '[DEBUG] Floating button position computed', {
                viewport: { width: window.innerWidth, height: window.innerHeight },
                inputRect: {
                    left: Math.round(rect.left),
                    top: Math.round(rect.top),
                    right: Math.round(rect.right),
                    bottom: Math.round(rect.bottom),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                },
                computed: { left: Math.round(left), top: Math.round(top), btnWidth, btnHeight, gap }
            });
            // #endregion
        };
        
        // Initial position + register scroll/resize listeners + input resize observer
        restoreWidgetPosition(optimizeButton, positionButton);
        const keepButtonOnScreen = () => {
            const rect = optimizeButton.getBoundingClientRect();
            const margin = 8;
            const left = Math.max(margin, Math.min(window.innerWidth - rect.width - margin, rect.left));
            const top = Math.max(margin, Math.min(window.innerHeight - rect.height - margin, rect.top));
            optimizeButton.style.left = `${left}px`;
            optimizeButton.style.top = `${top}px`;
            saveWidgetPosition(optimizeButton);
        };
        window.addEventListener('resize', keepButtonOnScreen, { passive: true });
        
        // Verify the button is actually visible after placement
        requestAnimationFrame(() => {
            if (!optimizeButton || !document.contains(optimizeButton)) return;
            const cs = window.getComputedStyle(optimizeButton);
            const rect = optimizeButton.getBoundingClientRect();
            const isActuallyVisible = cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && rect.width > 0 && rect.height > 0;
            const centerX = Math.max(0, Math.min(window.innerWidth - 1, Math.round(rect.left + (rect.width / 2))));
            const centerY = Math.max(0, Math.min(window.innerHeight - 1, Math.round(rect.top + (rect.height / 2))));
            const hitEl = document.elementFromPoint(centerX, centerY);
            // #region debug-point C:placement-observed
            reportDebugEvent('C', 'content.js:requestAnimationFrame', '[DEBUG] Floating button final placement observed', {
                actualRect: {
                    left: Math.round(rect.left),
                    top: Math.round(rect.top),
                    right: Math.round(rect.right),
                    bottom: Math.round(rect.bottom),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                },
                visible: isActuallyVisible,
                styles: {
                    display: cs.display,
                    visibility: cs.visibility,
                    opacity: cs.opacity,
                    zIndex: cs.zIndex,
                    pointerEvents: cs.pointerEvents
                },
                hitTarget: hitEl ? {
                    tagName: hitEl.tagName || '',
                    id: hitEl.id || '',
                    className: typeof hitEl.className === 'string' ? hitEl.className.slice(0, 160) : ''
                } : null
            });
            // #endregion
        });
        
        // Store cleanup function for next re-injection
        floatingPositionCleanup = () => {
            window.removeEventListener('resize', keepButtonOnScreen);
        };
    }
    
    // Read and write through one adapter so React textareas, ProseMirror
    // composers, and Gemini's nested Quill editor all receive native events.
    function getInputValue() {
        if (!currentInput) return '';
        return globalThis.PromptPerfectEditorAdapter.readText(currentInput);
    }

    function setInputValue(text) {
        if (!currentInput) return false;
        currentInput = normalizeEditableElement(currentInput) || currentInput;
        return globalThis.PromptPerfectEditorAdapter.writeText(currentInput, text);
    }

    function rememberActiveEditor() {
        const active = normalizeEditableElement(document.activeElement);
        if (active && isUsableInputElement(active)) {
            lastFocusedInput = active;
            currentInput = active;
        }
    }

    // Update button state based on input content
    function updateButtonState() {
        if (optimizeButton) {
            const val = currentInput ? getInputValue() : '';
            const hasText = val && val.trim().length > 0;
            optimizeButton.disabled = !!isProcessing;
            optimizeButton.setAttribute('aria-disabled', String(!hasText || isProcessing));
            optimizeButton.classList.toggle('processing', isProcessing);
            if (animatedPlatform) {
                if (isProcessing) {
                    optimizeButton.innerHTML = '<span class="pp-spinner"></span><span>Optimizing...</span>';
                } else {
                    optimizeButton.innerHTML = optimizeButton.dataset.defaultLabel || '✨ Optimize';
                }
            }
        }
    }
    
    // Handle optimize button click
    async function handleOptimizeClick(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (suppressOptimizeClick) return;

        if (lastFocusedInput && document.contains(lastFocusedInput) && isUsableInputElement(lastFocusedInput)) {
            currentInput = lastFocusedInput;
        } else {
            currentInput = findInputElement();
        }
        
        const val = getInputValue();
        if (!val || !val.trim()) return;
        
        const originalPrompt = val.trim();
        
        try {
            isProcessing = true;
            updateButtonState();
            
            const settings = await getOptimizationSettings();
            if (settings.lintPrecheck) {
                const proceed = await showLintOverlayAndWait(originalPrompt, settings);
                if (!proceed) return;
            }
            // The in-page widget is a one-click action: optimize and replace the
            // active prompt immediately.  The popup can still use the A/B and
            // four-panel preview workflows when the user wants to compare variants.
            const optimized = await optimizePrompt(originalPrompt, {
                style: settings.style,
                fastMode: settings.fastMode,
                model: settings.model,
                panelMode: 'single'
            });

            if (!optimized || !optimized.trim()) {
                throw new Error('The optimizer returned an empty prompt');
            }

            const replaced = setInputValue(optimized.trim());
            if (!replaced) {
                throw new Error('Could not update this chat box. Click inside it and try again.');
            }
            await saveToHistory(originalPrompt, optimized.trim(), settings.style);

            if (settings.autoSend) {
                setTimeout(() => {
                    const sendSelector = currentPlatform && currentPlatform.sendButtonSelector;
                    const sendButton = sendSelector ? document.querySelector(sendSelector) : null;
                    if (sendButton && !sendButton.disabled) sendButton.click();
                }, 100);
            }

            showNotification('Prompt optimized!', 'success');
            
        } catch (error) {
            if (error && error.message === 'API key not configured') {
                console.warn('PromptPerfect: API key not configured');
                showNotification("⚠️ Please click the MGEM'S OPIMIZER PRO extension icon (✨) in your toolbar and enter your DeepSeek API key.", 'error');
            } else if (error && error.message && error.message.includes('Extension context invalidated')) {
                console.warn('PromptPerfect: Extension context invalidated');
                showNotification("⚠️ Extension was updated. Please refresh the page to continue using it.", 'error');
            } else if (error && error.message && error.message.includes('timed out')) {
                console.warn('PromptPerfect: Optimization timed out');
                showNotification("⏳ Optimization timed out. Please try again.", 'error');
            } else {
                console.warn('PromptPerfect: Optimization failed:', error ? error.message : 'Unknown error');
                showNotification('Optimization failed: ' + (error ? error.message : 'Unknown error'), 'error');
            }
        } finally {
            isProcessing = false;
            updateButtonState();
        }
    }
    
    // Optimize prompt using DeepSeek API (via background script to avoid CSP issues)
    async function optimizePrompt(prompt, settings) {
        const style = settings && settings.style ? settings.style : 'default';
        const fastMode = settings && settings.fastMode !== undefined ? !!settings.fastMode : true;
        const cacheKey = `${style}|${fastMode ? '1' : '0'}|${prompt}`;
        const cached = optimizationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < OPTIMIZATION_CACHE_TTL_MS) {
            return cached.value;
        }
        if (inFlightOptimizations.has(cacheKey)) {
            return inFlightOptimizations.get(cacheKey);
        }
        let keepAliveInterval;
        const requestPromise = (async () => {
            try {
                keepAliveInterval = setInterval(() => {
                    try {
                        chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {});
                    } catch (e) {
                    }
                }, 20000);
                
                const timeoutMs = fastMode ? 12000 : 25000;
                const response = await Promise.race([
                    chrome.runtime.sendMessage({ 
                        action: 'optimize-prompt-api', 
                        prompt: prompt, 
                        settings: settings 
                    }),
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Optimization timed out. Please try again.')), timeoutMs);
                    })
                ]);
                
                if (!response) {
                    throw new Error('No response from background script');
                }
                
                if (response.success) {
                    optimizationCache.set(cacheKey, { value: response.optimizedPrompt, timestamp: Date.now() });
                    return response.optimizedPrompt;
                } else {
                    throw new Error(response.error || 'Unknown error occurred');
                }
            } catch (error) {
                if (error.message && error.message.includes('message port closed')) {
                    throw new Error('The optimization took too long or the extension background script was suspended. Please try again.');
                }
                throw error;
            } finally {
                if (keepAliveInterval) {
                    clearInterval(keepAliveInterval);
                }
                inFlightOptimizations.delete(cacheKey);
            }
        })();
        inFlightOptimizations.set(cacheKey, requestPromise);
        return requestPromise;
    }
    
    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+O or Cmd+Shift+O
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
                e.preventDefault();
                if (optimizeButton && !optimizeButton.disabled) {
                    optimizeButton.click();
                }
            }
        });
    }
    
    function deriveGmailStyle(tone) {
        if (tone === 'smart') return 'gmail-smart';
        if (tone === 'casual') return 'gmail-casual';
        if (tone === 'short') return 'gmail-short';
        return 'grammar';
    }
    
    function setupGmailAutoGrammar(settings) {
        let autoTimer = null;
        let autoBusy = false;
        const handler = () => {
            if (autoBusy) return;
            if (autoTimer) clearTimeout(autoTimer);
            autoTimer = setTimeout(async () => {
                try {
                    const text = getInputValue();
                    if (!text || text.length < 10) return;
                    autoBusy = true;
                    const style = deriveGmailStyle(settings.gmailTone);
                    const optimized = await optimizePrompt(text, { style, fastMode: settings.fastMode });
                    setInputValue(optimized);
                } catch (err) {
                } finally {
                    autoBusy = false;
                }
            }, 1500);
        };
        if (currentInput) {
            currentInput.addEventListener('input', handler);
        }
    }
    
    function deriveDocsStyle(tone) {
        if (tone === 'smart') return 'docs-smart';
        if (tone === 'casual') return 'docs-casual';
        if (tone === 'short') return 'docs-short';
        return 'grammar';
    }
    
    function setupDocsAutoGrammar(settings) {
        let autoTimer = null;
        let autoBusy = false;
        const handler = () => {
            if (autoBusy) return;
            if (autoTimer) clearTimeout(autoTimer);
            autoTimer = setTimeout(async () => {
                try {
                    const text = getInputValue();
                    if (!text || text.length < 10) return;
                    autoBusy = true;
                    const style = deriveDocsStyle(settings.docsTone);
                    const optimized = await optimizePrompt(text, { style, fastMode: settings.fastMode });
                    setInputValue(optimized);
                } catch (err) {
                } finally {
                    autoBusy = false;
                }
            }, 2000);
        };
        if (currentInput) {
            currentInput.addEventListener('input', handler);
        }
    }
    
    // Show notification to user
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `promptperfect-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Get optimization settings from storage
    async function getOptimizationSettings() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(['optimizationStyle', 'autoSend', 'abPreview', 'fourPanelPreview', 'fastMode', 'secondaryStyle', 'lintPrecheck', 'gmailAutoGrammar', 'gmailTone', 'docsAutoGrammar', 'docsTone', 'selectedModel'], (result) => {
                    if (chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    resolve({
                        style: result.optimizationStyle || 'default',
                        model: result.selectedModel || 'deepseek-chat',
                        autoSend: result.autoSend || false,
                        abPreview: !!result.abPreview,
                        fourPanelPreview: !!result.fourPanelPreview,
                        fastMode: result.fastMode !== undefined ? !!result.fastMode : true,
                        secondaryStyle: result.secondaryStyle || 'detailed',
                        lintPrecheck: !!result.lintPrecheck,
                        gmailAutoGrammar: !!result.gmailAutoGrammar,
                        gmailTone: result.gmailTone || 'none',
                        docsAutoGrammar: !!result.docsAutoGrammar,
                        docsTone: result.docsTone || 'none'
                    });
                });
            } catch (error) {
                if (error && error.message && error.message.includes('Extension context invalidated')) {
                    reject(new Error('Extension context invalidated'));
                } else {
                    reject(error);
                }
            }
        });
    }
    
    // Get API key from storage
    async function getApiKey() {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.local.get(['deepseekApiKey'], (result) => {
                    if (chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    resolve(result.deepseekApiKey);
                });
            } catch (error) {
                if (error && error.message && error.message.includes('Extension context invalidated')) {
                    reject(new Error('Extension context invalidated'));
                } else {
                    reject(error);
                }
            }
        });
    }
    
    // Save to history
    async function saveToHistory(original, optimized, style) {
        return new Promise((resolve) => {
            try {
                const entry = {
                    original,
                    optimized,
                    style,
                    timestamp: Date.now(),
                    platform: window.location.hostname
                };
                
                chrome.storage.local.get(['promptHistory'], (result) => {
                    if (chrome.runtime.lastError) {
                        return resolve();
                    }
                    const history = result.promptHistory || [];
                    history.unshift(entry);
                    
                    // No limit — user controls deletion manually
                    
                    chrome.storage.local.set({ promptHistory: history }, () => resolve());
                });
            } catch (error) {
                resolve(); // Fail silently for history save
            }
        });
    }
    
    // Auto-save optimized prompt as .txt file from content script
    function savePromptToFileExt(original, optimized, style, model) {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const filename = `MGEM-Optimizer_${dateStr}_${timeStr}.txt`;
        
        const styleLabels = {
            'speckit': 'SpecKit', 'default': 'Default', 'detailed': 'Detailed',
            'concise': 'Concise', 'examples': 'Examples', 'professional': 'Professional',
            'smart': 'Smart', 'grammar': 'Grammar'
        };
        
        const divider = '━'.repeat(56);
        const content = [
            `╔${divider}╗`,
            `║  MGEM'S OPIMIZER PRO — Optimized Prompt          ║`,
            `╚${divider}╝`, '',
            `${divider}`, '  ORIGINAL PROMPT', `${divider}`,
            original, '',
            `${divider}`, '  OPTIMIZED PROMPT', `${divider}`,
            optimized, '',
            `${divider}`, '  METADATA', `${divider}`,
            `  Style: ${styleLabels[style] || style}   Model: ${model}`,
            `  Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
            `${divider}`, '', `${divider}`
        ].join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        chrome.runtime.sendMessage({
            action: 'download-file',
            url: url,
            filename: filename
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    async function runABOptimization(originalPrompt, settings) {
        const styleA = settings.style || 'default';
        const styleB = settings.secondaryStyle || 'detailed';
        let keepAliveInterval;
        try {
            keepAliveInterval = setInterval(() => {
                try {
                    chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {});
                } catch (e) {}
            }, 20000);
            const [resA, resB] = await Promise.allSettled([
                optimizePrompt(originalPrompt, { style: styleA, fastMode: settings.fastMode, panelMode: 'ab' }),
                optimizePrompt(originalPrompt, { style: styleB, fastMode: settings.fastMode, panelMode: 'ab' })
            ]);
            const variantA = resA.status === 'fulfilled' ? resA.value : null;
            const variantB = resB.status === 'fulfilled' ? resB.value : null;
            showABOverlay({
                original: originalPrompt,
                variantA,
                variantB,
                styleA,
                styleB,
                autoSend: settings.autoSend
            });
        } catch (error) {
            if (error && error.message === 'API key not configured') {
                showNotification("⚠️ Please click the MGEM'S OPIMIZER PRO extension icon (✨) in your toolbar and enter your DeepSeek API key.", 'error');
            } else if (error && error.message && error.message.includes('Extension context invalidated')) {
                showNotification("⚠️ Extension was updated. Please refresh the page to continue using it.", 'error');
            } else {
                showNotification('Optimization failed: ' + (error ? error.message : 'Unknown error'), 'error');
            }
        } finally {
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
            }
        }
    }
    
    async function runFourPanelOptimization(originalPrompt, settings) {
        const styles = ['concise', 'smart', 'professional', 'detailed'];
        let keepAliveInterval;
        try {
            keepAliveInterval = setInterval(() => {
                try {
                    chrome.runtime.sendMessage({ action: 'ping' }).catch(() => {});
                } catch (e) {}
            }, 20000);
            const overlayState = showMultiPanelOverlay({
                original: originalPrompt,
                variants: styles.map((style) => ({ style, value: null })),
                autoSend: settings.autoSend
            });
            let completed = 0;
            await new Promise((resolve) => {
                styles.forEach((style) => {
                    optimizePrompt(originalPrompt, { style, fastMode: settings.fastMode, panelMode: 'four' })
                        .then((value) => {
                            updateMultiPanelCard(overlayState, style, value, null);
                        })
                        .catch((error) => {
                            updateMultiPanelCard(overlayState, style, null, error);
                        })
                        .finally(() => {
                            completed++;
                            if (overlayState && typeof overlayState.updateProgress === 'function') {
                                overlayState.updateProgress(completed, styles.length);
                            }
                            if (completed === styles.length) {
                                resolve();
                            }
                        });
                });
            });
        } catch (error) {
            if (error && error.message === 'API key not configured') {
                showNotification("⚠️ Please click the MGEM'S OPIMIZER PRO extension icon (✨) in your toolbar and enter your DeepSeek API key.", 'error');
            } else if (error && error.message && error.message.includes('Extension context invalidated')) {
                showNotification("⚠️ Extension was updated. Please refresh the page to continue using it.", 'error');
            } else {
                showNotification('Optimization failed: ' + (error ? error.message : 'Unknown error'), 'error');
            }
        } finally {
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
            }
        }
    }
    
    function showABOverlay(opts) {
        const existing = document.getElementById('promptperfect-ab-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'promptperfect-ab-overlay';
        const container = document.createElement('div');
        container.className = 'pp-ab-container';
        const header = document.createElement('div');
        header.className = 'pp-ab-header';
        const title = document.createElement('div');
        title.className = 'pp-ab-title';
        title.textContent = 'Choose Optimized Prompt';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'pp-ab-close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => overlay.remove());
        header.appendChild(title);
        header.appendChild(closeBtn);
        const body = document.createElement('div');
        body.className = 'pp-ab-body';
        const cardA = document.createElement('div');
        cardA.className = 'pp-ab-card';
        const labelA = document.createElement('div');
        labelA.className = 'pp-ab-label';
        labelA.textContent = opts.styleA;
        const textA = document.createElement('div');
        textA.className = 'pp-ab-text';
        textA.textContent = opts.variantA || 'Failed to generate';
        const actionsA = document.createElement('div');
        actionsA.className = 'pp-ab-actions';
        const insertA = document.createElement('button');
        insertA.className = 'pp-ab-insert';
        insertA.textContent = 'Insert';
        insertA.disabled = !opts.variantA;
        insertA.addEventListener('click', () => {
            if (!opts.variantA) return;
            setInputValue(opts.variantA);
            saveToHistory(opts.original, opts.variantA, opts.styleA);
            overlay.remove();
            if (opts.autoSend) {
                setTimeout(() => {
                    const sendButton = document.querySelector(currentPlatform.sendButtonSelector);
                    if (sendButton && !sendButton.disabled) {
                        sendButton.click();
                    }
                }, 100);
            }
        });
        const copyA = document.createElement('button');
        copyA.className = 'pp-ab-copy';
        copyA.textContent = 'Copy';
        copyA.addEventListener('click', () => {
            navigator.clipboard.writeText(opts.variantA || '').then(() => {
                showNotification('Copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Failed to copy to clipboard', 'error');
            });
        });
        actionsA.appendChild(insertA);
        actionsA.appendChild(copyA);
        cardA.appendChild(labelA);
        cardA.appendChild(textA);
        cardA.appendChild(actionsA);
        const cardB = document.createElement('div');
        cardB.className = 'pp-ab-card';
        const labelB = document.createElement('div');
        labelB.className = 'pp-ab-label';
        labelB.textContent = opts.styleB;
        const textB = document.createElement('div');
        textB.className = 'pp-ab-text';
        textB.textContent = opts.variantB || 'Failed to generate';
        const actionsB = document.createElement('div');
        actionsB.className = 'pp-ab-actions';
        const insertB = document.createElement('button');
        insertB.className = 'pp-ab-insert';
        insertB.textContent = 'Insert';
        insertB.disabled = !opts.variantB;
        insertB.addEventListener('click', () => {
            if (!opts.variantB) return;
            setInputValue(opts.variantB);
            saveToHistory(opts.original, opts.variantB, opts.styleB);
            overlay.remove();
            if (opts.autoSend) {
                setTimeout(() => {
                    const sendButton = document.querySelector(currentPlatform.sendButtonSelector);
                    if (sendButton && !sendButton.disabled) {
                        sendButton.click();
                    }
                }, 100);
            }
        });
        const copyB = document.createElement('button');
        copyB.className = 'pp-ab-copy';
        copyB.textContent = 'Copy';
        copyB.addEventListener('click', () => {
            navigator.clipboard.writeText(opts.variantB || '').then(() => {
                showNotification('Copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Failed to copy to clipboard', 'error');
            });
        });
        actionsB.appendChild(insertB);
        actionsB.appendChild(copyB);
        cardB.appendChild(labelB);
        cardB.appendChild(textB);
        cardB.appendChild(actionsB);
        body.appendChild(cardA);
        body.appendChild(cardB);
        const footer = document.createElement('div');
        footer.className = 'pp-ab-footer';
        const cancel = document.createElement('button');
        cancel.className = 'pp-ab-cancel';
        cancel.textContent = 'Cancel';
        cancel.addEventListener('click', () => overlay.remove());
        footer.appendChild(cancel);
        container.appendChild(header);
        container.appendChild(body);
        container.appendChild(footer);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        const keyHandler = (e) => {
            if (e.key === 'Escape') overlay.remove();
            if (e.key === '1' && !insertA.disabled) insertA.click();
            if (e.key === '2' && !insertB.disabled) insertB.click();
        };
        overlay.addEventListener('keydown', keyHandler);
        overlay.tabIndex = -1;
        overlay.focus();
    }
    
    function showMultiPanelOverlay(opts) {
        const existing = document.getElementById('promptperfect-ab-overlay');
        if (existing) existing.remove();

        const styleMeta = {
            concise: { title: 'Concise', description: 'Direct, focused, and easy to scan' },
            smart: { title: 'Smart', description: 'Analytical with deeper reasoning' },
            professional: { title: 'Professional', description: 'Polished and business-ready' },
            detailed: { title: 'Detailed', description: 'Comprehensive with clear constraints' }
        };
        const previouslyFocused = document.activeElement;
        const overlay = document.createElement('div');
        overlay.id = 'promptperfect-ab-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'pp-prompt-picker-title');

        const container = document.createElement('div');
        container.className = 'pp-ab-container pp-picker-container';
        const header = document.createElement('div');
        header.className = 'pp-ab-header';

        const heading = document.createElement('div');
        heading.className = 'pp-ab-heading';
        const eyebrow = document.createElement('div');
        eyebrow.className = 'pp-ab-eyebrow';
        eyebrow.textContent = 'MGEM Optimizer';
        const title = document.createElement('h2');
        title.id = 'pp-prompt-picker-title';
        title.className = 'pp-ab-title';
        title.textContent = 'Choose your best prompt';
        const subtitle = document.createElement('p');
        subtitle.className = 'pp-ab-subtitle';
        subtitle.textContent = 'Compare four optimized approaches, then insert the one that fits your goal.';
        heading.appendChild(eyebrow);
        heading.appendChild(title);
        heading.appendChild(subtitle);

        const headerActions = document.createElement('div');
        headerActions.className = 'pp-ab-header-actions';
        const progress = document.createElement('div');
        progress.className = 'pp-ab-progress';
        progress.setAttribute('role', 'status');
        progress.setAttribute('aria-live', 'polite');
        progress.textContent = '0 of 4 ready';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'pp-ab-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close prompt comparison');
        headerActions.appendChild(progress);
        headerActions.appendChild(closeBtn);
        header.appendChild(heading);
        header.appendChild(headerActions);

        const body = document.createElement('div');
        body.className = 'pp-ab-body pp-ab-body-4';
        const cards = {};

        const closeOverlay = () => {
            overlay.remove();
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        };
        closeBtn.addEventListener('click', closeOverlay);
        overlay.addEventListener('mousedown', (event) => {
            if (event.target === overlay) closeOverlay();
        });

        opts.variants.forEach((variant, index) => {
            const meta = styleMeta[variant.style] || {
                title: variant.style,
                description: 'Optimized prompt variation'
            };
            const card = document.createElement('article');
            card.className = 'pp-ab-card loading';
            card.dataset.style = variant.style;

            const cardHeader = document.createElement('div');
            cardHeader.className = 'pp-ab-card-header';
            const identity = document.createElement('div');
            identity.className = 'pp-ab-card-identity';
            const number = document.createElement('span');
            number.className = 'pp-ab-number';
            number.textContent = String(index + 1);
            const labelGroup = document.createElement('div');
            const label = document.createElement('h3');
            label.className = 'pp-ab-label';
            label.textContent = meta.title;
            const description = document.createElement('p');
            description.className = 'pp-ab-description';
            description.textContent = meta.description;
            labelGroup.appendChild(label);
            labelGroup.appendChild(description);
            identity.appendChild(number);
            identity.appendChild(labelGroup);
            const status = document.createElement('span');
            status.className = 'pp-ab-card-status';
            status.textContent = 'Generating';
            cardHeader.appendChild(identity);
            cardHeader.appendChild(status);

            const text = document.createElement('div');
            text.className = 'pp-ab-text';
            text.tabIndex = 0;
            text.setAttribute('role', 'document');
            text.setAttribute('aria-label', `${meta.title} optimized prompt`);
            text.textContent = variant.value || 'Generating your optimized prompt…';

            const metaRow = document.createElement('div');
            metaRow.className = 'pp-ab-meta';
            metaRow.textContent = 'Analyzing your idea…';

            const actions = document.createElement('div');
            actions.className = 'pp-ab-actions';
            const insertBtn = document.createElement('button');
            insertBtn.type = 'button';
            insertBtn.className = 'pp-ab-insert';
            insertBtn.textContent = 'Use this prompt';
            insertBtn.setAttribute('aria-label', `Use ${meta.title} prompt`);
            insertBtn.disabled = !variant.value;
            const state = { value: variant.value || null };
            insertBtn.addEventListener('click', () => {
                if (!state.value) return;
                if (!setInputValue(state.value)) {
                    showNotification('Could not update the chat box. Click inside it and try again.', 'error');
                    return;
                }
                saveToHistory(opts.original, state.value, variant.style);
                closeOverlay();
                if (opts.autoSend) {
                    setTimeout(() => {
                        const sendButton = document.querySelector(currentPlatform.sendButtonSelector);
                        if (sendButton && !sendButton.disabled) sendButton.click();
                    }, 100);
                }
            });

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'pp-ab-copy';
            copyBtn.textContent = 'Copy';
            copyBtn.setAttribute('aria-label', `Copy ${meta.title} prompt`);
            copyBtn.disabled = !variant.value;
            copyBtn.addEventListener('click', () => {
                if (!state.value) return;
                navigator.clipboard.writeText(state.value).then(() => {
                    copyBtn.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy';
                        copyBtn.classList.remove('copied');
                    }, 1400);
                }).catch(() => showNotification('Failed to copy to clipboard', 'error'));
            });

            actions.appendChild(insertBtn);
            actions.appendChild(copyBtn);
            card.appendChild(cardHeader);
            card.appendChild(text);
            card.appendChild(metaRow);
            card.appendChild(actions);
            body.appendChild(card);
            cards[variant.style] = { cardNode: card, textNode: text, statusNode: status, metaNode: metaRow, insertBtn, copyBtn, state };
        });

        const footer = document.createElement('div');
        footer.className = 'pp-ab-footer';
        const hint = document.createElement('div');
        hint.className = 'pp-ab-hint';
        hint.textContent = 'Tip: press 1–4 to insert instantly · Esc to close';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'pp-ab-cancel';
        cancel.textContent = 'Close';
        cancel.addEventListener('click', closeOverlay);
        footer.appendChild(hint);
        footer.appendChild(cancel);
        container.appendChild(header);
        container.appendChild(body);
        container.appendChild(footer);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        overlay.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeOverlay();
                return;
            }
            if (event.key === 'Tab') {
                const focusable = Array.from(overlay.querySelectorAll('button:not(:disabled), [tabindex="0"]'));
                if (focusable.length) {
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
                return;
            }
            if (event.target instanceof HTMLButtonElement) return;
            const index = Number(event.key) - 1;
            const variant = opts.variants[index];
            if (variant && cards[variant.style] && !cards[variant.style].insertBtn.disabled) {
                cards[variant.style].insertBtn.click();
            }
        });
        closeBtn.focus();

        let progressPulseTimeout = null;
        return {
            overlay,
            cards,
            updateProgress(done, total) {
                progress.textContent = `${done} of ${total} ready`;
                progress.classList.toggle('done', done >= total);
                progress.classList.remove('pulse');
                if (done >= total) {
                    void progress.offsetWidth;
                    progress.classList.add('pulse');
                    if (progressPulseTimeout) clearTimeout(progressPulseTimeout);
                    progressPulseTimeout = setTimeout(() => progress.classList.remove('pulse'), 600);
                }
            }
        };
    }

    function updateMultiPanelCard(overlayState, style, value, error) {
        if (!overlayState || !overlayState.cards || !overlayState.cards[style]) return;
        const card = overlayState.cards[style];
        card.cardNode.classList.remove('loading', 'ready', 'error');
        if (value) {
            const normalized = value.trim();
            const words = normalized ? normalized.split(/\s+/).length : 0;
            card.state.value = normalized;
            card.textNode.textContent = normalized;
            card.statusNode.textContent = 'Ready';
            card.metaNode.textContent = `${words} words · ${normalized.length} characters`;
            card.insertBtn.disabled = false;
            card.copyBtn.disabled = false;
            card.cardNode.classList.add('ready');
            return;
        }
        card.state.value = null;
        card.textNode.textContent = error && error.message ? error.message : 'This variation could not be generated.';
        card.statusNode.textContent = 'Failed';
        card.metaNode.textContent = 'Try optimizing again';
        card.insertBtn.disabled = true;
        card.copyBtn.disabled = true;
        card.cardNode.classList.add('error');
    }

    function computePromptLint(prompt) {
        const text = prompt.trim();
        const lengthScore = Math.min(1, text.length / 300);
        const hasConstraints = /limit|no more than|exactly|must|should|avoid|include|exclude|deadline|time|budget/i.test(text) ? 1 : 0;
        const hasOutputFormat = /json|markdown|table|bullets|steps|code block|schema|format/i.test(text) ? 1 : 0;
        const hasExamples = /example|e\.g\.|for instance|sample/i.test(text) ? 1 : 0;
        const hasContext = /context|background|goal|objective|audience|use case/i.test(text) ? 1 : 0;
        const clarityScore = Math.min(1, (hasConstraints + hasOutputFormat + hasExamples + hasContext) / 3);
        const score = Math.round(((lengthScore + clarityScore) / 2) * 100);
        const suggestions = [];
        if (!hasConstraints) suggestions.push('Add clear constraints (word count, must/avoid items, deadlines).');
        if (!hasOutputFormat) suggestions.push('Specify output format (JSON, markdown outline, numbered steps).');
        if (!hasExamples) suggestions.push('Include 1–2 concrete examples to guide responses.');
        if (!hasContext) suggestions.push('Add brief context: goal, audience, and intended use.');
        if (text.length < 80) suggestions.push('Provide more detail to reduce ambiguity.');
        return { score, suggestions };
    }
    
    function showLintOverlayAndWait(originalPrompt, settings) {
        return new Promise((resolve) => {
            const existing = document.getElementById('promptperfect-lint-overlay');
            if (existing) existing.remove();
            const lint = computePromptLint(originalPrompt);
            const overlay = document.createElement('div');
            overlay.id = 'promptperfect-lint-overlay';
            const container = document.createElement('div');
            container.className = 'pp-ab-container';
            const header = document.createElement('div');
            header.className = 'pp-ab-header';
            const title = document.createElement('div');
            title.className = 'pp-ab-title';
            title.textContent = `Prompt Quality Check • Score: ${lint.score}/100`;
            const closeBtn = document.createElement('button');
            closeBtn.className = 'pp-ab-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });
            header.appendChild(title);
            header.appendChild(closeBtn);
            const body = document.createElement('div');
            body.className = 'pp-ab-body';
            const card = document.createElement('div');
            card.className = 'pp-ab-card';
            const label = document.createElement('div');
            label.className = 'pp-ab-label';
            label.textContent = 'Suggestions';
            const text = document.createElement('div');
            text.className = 'pp-ab-text';
            text.textContent = lint.suggestions.length ? lint.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'Looks good!';
            const actions = document.createElement('div');
            actions.className = 'pp-ab-actions';
            const proceedBtn = document.createElement('button');
            proceedBtn.className = 'pp-ab-insert';
            proceedBtn.textContent = settings.fourPanelPreview ? 'Proceed (4 Panels)' : (settings.abPreview ? 'Proceed (A/B)' : 'Proceed');
            proceedBtn.addEventListener('click', () => {
                overlay.remove();
                resolve(true);
            });
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'pp-ab-cancel';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });
            actions.appendChild(proceedBtn);
            actions.appendChild(cancelBtn);
            card.appendChild(label);
            card.appendChild(text);
            card.appendChild(actions);
            body.appendChild(card);
            container.appendChild(header);
            container.appendChild(body);
            overlay.appendChild(container);
            document.body.appendChild(overlay);
            overlay.tabIndex = -1;
            overlay.focus();
        });
    }
    
    function handleOptimizeSelection(selectionText) {
        const selected = (selectionText || '').trim();
        if (!selected) {
            optimizeButton && optimizeButton.click();
            return;
        }
        getOptimizationSettings().then(async (settings) => {
            try {
                let textToUse = selected;
                if (settings.lintPrecheck) {
                    const proceed = await showLintOverlayAndWait(textToUse, settings);
                    if (!proceed) return;
                }
                if (settings.fourPanelPreview) {
                    await runFourPanelOptimization(textToUse, settings);
                } else if (settings.abPreview) {
                    await runABOptimization(textToUse, settings);
                } else {
                    const optimized = await optimizePrompt(textToUse, { style: settings.style, fastMode: settings.fastMode });
                    const sel = document.getSelection();
                    if (currentInput && currentInput.isContentEditable && sel && sel.rangeCount > 0) {
                        currentInput.focus();
                        try {
                            document.execCommand('insertText', false, optimized);
                        } catch (e) {
                            const range = sel.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(document.createTextNode(optimized));
                        }
                    } else {
                        setInputValue(optimized);
                    }
                    saveToHistory(textToUse, optimized, settings.style);
                }
            } catch (err) {
                if (err && err.message === 'API key not configured') {
                    console.warn('PromptPerfect: API key not configured');
                    showNotification("⚠️ Please click the MGEM'S OPIMIZER PRO extension icon (✨) in your toolbar and enter your DeepSeek API key.", 'error');
                } else if (err && err.message && err.message.includes('Extension context invalidated')) {
                    console.warn('PromptPerfect: Extension context invalidated');
                    showNotification("⚠️ Extension was updated. Please refresh the page to continue using it.", 'error');
                } else if (err && err.message && err.message.includes('timed out')) {
                    console.warn('PromptPerfect: Optimization timed out');
                    showNotification("⏳ Optimization timed out. Please try again.", 'error');
                } else {
                    console.warn('PromptPerfect: Optimization failed:', err ? err.message : 'Unknown error');
                    showNotification('Optimization failed: ' + (err ? err.message : 'Unknown error'), 'error');
                }
            }
        });
    }
    
    chrome.runtime.onMessage.addListener((request) => {
        if (request && request.action === 'optimize-selection') {
            handleOptimizeSelection(request.selectionText || '');
        }
    });
    
})();
