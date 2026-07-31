# 🛠️ MGEM'S OPIMIZER PRO — Developer Mode Installation Guide

Install this extension locally from source without publishing to the Chrome Web Store.

---

## ✅ Prerequisites

- **Google Chrome** or **Chromium-based browser** (Edge, Brave, Opera)
- The extension folder: `E:\Ai build\PROMP mASTER`
- A **DeepSeek, OpenAI, Gemini, NVIDIA, or Kimi API key** (see step 6)

---

## 📦 Step 1: Open Chrome Extensions Page

| Action | Shortcut |
|--------|----------|
| Type `chrome://extensions` in the address bar | — |
| Or click the puzzle piece icon → **Manage Extensions** | — |

---

## 🔧 Step 2: Enable Developer Mode

Toggle the **Developer mode** switch in the top-right corner of the page.

When enabled, you'll see three new buttons appear:
- **Load unpacked**
- **Pack extension**
- **Update**

---

## 📂 Step 3: Load Unpacked

Click the **"Load unpacked"** button.

In the file picker dialog, navigate to and select the extension folder:

```
E:\Ai build\PROMP mASTER
```

> **WSL users:** The path is `/mnt/e/Ai build/PROMP mASTER`

Chrome will read the `manifest.json` file and register the extension.

---

## ✅ Step 4: Verify Installation

- The extension card appears in the list with the name **"MGEM'S OPIMIZER PRO"**
- The ✨ sparkle icon appears in the Chrome toolbar (right of the address bar)
- Click the icon → the settings popup opens

![Extension card](https://via.placeholder.com/400x80/667eea/ffffff?text=MGEM'S+OPIMIZER+PRO+v1.0)

---

## 🔑 Step 5: Configure API Key

1. Click the **✨** extension icon in the toolbar
2. **Select your AI model** from the dropdown at the top:
   - DeepSeek Chat V3 / R1
   - GPT-4o, GPT-4o Mini, O1
   - Gemini 2.0 Flash / Pro
   - NVIDIA Nemotron 70B / Ultra 253B
   - Kimi Moonshot v1
3. **Enter your API key** for the selected provider
4. Click **Save Settings**
5. ✅ The status indicator turns green if the key is valid

---

## 🎯 Step 6: Use the Extension

### On AI Chat Sites

1. Navigate to **DeepSeek, Grok, Claude, Gemini, or ChatGPT**
2. Type your prompt in the input field
3. Click the **✨ Optimize** button that appears next to the input
4. The optimized prompt replaces your original text
5. Press Enter or click Send

### From the Popup

1. Click the ✨ extension icon
2. Type or paste your prompt in the **Optimize Your Prompt** section
3. Select an optimization **Style**
4. Click **✨ Optimize**
5. Copy the result or use it directly

### Keyboard Shortcut

| Platform | Shortcut |
|----------|----------|
| Windows / Linux | `Ctrl + Shift + O` |
| Mac | `Cmd + Shift + O` |

---

## 🔄 Reload After Changes

Whenever you modify extension files (HTML, JS, CSS), reload it:

1. Go to `chrome://extensions`
2. Find **MGEM'S OPIMIZER PRO**
3. Click the **⟳ (Reload)** icon on the card

The extension reloads instantly — no need to re-install.

---

## 🧪 Troubleshooting

### "This extension may have been corrupted" warning
→ Remove it and **Load unpacked** again.

### Extension icon is grayed out / not appearing
→ Make sure you're on a supported domain (DeepSeek, Grok, Claude, Gemini, ChatGPT).
→ Click the puzzle piece icon and pin the extension.

### "Manifest is not valid" error
→ Check that `manifest.json` is valid JSON. Missing commas or trailing commas cause this.

### Button / ✨ Optimize not showing on chat sites
→ Refresh the page.
→ Check Chrome console (F12 → Console tab) for errors.
→ Verify the extension is enabled at `chrome://extensions`.

### Optimization fails with "API key not configured"
→ Click the extension icon and check the API Configuration section.
→ Select the correct model/provider.
→ Enter and save your API key.

### File not saving to Downloads
→ Chrome may require "downloads" permission. Re-install the extension to auto-accept.
→ Check your Downloads folder permissions.

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration (permissions, icons, scripts) |
| `content.js` | Injects the ✨ Optimize button into chat pages |
| `content.css` | Styles for the injected button and overlays |
| `background.js` | Service worker — API calls, keyboard shortcuts, context menu |
| `popup.html` | Settings and optimization popup UI |
| `popup.js` | Popup logic — settings, optimize, history |
| `popup.css` | Popup styles |
| `welcome.html` | Landing page (this file) |
| `icons/` | Extension icons (16, 32, 48, 128 px) |
| `INSTALL_DEV_MODE.md` | This guide |

---

## 📝 Notes

- **API keys are stored locally** in Chrome's `storage.local` — per provider.
- **History is unlimited** — nothing is auto-deleted. Use the **Clear All** button to purge.
- **Optimized prompts auto-save** to your Downloads folder as `.txt` files named `MGEM-Optimizer_YYYY-MM-DD_HH-MM-SS.txt`.
- No data is sent to third-party servers. API calls go directly from your browser to the selected AI provider.

---

**Happy prompting!** 🚀
