# 📦 PromptPerfect Chrome Extension - Installation & Usage Guide

## 🚀 How to Install PromptPerfect in Google Chrome

### Method 1: Developer Mode Installation (Immediate)

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in your Chrome address bar
   - Press Enter

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner
   - You'll see new options appear

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `e:\Ai build\PROMP mASTER` folder
   - Select the folder containing all the extension files
   - Click "Select Folder"

4. **Verify Installation**
   - You should see the PromptPerfect extension appear in your extensions list
   - Look for the ✨ icon in your Chrome toolbar

### Method 2: Chrome Web Store (Future)

*Note: This will be available once the extension is published to the Chrome Web Store*

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "PromptPerfect"
3. Click "Add to Chrome"
4. Click "Add extension" in the confirmation dialog

## ⚙️ Configuration Steps

### 1. First-Time Setup

1. **Click the Extension Icon**
   - Look for the ✨ PromptPerfect icon in your Chrome toolbar
   - Click it to open the popup

2. **Configure Your API Key**
   - Visit [DeepSeek Platform](https://platform.deepseek.com/api-keys)
   - Create an account if you don't have one
   - Generate a new API key
   - Copy the API key
   - Paste it into the "DeepSeek API Key" field in the extension popup
   - Click "Save Settings"

3. **Choose Your Preferences**
   - Select your preferred optimization style (Default, Detailed, Concise, etc.)
   - Enable/disable "Auto-send after optimization" if desired
   - Save your settings

### 2. Platform Testing

1. **Test on DeepSeek**
   - Go to [chat.deepseek.com](https://chat.deepseek.com)
   - Type a simple prompt like "write me a recipe"
   - Look for the "✨ Optimize" button that appears in the input area
   - Click it to test optimization

2. **Test on Grok**
   - Go to [grok.com](https://grok.com)
   - Type a prompt
   - Look for the "✨ Optimize" button
   - Test the optimization feature

## 🎯 How to Use PromptPerfect

### Basic Usage

1. **Navigate to Supported Platform**
   - Open DeepSeek Chat or Grok in Chrome

2. **Type Your Prompt**
   - Write your question or request in the input field

3. **Click Optimize**
   - The "✨ Optimize" button will appear when you have text
   - Click it to optimize your prompt

4. **Review & Send**
   - The optimized prompt will replace your original text
   - Review the changes
   - Click send to get better AI responses

### Keyboard Shortcuts

- **Windows/Linux**: `Ctrl + Shift + O`
- **Mac**: `Cmd + Shift + O`

### Using Different Styles

1. **Open Extension Popup**
   - Click the ✨ icon in your toolbar

2. **Select Style**
   - Choose from dropdown: Default, Detailed, Concise, Examples, Professional

3. **Apply Style**
   - The selected style will be used for all optimizations

## 🔧 Troubleshooting Common Issues

### Extension Not Loading

**Problem**: Extension doesn't appear after loading

**Solutions**:
- Ensure all files are in the correct folder
- Check that `manifest.json` is valid JSON
- Try reloading the extension in `chrome://extensions/`
- Restart Chrome

### Button Not Appearing

**Problem**: "✨ Optimize" button doesn't show on DeepSeek/Grok

**Solutions**:
- Refresh the page
- Check browser console for errors (F12 → Console)
- Ensure you're on the correct URLs:
  - DeepSeek: `https://chat.deepseek.com/*`
  - Grok: `https://grok.com/*`

### API Key Issues

**Problem**: "Invalid API key" or optimization fails

**Solutions**:
- Verify your DeepSeek API key is correct
- Check if you have sufficient API credits
- Ensure your API key has proper permissions
- Test the API key directly on DeepSeek's platform

### Keyboard Shortcuts Not Working

**Problem**: Ctrl+Shift+O doesn't trigger optimization

**Solutions**:
- Click in the text input field first
- Ensure the extension has focus
- Check if the shortcut conflicts with other extensions
- Try clicking the optimize button instead

## 📱 Platform-Specific Notes

### DeepSeek Chat
- **URL**: https://chat.deepseek.com
- **Button Location**: Appears inside the message input area
- **Integration**: Seamlessly blends with DeepSeek's UI

### Grok
- **URL**: https://grok.com
- **Button Location**: Appears in the input area
- **Integration**: Matches Grok's design aesthetic

## 🔒 Privacy & Security

### What Data is Collected?
- ✅ **Your prompts** - Only stored locally in your browser
- ✅ **API key** - Stored securely in Chrome's extension storage
- ✅ **Optimization history** - Stored locally, never shared

### What Data is NOT Collected?
- ❌ No data sent to external servers (except DeepSeek API)
- ❌ No user tracking or analytics
- ❌ No personal information beyond your API key
- ❌ No browsing history or other website data

## 🎨 Customization Options

### Changing Optimization Styles

1. **Default**: Balanced optimization for general use
2. **Detailed**: Adds context, examples, and structure
3. **Concise**: Removes unnecessary words while preserving intent
4. **Examples**: Includes specific examples for clarity
5. **Professional**: Formal, business-appropriate language

### Auto-Send Feature

- **Enable**: Automatically sends optimized prompt after optimization
- **Disable**: Lets you review before sending
- **Toggle**: Available in extension popup settings

## 📈 Advanced Features

### Context Menu Integration
- Right-click on any text input in supported platforms
- Select "Optimize with PromptPerfect" from context menu

### History Management
- View optimization history in extension popup
- Clear history when needed
- Export history for analysis (future feature)

### Multiple Platform Support
- Works simultaneously across DeepSeek and Grok
- Maintains separate history for each platform
- Consistent experience across platforms

## 🆘 Getting Help

### Extension Issues
1. Check the troubleshooting section above
2. Open browser console (F12) and look for errors
3. Try disabling other extensions temporarily
4. Restart Chrome

### API Issues
1. Visit [DeepSeek Platform](https://platform.deepseek.com)
2. Check your API usage and credits
3. Verify API key validity
4. Contact DeepSeek support if needed

### Still Need Help?
- Check the [GitHub repository](https://github.com/yourusername/promptperfect) for updates
- Create an issue with detailed error information
- Include browser version, extension version, and error messages

---

**🎉 You're all set! Enjoy better AI responses with PromptPerfect!**