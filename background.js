/**
 * PromptPerfect Background Script
 * Handles keyboard shortcuts and cross-tab communication
 */

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'optimize-prompt') {
        // Send message to active tab to trigger optimization
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'optimize-prompt'
                });
            }
        });
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'get-settings':
            chrome.storage.local.get(['optimizationStyle', 'autoSend'], (result) => {
                sendResponse({
                    optimizationStyle: result.optimizationStyle || 'default',
                    autoSend: result.autoSend || false
                });
            });
            return true; // Keep message channel open for async response
            
        case 'save-to-history':
            saveToHistory(request.data);
            break;
            
        case 'test-api-key':
            testApiKey(request.apiKey)
                .then(response => sendResponse(response))
                .catch(error => sendResponse({ valid: false, error: error.message }));
            return true; // Keep message channel open for async response
            
        case 'optimize-prompt-api':
            optimizePromptAPI(request.prompt, request.settings)
                .then(response => sendResponse(response))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep message channel open for async response
            
        case 'ping':
            sendResponse({ status: 'alive' });
            return true;
            
        case 'download-file':
            chrome.downloads.download({
                url: request.url,
                filename: request.filename,
                saveAs: false,
                conflictAction: 'uniquify'
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.warn('Download failed:', chrome.runtime.lastError.message);
                }
            });
            sendResponse({ status: 'ok' });
            return true;
            
        default:
            console.log('Unknown action:', request.action);
    }
});

// Test API key validity
async function testApiKey(apiKey) {
    try {
        const response = await fetch('https://api.deepseek.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        return {
            valid: response.ok,
            status: response.status
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

// Provider config (mirrors popup.js)
const PROVIDER_CONFIG = {
    'deepseek-chat':       { endpoint: 'https://api.deepseek.com/v1/chat/completions',         keyStorageKey: 'deepseekApiKey',   isGemini: false },
    'deepseek-reasoner':   { endpoint: 'https://api.deepseek.com/v1/chat/completions',         keyStorageKey: 'deepseekApiKey',   isGemini: false },
    'gpt-4o':              { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',     isGemini: false },
    'gpt-4o-mini':         { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',     isGemini: false },
    'gpt-4-turbo':         { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',     isGemini: false },
    'o1':                  { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',     isGemini: false },
    'o1-mini':             { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',     isGemini: false },
    'gpt-3.5-turbo':       { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',     isGemini: false },
    'gemini-2.0-flash':    { endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',  keyStorageKey: 'geminiApiKey', isGemini: true },
    'gemini-2.0-pro':      { endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent',    keyStorageKey: 'geminiApiKey', isGemini: true },
    'gemini-1.5-pro':      { endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',    keyStorageKey: 'geminiApiKey', isGemini: true },
    'gemini-1.5-flash':    { endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',  keyStorageKey: 'geminiApiKey', isGemini: true },
    'nvidia/llama-3.1-nemotron-70b-instruct':  { endpoint: 'https://api.nvidia.com/v1/chat/completions',       keyStorageKey: 'nvidiaApiKey', isGemini: false },
    'nvidia/llama-3.1-nemotron-ultra-253b-v1': { endpoint: 'https://api.nvidia.com/v1/chat/completions',       keyStorageKey: 'nvidiaApiKey', isGemini: false },
    'nvidia/mistral-nemo-12b-instruct':         { endpoint: 'https://api.nvidia.com/v1/chat/completions',       keyStorageKey: 'nvidiaApiKey', isGemini: false },
    'nvidia/deepseek-r1-671b':                  { endpoint: 'https://api.nvidia.com/v1/chat/completions',       keyStorageKey: 'nvidiaApiKey', isGemini: false },
    'moonshot-v1-8k':      { endpoint: 'https://api.moonshot.cn/v1/chat/completions',           keyStorageKey: 'moonshotApiKey',  isGemini: false },
    'moonshot-v1-32k':     { endpoint: 'https://api.moonshot.cn/v1/chat/completions',           keyStorageKey: 'moonshotApiKey',  isGemini: false },
    'moonshot-v1-128k':    { endpoint: 'https://api.moonshot.cn/v1/chat/completions',           keyStorageKey: 'moonshotApiKey',  isGemini: false }
};

function getProviderConfig(model) {
    return PROVIDER_CONFIG[model] || PROVIDER_CONFIG['deepseek-chat'];
}

// Perform optimization API call
async function optimizePromptAPI(prompt, settings) {
    try {
        const model = settings && settings.model ? settings.model : 'deepseek-chat';
        const cfg = getProviderConfig(model);
        
        const result = await chrome.storage.local.get([cfg.keyStorageKey]);
        const apiKey = result[cfg.keyStorageKey];
        console.log("Background: model=" + model + " key=" + (apiKey ? "exists" : "missing"));
        
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
            return { success: false, error: 'API key not configured' };
        }

        const style = settings && settings.style ? settings.style : 'default';
        const optimizationInstruction = getOptimizationInstruction(style);
        const isFastMode = settings && settings.fastMode !== undefined ? !!settings.fastMode : true;
        const panelMode = settings && settings.panelMode ? settings.panelMode : '';
        let maxTokens = isFastMode ? 320 : 1000;
        if (style === 'detailed') { maxTokens = isFastMode ? 420 : 1000; }
        if (style === 'speckit') { maxTokens = isFastMode ? 900 : 1600; }
        if (panelMode === 'ab') { maxTokens = isFastMode ? 280 : 700; }
        if (panelMode === 'four') { maxTokens = isFastMode ? 240 : 520; }
        const userContent = style === 'speckit' ? `Original Prompt:\n${prompt}` : prompt;
        
        if (cfg.isGemini) {
            // Gemini uses ?key= query param and different JSON structure
            const url = cfg.endpoint + '?key=' + encodeURIComponent(apiKey);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: (style === 'speckit')
                                ? `${optimizationInstruction}\n\nOriginal Prompt:\n${prompt}`
                                : `${optimizationInstruction}\n\n${prompt}`
                        }]
                    }],
                    generationConfig: {
                        temperature: isFastMode ? 0.5 : 0.7,
                        maxOutputTokens: maxTokens
                    }
                })
            });
            
            if (!response.ok) {
                const errBody = await response.text().catch(() => '');
                return { success: false, error: `Gemini API error: ${response.status} ${errBody}` };
            }
            
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!text) {
                return { success: false, error: 'Gemini returned empty response' };
            }
            return { success: true, optimizedPrompt: text };
        } else {
            // OpenAI-compatible (DeepSeek, OpenAI, NVIDIA, Moonshot/Kimi)
            const response = await fetch(cfg.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: optimizationInstruction },
                        { role: 'user', content: userContent }
                    ],
                    temperature: isFastMode ? 0.5 : 0.7,
                    max_tokens: maxTokens
                })
            });
            
            if (!response.ok) {
                return { success: false, error: `API error: ${response.status}` };
            }
            
            const data = await response.json();
            return { success: true, optimizedPrompt: data.choices[0].message.content };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get optimization instruction based on style
function getOptimizationInstruction(style) {
    const basePromptEngineering = "You are an expert prompt engineer. Your goal is to rewrite the user's input into a highly effective prompt following advanced prompt engineering principles (e.g., clarity, context, constraints, persona definition, formatting). Do NOT answer the prompt; ONLY output the optimized prompt itself.";
    
    const instructions = {
        'speckit': `You are a Prompt Optimization Expert with 10 years of experience in AI prompt architecture, prompt engineering, and human-AI interaction design. Your role is to take an initial user-provided prompt and produce a revised, optimized prompt that yields more accurate, reliable, and efficient outputs from large language models. Follow these rules and output formats exactly.

Role and purpose
- Act as an expert consultant who improves prompts for clarity, constraint, and model alignment.
- Prioritize reducing ambiguity, minimizing model hallucination risk, enforcing output format, and specifying evaluation criteria.

Inputs you will receive
- "Original Prompt": the user’s current prompt text.
- Optional context fields: "Target Model" (e.g., gpt-4o, gpt-4, Claude-2), "Desired Tone" (e.g., formal, friendly), "Max Tokens", "Primary Objective" (e.g., summarization, code generation), "Strict Constraints" (e.g., do not invent dates), and "Examples" (sample input-output pairs).

What you must produce (structured output—use exact headings)
Header: "Optimized Prompt" — a single, self-contained prompt ready to paste into the target model. It must:
- Start with a clear role instruction (what the model should pretend to be).
- State the specific task, input and expected output, with strict format constraints.
- Include explicit content constraints (e.g., sources, citation style, banned behaviors).
- Provide examples: one positive example of input→output and one negative example that shows an incorrect/undesired response.
- Specify evaluation criteria and acceptance tests (3 concise bullet points).
- If a Target Model is provided, tailor token/verbosity guidance accordingly.

Header: "Rationale" — 3–6 brief bullet points explaining each optimization change you made (e.g., clarified ambiguity, tightened output format, added edge-case handling).

Header: "Alternative Variants" — provide 3 concise variant prompts (labeled Variant A, Variant B, Variant C). Each variant should be 1–2 sentences long and target a different tradeoff: highest-precision, fastest-response, and creative/looser output.

Constraints and style rules for your output
- Keep the "Optimized Prompt" under 320 words whenever possible; the whole response can be longer but keep each section compact and scannable.
- Use numbered or bulleted lists for structure—no long paragraphs.
- Do not hallucinate external data or claim specific proprietary model internals.
- Maintain neutral professional tone.
- When examples are used, do not invent factual claims beyond illustrative placeholders (use [INPUT], [OUTPUT] placeholders where appropriate).

Process to follow when given an Original Prompt
- Identify ambiguous terms and replace them with concrete specs.
- Add explicit input/output schema, examples, and evaluation checks.
- Flag potential safety or ethical concerns and add mitigation instructions.
- Return the three-section structured output described above.`,
        'detailed': `${basePromptEngineering} Rewrite the prompt to be comprehensive. Explicitly define the AI's role, provide necessary context, break complex tasks into step-by-step instructions, define strict constraints, and specify the exact desired output format (using Markdown).`,
        'concise': `${basePromptEngineering} Rewrite the prompt to be extremely concise and high-density. Remove all fluff and conversational filler. State the exact task, necessary context, and constraints clearly using precise language.`,
        'examples': `${basePromptEngineering} Rewrite the prompt to include clear few-shot examples. Structure the prompt to demonstrate the desired input-output pattern, clarifying the exact behavior expected from the AI.`,
        'professional': `${basePromptEngineering} Rewrite the prompt using formal, professional language. Structure it as a clear business or academic directive, specifying the tone and expertise level expected in the response.`,
        'smart': `${basePromptEngineering} Rewrite the prompt to elicit high-quality reasoning. Require the AI to think step-by-step (Chain of Thought), consider edge cases, and provide a logical, highly analytical response.`,
        'grammar': 'Correct grammar, spelling, and punctuation while preserving the original meaning. Do not add new content. Output only the corrected text.',
        'gmail-smart': 'For an email, correct grammar and rewrite to sound smart, professional, clear, and confident. Keep it concise. Output only the email text.',
        'gmail-casual': 'For an email, correct grammar and rewrite to sound casual, friendly, and approachable. Keep it concise. Output only the email text.',
        'gmail-short': 'For an email, correct grammar and rewrite to a very short version that preserves key points. Output only the email text.',
        'docs-smart': 'For a document, correct grammar and rewrite to a smart, professional tone with clear, concise phrasing. Output only the document text.',
        'docs-casual': 'For a document, correct grammar and rewrite to a casual, friendly tone while remaining clear. Output only the document text.',
        'docs-short': 'For a document, correct grammar and compress to a very concise version that preserves key points. Output only the document text.',
        'default': `${basePromptEngineering} Optimize the prompt by making it crystal clear, specific, and well-structured. Add necessary constraints and define the expected output format for optimal AI performance.`
    };
    
    return instructions[style] || instructions['default'];
}

// Save optimization to history (unlimited — never auto-deletes)
function saveToHistory(data) {
    const entry = {
        original: data.original,
        optimized: data.optimized,
        style: data.style,
        timestamp: Date.now(),
        platform: data.platform
    };
    
    chrome.storage.local.get(['promptHistory'], (result) => {
        const history = result.promptHistory || [];
        history.unshift(entry);
        // No limit — user controls deletion manually
        chrome.storage.local.set({ promptHistory: history });
    });
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.local.set({
            optimizationStyle: 'speckit',
            autoSend: false,
            promptHistory: []
        });
        
        // Open welcome page or show notification (removed for now)
        // chrome.tabs.create({
        //     url: chrome.runtime.getURL('welcome.html')
        // });
    }
});

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const url = new URL(tab.url);
        
        // Check if we're on a supported platform
        if (url.hostname === 'chat.deepseek.com' || 
            url.hostname === 'grok.com' || 
            url.hostname === 'claude.ai' || 
            url.hostname === 'gemini.google.com' ||
            url.hostname === 'chatgpt.com' ||
            url.hostname === 'mail.google.com' ||
            url.hostname === 'docs.google.com') {
            // Content script should be injected automatically via manifest
            // But we can send a message to ensure it's active
            chrome.tabs.sendMessage(tabId, {
                action: 'ping'
            }).catch(() => {
                // Content script not loaded, it will be injected on next page load
                console.log('Content script not ready for', url.hostname);
            });
        }
    }
});

// Context menu for quick access (optional)
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'optimize-prompt',
        title: "Optimize with MGEM'S OPIMIZER PRO",
        contexts: ['editable'],
        documentUrlPatterns: [
            'https://chat.deepseek.com/*',
            'https://grok.com/*',
            'https://claude.ai/*',
            'https://gemini.google.com/*',
            'https://chatgpt.com/*'
        ]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'optimize-prompt') {
        chrome.tabs.sendMessage(tab.id, {
            action: 'optimize-selection',
            selectionText: info.selectionText
        });
    }
});
