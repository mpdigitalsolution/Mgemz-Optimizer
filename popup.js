/**
 * PromptPerfect Popup Script
 * Handles settings, API key management, and history
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const apiKeyInput = document.getElementById('apiKey');
    const toggleApiKey = document.getElementById('toggleApiKey');
    const apiStatus = document.getElementById('apiStatus');
    const apiStatusIndicator = document.getElementById('apiStatusIndicator');
    const apiStatusText = document.getElementById('apiStatusText');
    const optimizationStyle = document.getElementById('optimizationStyle');
    const autoSend = document.getElementById('autoSend');
    const saveSettings = document.getElementById('saveSettings');
    const clearHistory = document.getElementById('clearHistory');
    const viewFullHistory = document.getElementById('viewFullHistory');
    const historyList = document.getElementById('historyList');
    const aboutLink = document.getElementById('aboutLink');
    const helpLink = document.getElementById('helpLink');
    const aboutModal = document.getElementById('aboutModal');
    const helpModal = document.getElementById('helpModal');
    const closeAbout = document.getElementById('closeAbout');
    const closeHelp = document.getElementById('closeHelp');
    
    // Optimize Section Elements
    const optimizeInput = document.getElementById('optimizeInput');
    const optimizeStyleSelect = document.getElementById('optimizeStyle');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const optimizeResult = document.getElementById('optimizeResult');
    const optimizeResultText = document.getElementById('optimizeResultText');
    let selectedPopupResult = '';
    const optimizeLoading = document.getElementById('optimizeLoading');
    const copyOptimizedBtn = document.getElementById('copyOptimizedBtn');
    
    // Model/Provider Select
    const aiModelSelect = document.getElementById('aiModelSelect');
    const apiKeyHelpText = document.getElementById('apiKeyHelpText');
    
    // Provider configuration map: model -> { endpoint, keyStorageKey, keyLink, keyLabel, isGemini }
    const PROVIDER_CONFIG = {
        'deepseek-chat':       { endpoint: 'https://api.deepseek.com/v1/chat/completions',         keyStorageKey: 'deepseekApiKey',       keyLink: 'https://platform.deepseek.com/api-keys',       keyLabel: 'DeepSeek API Key',       isGemini: false },
        'deepseek-reasoner':   { endpoint: 'https://api.deepseek.com/v1/chat/completions',         keyStorageKey: 'deepseekApiKey',       keyLink: 'https://platform.deepseek.com/api-keys',       keyLabel: 'DeepSeek API Key',       isGemini: false },
        'gpt-4o':              { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',         keyLink: 'https://platform.openai.com/api-keys',         keyLabel: 'OpenAI API Key',         isGemini: false },
        'gpt-4o-mini':         { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',         keyLink: 'https://platform.openai.com/api-keys',         keyLabel: 'OpenAI API Key',         isGemini: false },
        'gpt-4-turbo':         { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',         keyLink: 'https://platform.openai.com/api-keys',         keyLabel: 'OpenAI API Key',         isGemini: false },
        'o1':                  { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',         keyLink: 'https://platform.openai.com/api-keys',         keyLabel: 'OpenAI API Key',         isGemini: false },
        'o1-mini':             { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',         keyLink: 'https://platform.openai.com/api-keys',         keyLabel: 'OpenAI API Key',         isGemini: false },
        'gpt-3.5-turbo':       { endpoint: 'https://api.openai.com/v1/chat/completions',           keyStorageKey: 'openaiApiKey',         keyLink: 'https://platform.openai.com/api-keys',         keyLabel: 'OpenAI API Key',         isGemini: false },
        'gemini-2.0-flash':    { endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', keyStorageKey: 'geminiApiKey', keyLink: 'https://aistudio.google.com/app/apikey', keyLabel: 'Gemini API Key', isGemini: true },
        'gemini-2.0-pro':      { endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent',   keyStorageKey: 'geminiApiKey',       keyLink: 'https://aistudio.google.com/app/apikey',       keyLabel: 'Gemini API Key',         isGemini: true },
        'gemini-1.5-pro':      { endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',   keyStorageKey: 'geminiApiKey',       keyLink: 'https://aistudio.google.com/app/apikey',       keyLabel: 'Gemini API Key',         isGemini: true },
        'gemini-1.5-flash':    { endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', keyStorageKey: 'geminiApiKey',       keyLink: 'https://aistudio.google.com/app/apikey',       keyLabel: 'Gemini API Key',         isGemini: true },
        'nvidia/llama-3.1-nemotron-70b-instruct':  { endpoint: 'https://api.nvidia.com/v1/chat/completions',       keyStorageKey: 'nvidiaApiKey',  keyLink: 'https://build.nvidia.com/explore/discover', keyLabel: 'NVIDIA API Key', isGemini: false },
        'nvidia/llama-3.1-nemotron-ultra-253b-v1': { endpoint: 'https://api.nvidia.com/v1/chat/completions',       keyStorageKey: 'nvidiaApiKey',  keyLink: 'https://build.nvidia.com/explore/discover', keyLabel: 'NVIDIA API Key', isGemini: false },
        'nvidia/mistral-nemo-12b-instruct':         { endpoint: 'https://api.nvidia.com/v1/chat/completions',       keyStorageKey: 'nvidiaApiKey',  keyLink: 'https://build.nvidia.com/explore/discover', keyLabel: 'NVIDIA API Key', isGemini: false },
        'nvidia/deepseek-r1-671b':                  { endpoint: 'https://api.nvidia.com/v1/chat/completions',       keyStorageKey: 'nvidiaApiKey',  keyLink: 'https://build.nvidia.com/explore/discover', keyLabel: 'NVIDIA API Key', isGemini: false },
        'moonshot-v1-8k':      { endpoint: 'https://api.moonshot.cn/v1/chat/completions',           keyStorageKey: 'moonshotApiKey',      keyLink: 'https://platform.moonshot.cn/console/api-keys', keyLabel: 'Kimi (Moonshot) API Key', isGemini: false },
        'moonshot-v1-32k':     { endpoint: 'https://api.moonshot.cn/v1/chat/completions',           keyStorageKey: 'moonshotApiKey',      keyLink: 'https://platform.moonshot.cn/console/api-keys', keyLabel: 'Kimi (Moonshot) API Key', isGemini: false },
        'moonshot-v1-128k':    { endpoint: 'https://api.moonshot.cn/v1/chat/completions',           keyStorageKey: 'moonshotApiKey',      keyLink: 'https://platform.moonshot.cn/console/api-keys', keyLabel: 'Kimi (Moonshot) API Key', isGemini: false }
    };
    
    function getProviderConfig(model) {
        return PROVIDER_CONFIG[model] || PROVIDER_CONFIG['deepseek-chat'];
    }
    
    function updateApiKeyForModel() {
        const model = aiModelSelect.value;
        const cfg = getProviderConfig(model);
        document.querySelector('#apiKeyGroup label').textContent = cfg.keyLabel;
        apiKeyInput.placeholder = 'Enter your ' + cfg.keyLabel;
        apiKeyHelpText.innerHTML = '<a href="' + cfg.keyLink + '" target="_blank">Get your ' + cfg.keyLabel + ' here</a>';
        // Load the saved key for this provider
        const allKeys = {};
        const allKeyNames = [...new Set(Object.values(PROVIDER_CONFIG).map(c => c.keyStorageKey))];
        allKeyNames.forEach(k => { allKeys[k] = ''; });
        chrome.storage.local.get(allKeyNames, (result) => {
            apiKeyInput.value = result[cfg.keyStorageKey] || '';
            testApiKey();
        });
    }
    
    // Delete saved API key for current provider
    function handleDeleteApiKey() {
        const cfg = getProviderConfig(aiModelSelect.value);
        if (!apiKeyInput.value.trim()) {
            showNotification('No API key to delete', 'info');
            return;
        }
        if (!confirm('Delete the saved ' + cfg.keyLabel + '?')) return;
        
        chrome.storage.local.remove(cfg.keyStorageKey, () => {
            apiKeyInput.value = '';
            updateApiStatus('not_configured', 'Not configured');
            showNotification(cfg.keyLabel + ' deleted', 'success');
        });
    }
    
    // Initialize popup
    initializePopup();
    
    // Event Listeners
    toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
    saveSettings.addEventListener('click', saveSettingsHandler);
    clearHistory.addEventListener('click', clearHistoryHandler);
    viewFullHistory.addEventListener('click', viewFullHistoryHandler);
    aboutLink.addEventListener('click', () => showModal('aboutModal'));
    helpLink.addEventListener('click', () => showModal('helpModal'));
    closeAbout.addEventListener('click', () => hideModal('aboutModal'));
    closeHelp.addEventListener('click', () => hideModal('helpModal'));
    
    // Optimize section events
    optimizeInput.addEventListener('input', updateOptimizeBtnState);
    optimizeBtn.addEventListener('click', handlePopupOptimize);
    copyOptimizedBtn.addEventListener('click', copyOptimizedResult);
    
    // Model select event
    aiModelSelect.addEventListener('change', updateApiKeyForModel);
    
    // API Key input events
    apiKeyInput.addEventListener('input', debounce(testApiKey, 1000));
    
    // Delete API key button
    const deleteApiKeyBtn = document.getElementById('deleteApiKey');
    deleteApiKeyBtn.addEventListener('click', handleDeleteApiKey);
    
    // Initialize popup
    function initializePopup() {
        loadSettings();
        loadHistory();
        testApiKey();
    }
    
    // Load settings from storage
    function loadSettings() {
        const allKeyNames = [...new Set(Object.values(PROVIDER_CONFIG).map(c => c.keyStorageKey))];
        const storageKeys = ['selectedModel', 'optimizationStyle', 'autoSend', 'abPreview', 'fourPanelPreview', 'fastMode', 'secondaryStyle', 'lintPrecheck', 'gmailAutoGrammar', 'gmailTone', 'docsAutoGrammar', 'docsTone'].concat(allKeyNames);
        chrome.storage.local.get(storageKeys, function(result) {
            // Restore selected model
            if (result.selectedModel && PROVIDER_CONFIG[result.selectedModel]) {
                aiModelSelect.value = result.selectedModel;
            }
            // Update API key UI for current model
            const cfg = getProviderConfig(aiModelSelect.value);
            document.querySelector('#apiKeyGroup label').textContent = cfg.keyLabel;
            apiKeyInput.placeholder = 'Enter your ' + cfg.keyLabel;
            apiKeyHelpText.innerHTML = '<a href="' + cfg.keyLink + '" target="_blank">Get your ' + cfg.keyLabel + ' here</a>';
            if (result[cfg.keyStorageKey]) {
                apiKeyInput.value = result[cfg.keyStorageKey];
                apiKeyInput.type = 'password';
            }
            
            if (result.optimizationStyle) {
                optimizationStyle.value = result.optimizationStyle;
            }
            
            if (result.autoSend !== undefined) {
                autoSend.checked = result.autoSend;
            }
            
            const abPreview = document.getElementById('abPreview');
            const fourPanelPreview = document.getElementById('fourPanelPreview');
            const fastMode = document.getElementById('fastMode');
            const secondaryStyle = document.getElementById('secondaryStyle');
            const lintPrecheck = document.getElementById('lintPrecheck');
            const gmailAutoGrammar = document.getElementById('gmailAutoGrammar');
            const gmailTone = document.getElementById('gmailTone');
            const docsAutoGrammar = document.getElementById('docsAutoGrammar');
            const docsTone = document.getElementById('docsTone');
            if (abPreview) {
                abPreview.checked = !!result.abPreview;
            }
            if (fourPanelPreview) {
                fourPanelPreview.checked = !!result.fourPanelPreview;
            }
            if (fastMode) {
                fastMode.checked = result.fastMode !== undefined ? !!result.fastMode : true;
            }
            if (secondaryStyle && result.secondaryStyle) {
                secondaryStyle.value = result.secondaryStyle;
            }
            if (lintPrecheck) {
                lintPrecheck.checked = !!result.lintPrecheck;
            }
            if (gmailAutoGrammar) {
                gmailAutoGrammar.checked = !!result.gmailAutoGrammar;
            }
            if (gmailTone && result.gmailTone) {
                gmailTone.value = result.gmailTone;
            }
            if (docsAutoGrammar) {
                docsAutoGrammar.checked = !!result.docsAutoGrammar;
            }
            if (docsTone && result.docsTone) {
                docsTone.value = result.docsTone;
            }
        });
    }
    
    // Load history from storage
    function loadHistory() {
        chrome.storage.local.get(['promptHistory'], function(result) {
            const history = result.promptHistory || [];
            displayHistory(history.slice(0, 5)); // Show last 5 items
        });
    }
    
    // Display history items
    function displayHistory(items) {
        if (items.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No optimization history yet</div>';
            return;
        }
        
        const historyHTML = items.map(item => `
            <div class="history-item" data-timestamp="${item.timestamp}">
                <div class="history-item-header">
                    <span class="history-item-style">${item.style}</span>
                    <span class="history-item-time">${formatTime(item.timestamp)}</span>
                </div>
                <div class="history-item-preview">${escapeHtml(item.original.substring(0, 50))}...</div>
            </div>
        `).join('');
        
        historyList.innerHTML = historyHTML;
        
        // Add click handlers to history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', function() {
                const timestamp = parseInt(this.dataset.timestamp);
                showHistoryItem(timestamp);
            });
        });
    }
    
    // Show individual history item
    function showHistoryItem(timestamp) {
        chrome.storage.local.get(['promptHistory'], function(result) {
            const history = result.promptHistory || [];
            const item = history.find(h => h.timestamp === timestamp);
            
            if (item) {
                // Create a detailed view
                const modal = document.createElement('div');
                modal.className = 'history-modal';
                modal.innerHTML = `
                    <div class="history-modal-content">
                        <div class="history-modal-header">
                            <h3>Optimization History</h3>
                            <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                        </div>
                        <div class="history-modal-body">
                            <div class="history-section">
                                <h4>Original Prompt</h4>
                                <div class="history-text">${escapeHtml(item.original)}</div>
                            </div>
                            <div class="history-section">
                                <h4>Optimized Prompt</h4>
                                <div class="history-text">${escapeHtml(item.optimized)}</div>
                            </div>
                            <div class="history-meta">
                                <span>Style: ${item.style}</span>
                                <span>Platform: ${item.platform}</span>
                                <span>Time: ${new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="history-modal-footer">
                            <button class="btn btn-secondary" onclick="this.closest('.history-modal').remove()">Close</button>
                            <button class="btn btn-primary" onclick="copyToClipboard('${escapeHtml(item.optimized)}')">Copy Optimized</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
            }
        });
    }
    
    // Test API key validity
    async function testApiKey() {
        const apiKey = apiKeyInput.value.trim();
        const model = aiModelSelect.value;
        const cfg = getProviderConfig(model);
        
        if (!apiKey) {
            updateApiStatus('not_configured', 'Not configured');
            return;
        }
        
        updateApiStatus('testing', 'Testing...');
        
        try {
            let response;
            if (cfg.isGemini) {
                // Gemini uses ?key= query param
                const testUrl = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(apiKey);
                response = await fetch(testUrl, { method: 'GET' });
            } else {
                // OpenAI-compatible: derive test endpoint from chat endpoint
                const baseUrl = cfg.endpoint.substring(0, cfg.endpoint.indexOf('/v1/') + 4);
                response = await fetch(baseUrl + 'models', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
            }
            
            if (response.ok) {
                updateApiStatus('configured', 'API key valid');
            } else {
                updateApiStatus('invalid', 'Invalid API key');
            }
        } catch (error) {
            updateApiStatus('error', 'Connection error');
        }
    }
    
    // Update API status UI
    function updateApiStatus(status, text) {
        apiStatusIndicator.className = `status-indicator ${status}`;
        apiStatusText.textContent = text;
    }
    
    // Toggle API key visibility
    function toggleApiKeyVisibility() {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleApiKey.textContent = '🙈';
            toggleApiKey.title = 'Hide API key';
        } else {
            apiKeyInput.type = 'password';
            toggleApiKey.textContent = '👁️';
            toggleApiKey.title = 'Show API key';
        }
    }
    
    // Save settings
    function saveSettingsHandler() {
        const cfg = getProviderConfig(aiModelSelect.value);
        const settings = {
            selectedModel: aiModelSelect.value,
            [cfg.keyStorageKey]: apiKeyInput.value.trim(),
            optimizationStyle: optimizationStyle.value,
            autoSend: autoSend.checked,
            abPreview: document.getElementById('abPreview').checked,
            fourPanelPreview: document.getElementById('fourPanelPreview').checked,
            fastMode: document.getElementById('fastMode').checked,
            secondaryStyle: document.getElementById('secondaryStyle').value,
            lintPrecheck: document.getElementById('lintPrecheck').checked,
            gmailAutoGrammar: document.getElementById('gmailAutoGrammar').checked,
            gmailTone: document.getElementById('gmailTone').value,
            docsAutoGrammar: document.getElementById('docsAutoGrammar').checked,
            docsTone: document.getElementById('docsTone').value
        };
        
        chrome.storage.local.set(settings, function() {
            showNotification('Settings saved successfully!', 'success');
            if (settings.deepseekApiKey) {
                testApiKey();
            }
        });
    }
    
    // Clear history
    function clearHistoryHandler() {
        if (confirm('Are you sure you want to clear all optimization history? This cannot be undone.')) {
            chrome.storage.local.set({ promptHistory: [] }, function() {
                loadHistory();
                showNotification('History cleared successfully', 'success');
            });
        }
    }
    
    // View full history
    function viewFullHistoryHandler() {
        chrome.storage.local.get(['promptHistory'], function(result) {
            const history = result.promptHistory || [];
            
            if (history.length === 0) {
                showNotification('No history to display', 'info');
                return;
            }
            
            // Open full history in new tab
            const historyHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>PromptPerfect - Full History</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; }
                        .history-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
                        .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                        .history-style { background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
                        .history-time { color: #6b7280; font-size: 12px; }
                        .history-text { background: #f9fafb; padding: 8px; border-radius: 4px; margin: 8px 0; font-family: monospace; font-size: 12px; }
                        .history-meta { display: flex; gap: 16px; font-size: 12px; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <h1>PromptPerfect - Optimization History</h1>
                    <p>Total entries: ${history.length}</p>
                    ${history.map(item => `
                        <div class="history-item">
                            <div class="history-header">
                                <span class="history-style">${item.style}</span>
                                <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                            <div><strong>Original:</strong></div>
                            <div class="history-text">${escapeHtml(item.original)}</div>
                            <div><strong>Optimized:</strong></div>
                            <div class="history-text">${escapeHtml(item.optimized)}</div>
                            <div class="history-meta">
                                <span>Platform: ${item.platform}</span>
                                <span>Style: ${item.style}</span>
                            </div>
                        </div>
                    `).join('')}
                </body>
                </html>
            `;
            
            const blob = new Blob([historyHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        });
    }
    
    // Show modal
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    // Hide modal
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Utility functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(timestamp).toLocaleDateString();
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy to clipboard', 'error');
        });
    }
    
    // --- Optimize Section ---
    
    function updateOptimizeBtnState() {
        const val = optimizeInput.value.trim();
        optimizeBtn.disabled = !val;
    }
    
    async function handlePopupOptimize() {
        const prompt = optimizeInput.value.trim();
        if (!prompt) return;
        
        const model = aiModelSelect.value;
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showNotification('Please configure your DeepSeek API key first', 'error');
            return;
        }
        
        // Show loading
        optimizeResult.style.display = 'none';
        optimizeLoading.style.display = 'flex';
        optimizeBtn.disabled = true;
        optimizeBtn.textContent = '⏳';
        
        try {
            const styles = ['concise', 'smart', 'professional', 'detailed'];
            const responses = await Promise.all(styles.map((style) =>
                chrome.runtime.sendMessage({
                    action: 'optimize-prompt-api',
                    prompt,
                    settings: { style, model, fastMode: true, panelMode: 'four' }
                })
            ));
            const variants = styles.map((style, index) => ({
                style,
                value: responses[index]?.success ? responses[index].optimizedPrompt : null,
                error: responses[index]?.error
            }));
            const successful = variants.filter((variant) => variant.value);

            if (successful.length) {
                selectedPopupResult = successful[0].value;
                renderPopupVariants(variants, prompt, model);
                optimizeResult.style.display = 'block';
                showNotification(`${successful.length} prompt choices ready!`, 'success');
            } else {
                showNotification(variants[0]?.error || 'Optimization failed', 'error');
            }
        } catch (error) {
            showNotification('Error: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            optimizeLoading.style.display = 'none';
            optimizeBtn.disabled = false;
            optimizeBtn.textContent = '✨ Optimize';
        }
    }
    
    function copyOptimizedResult() {
        const text = selectedPopupResult;
        if (text) {
            copyToClipboard(text);
        }
    }

    function renderPopupVariants(variants, originalPrompt, model) {
        optimizeResultText.replaceChildren();
        variants.forEach((variant, index) => {
            const card = document.createElement('section');
            card.className = `popup-result-card${variant.value && index === 0 ? ' selected' : ''}`;

            const heading = document.createElement('strong');
            heading.textContent = `${index + 1}. ${variant.style}`;
            const text = document.createElement('div');
            text.className = 'popup-result-copy';
            text.textContent = variant.value || `Failed to generate: ${variant.error || 'Unknown error'}`;
            card.append(heading, text);

            if (variant.value) {
                const choose = document.createElement('button');
                choose.type = 'button';
                choose.className = 'popup-result-choose';
                choose.textContent = index === 0 ? 'Selected — Copy' : 'Choose & Copy';
                choose.addEventListener('click', () => {
                    selectedPopupResult = variant.value;
                    optimizeResultText.querySelectorAll('.popup-result-card').forEach((item) => item.classList.remove('selected'));
                    optimizeResultText.querySelectorAll('.popup-result-choose').forEach((item) => { item.textContent = 'Choose & Copy'; });
                    card.classList.add('selected');
                    choose.textContent = 'Selected — Copy';
                    copyToClipboard(variant.value);
                    savePromptToFile(originalPrompt, variant.value, variant.style, model);
                });
                card.appendChild(choose);
            }
            optimizeResultText.appendChild(card);
        });
    }
    
    // Auto-save optimized prompt as .txt file (never auto-deleted)
    function savePromptToFile(original, optimized, style, model) {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const filename = `MGEM-Optimizer_${dateStr}_${timeStr}.txt`;
        
        // Style label map
        const styleLabels = {
            'speckit': 'SpecKit (3-section)',
            'default': 'Default',
            'detailed': 'More Detailed',
            'concise': 'More Concise',
            'examples': 'Add Examples',
            'professional': 'Professional Tone',
            'smart': 'Smart (Chain of Thought)',
            'grammar': 'Grammar Correction'
        };
        
        const divider = '━'.repeat(56);
        const content = [
            `╔${divider}╗`,
            `║  MGEM'S OPIMIZER PRO — Optimized Prompt          ║`,
            `╚${divider}╝`,
            '',
            `${divider}`,
            '  ORIGINAL PROMPT',
            `${divider}`,
            original,
            '',
            `${divider}`,
            '  OPTIMIZED PROMPT',
            `${divider}`,
            optimized,
            '',
            `${divider}`,
            '  METADATA',
            `${divider}`,
            `  Style     : ${styleLabels[style] || style}`,
            `  Model     : ${model}`,
            `  Date      : ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
            `  Time      : ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            '',
            `  File      : ${filename}`,
            `${divider}`,
            '',
            '  This file is saved to your Downloads folder. It will never',
            '  be deleted automatically — remove it manually if no longer needed.',
            '',
            `${divider}`
        ].join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false,
            conflictAction: 'uniquify'
        }, (downloadId) => {
            URL.revokeObjectURL(url);
            if (chrome.runtime.lastError) {
                console.warn('Auto-save failed:', chrome.runtime.lastError.message);
            } else {
                console.log('Saved:', filename, 'ID:', downloadId);
                showNotification('Saved to Downloads: ' + filename, 'success');
            }
        });
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
});
