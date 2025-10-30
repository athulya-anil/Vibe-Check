# PreVibe - Hybrid AI Chrome Extension

A Chrome extension that analyzes YouTube content sentiment, clarity, and reputation risk using **hybrid AI**: Chrome's built-in Gemini Nano (when available) with automatic fallback to Google Gemini cloud API.

## Features

- **Hybrid AI System**: Automatically detects and uses Chrome's on-device AI (Gemini Nano), falls back to Google Gemini cloud API when unavailable
- **Auto-Switching**: Automatically switches to on-device AI when it becomes available (checks every 30 seconds)
- **Content Analysis**: Analyzes sentiment, clarity, and reputation risk of YouTube descriptions/transcripts
- **Real-time Status**: Shows which AI provider is currently active
- **Privacy-Focused**: Prefers on-device processing when available

## Quick Start

### 1. Get a Google Gemini API Key (Free)

Since Chrome's built-in AI may not be available yet, you'll need a Google Gemini API key as fallback:

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### 2. Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the PreVibe folder
5. The extension should now appear in your extensions bar

### 3. Configure Gemini API Key

1. Click the PreVibe extension icon
2. Click the ⚙️ (settings) icon
3. Paste your Gemini API key
4. Click "Save API Key"
5. You should see "Cloud AI (Gemini)" status

### 4. Use the Extension

1. Copy any YouTube video description or transcript
2. Paste it into the extension textarea
3. Click "Analyze Content"
4. View the results: sentiment, clarity, reputation risk, and suggestions

## How the Hybrid System Works

### AI Provider Priority

1. **Chrome Built-in AI (Gemini Nano)** - First choice (privacy, speed, free)
   - Requires Chrome Canary with flags enabled
   - Requires AI Model Runtime component downloaded
   - If available, uses on-device processing

2. **Google Gemini Cloud API** - Automatic fallback
   - Fast cloud-based AI (gemini-2.0-flash)
   - Requires API key but is free
   - Used when Chrome AI is unavailable

### Auto-Switching Behavior

- Extension checks for Chrome AI availability every 30 seconds when using Gemini
- When Chrome AI becomes available, automatically switches
- Shows notification: "Chrome AI is now available! Switched to on-device processing."
- Stops periodic checking once Chrome AI is active

### Status Indicators

- 🟢 **On-device AI (Gemini Nano)**: Using Chrome's built-in AI
- 🟡 **Cloud AI (Gemini)**: Using Google Gemini fallback (checking for Chrome AI...)
- 🔴 **Not Available**: No AI configured (set up Gemini API key)

## Chrome Built-in AI Setup (Optional)

If you want to use Chrome's on-device AI (Gemini Nano):

### Prerequisites

- Chrome Canary build 127+ (you have 144.0.7500.0 ✓)
- macOS, Windows, or Linux
- ~3GB free disk space for AI model

### Enable Chrome AI

1. Open `chrome://flags` in Chrome Canary
2. Enable these flags:
   - `#optimization-guide-on-device-model`
   - `#prompt-api-for-gemini-nano`
   - `#text-safety-classifier`
3. Relaunch Chrome
4. Open `chrome://components`
5. Find "Optimization Guide On Device Model" and click "Check for update"
6. Wait for model to download (can take 15-30 minutes)

### Troubleshooting Chrome AI

**AI Model Runtime not appearing in chrome://components?**

This is a known issue. While you wait for Google to fix it:
1. Use the Google Gemini fallback (works perfectly)
2. The extension will automatically detect and switch when Chrome AI loads
3. Try alternative approaches:
   - Different Chrome Canary version
   - Clear `OptimizationGuidePredictionModels` cache
   - Wait 24-48 hours (model deployment is gradual)

**How to check if Chrome AI is working:**

1. Open DevTools Console (F12)
2. Type: `await ai.languageModel.capabilities()`
3. Should show: `{available: "readily"}`

## API Reference

### Background Script Messages

#### Get AI Status
```javascript
chrome.runtime.sendMessage({ type: 'GET_AI_STATUS' }, (response) => {
  console.log(response.status);
  // {
  //   provider: 'chrome' | 'gemini' | null,
  //   available: boolean,
  //   isOnDevice: boolean,
  //   isCloud: boolean,
  //   hasGeminiKey: boolean,
  //   checkingForChromeAI: boolean
  // }
});
```

#### Analyze Content
```javascript
chrome.runtime.sendMessage({
  type: 'ANALYZE_CONTENT',
  text: 'Your content here...'
}, (response) => {
  if (response.success) {
    console.log(response.analysis);
    // {
    //   sentiment: 'positive' | 'neutral' | 'negative',
    //   sentimentScore: 0-100,
    //   clarity: 'clear' | 'moderate' | 'unclear',
    //   clarityNotes: '...',
    //   reputationRisk: 'low' | 'medium' | 'high',
    //   riskFactors: [...],
    //   suggestions: [...],
    //   provider: 'chrome' | 'gemini',
    //   model: '...'
    // }
  }
});
```

#### Set Gemini API Key
```javascript
chrome.runtime.sendMessage({
  type: 'SET_GEMINI_API_KEY',
  apiKey: 'AIza...'
}, (response) => {
  console.log(response.status);
});
```

#### Generate Custom Response
```javascript
chrome.runtime.sendMessage({
  type: 'GENERATE_RESPONSE',
  prompt: 'Your prompt here',
  systemPrompt: 'Optional system prompt'
}, (response) => {
  if (response.success) {
    console.log(response.response.text);
    console.log(response.response.provider);
  }
});
```

## File Structure

```
PreVibe/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker (AI service manager)
├── ai-service.js          # Hybrid AI service (detection, fallback, switching)
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic and event handlers
├── popup.css              # Popup styles
├── content.js             # Content script (runs on YouTube pages)
├── icons/                 # Extension icons
└── README.md              # This file
```

## Key Components

### ai-service.js
Core hybrid AI system:
- `HybridAIService` class
- Chrome Prompt API detection
- Google Gemini API integration
- Automatic provider switching
- Periodic availability checking

### background.js
Extension background worker:
- Initializes AI service on startup
- Handles message passing from popup/content scripts
- Manages AI provider changes
- Broadcasts provider change notifications

### popup.js
User interface logic:
- AI status display
- Settings management
- Content analysis requests
- Real-time provider change notifications
- Results display

## Configuration

### Chrome Flags Required
```
--enable-features=
  Optimization GuideOnDeviceModel,
  PromptAPIForGeminiNano,
  TextSafetyClassifier
```

### Storage
Extension uses `chrome.storage.local` to persist:
- Gemini API key (encrypted by Chrome)

## Performance

### On-device AI (Gemini Nano)
- **Latency**: 1-3 seconds
- **Privacy**: 100% local processing
- **Cost**: Free
- **Requires**: Internet for initial model download only

### Cloud AI (Google Gemini)
- **Latency**: 0.5-2 seconds
- **Privacy**: Data sent to Google servers
- **Cost**: Free tier (generous limits)
- **Requires**: Internet connection

## Privacy & Security

- **API Key Storage**: Stored locally in Chrome's encrypted storage
- **On-device Processing**: When using Chrome AI, no data leaves your device
- **Cloud Fallback**: When using Google Gemini, data is sent over HTTPS
- **No Analytics**: Extension doesn't collect usage data

## Development

### Testing the Extension

1. **Open Developer Tools**:
   - Right-click extension icon → Inspect popup
   - Check Console for logs

2. **Test AI Detection**:
   ```javascript
   // In background service worker console (chrome://extensions)
   console.log('AI Status:', aiService.getStatus());
   ```

3. **Test Analysis**:
   - Paste sample YouTube description
   - Click "Analyze"
   - Check DevTools Console for request/response logs

4. **Test Auto-Switching**:
   - Start with Gemini fallback
   - Enable Chrome AI
   - Wait 30 seconds
   - Should see notification about switching

### Debugging

**Background Service Worker Console**:
```
chrome://extensions → PreVibe → "service worker" link
```

**Popup Console**:
```
Right-click extension icon → Inspect
```

**Logs to Watch**:
- `🚀 Initializing Hybrid AI Service...`
- `✅ Chrome Prompt API detected!` or `⚠️ Chrome AI not available`
- `📤 Sending to Chrome AI:` or `📤 Sending to Gemini API...`
- `🔄 AI Provider changed:`

## Known Issues & Solutions

### Issue: Chrome AI not loading
**Solution**: Use Google Gemini fallback. Extension auto-switches when Chrome AI loads.

### Issue: "No AI provider available"
**Solution**: Configure Gemini API key in settings (⚙️ icon).

### Issue: Gemini API error "rate limit"
**Solution**: Free tier has limits. Wait or create a new API key.

### Issue: Analysis results not showing
**Solution**: Check DevTools Console for errors. Verify API key is correct.

## Roadmap

- [ ] YouTube page integration (extract description automatically)
- [ ] Batch analysis for multiple videos
- [ ] Export analysis reports
- [ ] Custom analysis prompts
- [ ] Support for more AI providers (OpenAI, Anthropic, Groq)
- [ ] Browser action for quick analysis from any page

## License

MIT License - feel free to use for your hackathon or projects!

## Credits

- Built with Chrome's Prompt API (Gemini Nano)
- Powered by Google Gemini API (gemini-2.0-flash)

## Support

- Chrome Prompt API Docs: https://developer.chrome.com/docs/ai/built-in
- Google Gemini API Docs: https://ai.google.dev/gemini-api/docs
- Extension Issues: Check DevTools Console first