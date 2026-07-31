# PromptPerfect Chrome Extension

A Chrome extension that automatically optimizes user prompts inside DeepSeek and Grok by calling DeepSeek's API, giving casual users better AI responses with one click.

## Features

✨ **One-Click Optimization** - Transform your prompts for better AI responses instantly  
🎯 **Multiple Optimization Styles** - Choose from detailed, concise, professional, and more  
🚀 **Multi-Platform** - Works on DeepSeek, Grok, Claude, Gemini, and ChatGPT  
⌨️ **Keyboard Shortcuts** - Use Ctrl+Shift+O (Cmd+Shift+O on Mac) for quick optimization  
📚 **History Tracking** - Keep track of your optimizations locally  
🔒 **Privacy First** - All data stored locally, no external servers involved  
⚡ **Lightning Fast** - Optimized for speed and efficiency  

## Installation



### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension directory
6. The extension icon should appear in your toolbar

## Setup

1. **Get your DeepSeek API key**:
   - Visit [DeepSeek Platform](https://platform.deepseek.com/api-keys)
   - Create an account if you don't have one
   - Generate a new API key

2. **Configure the extension**:
   - Click the PromptPerfect icon in your toolbar
   - Enter your DeepSeek API key
   - Choose your preferred optimization style
   - Configure optional settings (auto-send, etc.)

3. **Start using it**:
   - Navigate to [DeepSeek Chat](https://chat.deepseek.com) or [Grok](https://grok.com)
   - Type your prompt in the input field
   - Click the "Optimize" button that appears
   - Review and send the optimized prompt

## Usage

### Basic Usage
1. **Type your prompt** in DeepSeek, Grok, Claude, Gemini, or ChatGPT
2. **Click the "✨ Optimize" button** that appears in the input area
3. **Review the optimized prompt** that replaces your original text
4. **Send the prompt** to get better AI responses

### Keyboard Shortcuts
- **Windows/Linux**: `Ctrl + Shift + O`
- **Mac**: `Cmd + Shift + O`

### Optimization Styles
- **Default**: Balanced optimization for general use
- **More Detailed**: Adds context, examples, and structure
- **More Concise**: Removes unnecessary words while preserving intent
- **Add Examples**: Includes specific examples for clarity
- **Professional**: Formal, business-appropriate language

### Context Menu
Right-click on any text input in DeepSeek, Grok, Claude, Gemini, or ChatGPT to see "Optimize with PromptPerfect" option.

## Privacy & Security

🔒 **Your data stays yours**:
- All prompt history is stored locally in your browser
- API calls go directly from your browser to DeepSeek's API
- No data is sent to external servers
- Your API key is stored securely in Chrome's extension storage

🛡️ **Permissions**:
- `storage`: Store settings and history locally
- `activeTab`: Access current tab for optimization
- Host permissions for DeepSeek and Grok domains only

## Development

### Project Structure
```
promptperfect/
├── manifest.json          # Extension configuration
├── content.js             # Content script for page integration
├── content.css            # Styles for injected elements
├── popup.html             # Extension popup interface
├── popup.css              # Popup styles
├── popup.js               # Popup functionality
├── background.js          # Background service worker
├── welcome.html           # Welcome page for new users
├── icons/                 # Extension icons
└── README.md              # This file
```

### Building from Source
1. Clone the repository
2. Make your changes
3. Load the extension in Chrome developer mode
4. Test thoroughly on both DeepSeek and Grok

### Contributing
We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Extension not working?
- Ensure you're on a supported platform (DeepSeek, Grok, Claude, Gemini, or ChatGPT)
- Check that your API key is valid and configured
- Try refreshing the page
- Check the browser console for errors

### API key issues?
- Verify your DeepSeek API key is correct
- Check if you have sufficient API credits
- Ensure your API key has the necessary permissions

### Button not appearing?
- Refresh the page
- Check if the extension is enabled
- Try disabling other extensions that might conflict

### Performance issues?
- Clear your browser cache
- Restart Chrome
- Check your internet connection

## Platform Support

✅ **Fully Supported**:
- DeepSeek Chat (chat.deepseek.com)
- Grok (grok.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- ChatGPT (chatgpt.com)

🔄 **Coming Soon**:
- Perplexity
- More AI platforms

## API Usage

The extension uses DeepSeek's API for prompt optimization. Each optimization request consumes API credits based on the input and output token count. Monitor your usage in the [DeepSeek dashboard](https://platform.deepseek.com/usage).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## Changelog

### v1.0.0 (Initial Release)
- ✅ DeepSeek and Grok support
- ✅ Multiple optimization styles
- ✅ Keyboard shortcuts
- ✅ Local history tracking
- ✅ Privacy-focused design
- ✅ Clean, modern UI

---

**Made with ❤️ for the AI community**