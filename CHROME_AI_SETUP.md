# Chrome Built-in AI Setup Guide

PreVibe requires Chrome's on-device AI (Gemini Nano) to qualify for the Chrome Built-in AI Challenge.

## Requirements

1. **Chrome Canary or Chrome Dev** (Version 128 or higher)
   - Download: https://www.google.com/chrome/canary/
   - Or Dev Channel: https://www.google.com/chrome/dev/

## Setup Steps

### 1. Enable Chrome Flags

Open Chrome and navigate to these flags:

#### Flag 1: Optimization Guide On Device Model
```
chrome://flags/#optimization-guide-on-device-model
```
- Set to: **Enabled BypassPerfRequirement**
- This bypasses performance requirements for testing

#### Flag 2: Prompt API for Gemini Nano
```
chrome://flags/#prompt-api-for-gemini-nano
```
- Set to: **Enabled**

### 2. Download Gemini Nano Model

1. Navigate to:
   ```
   chrome://components/
   ```

2. Find "**Optimization Guide On Device Model**"

3. Click "**Check for update**"

4. Wait for download to complete (~1.7GB)
   - You'll see version number appear when ready
   - Status should show "Up-to-date"

### 3. Restart Chrome

**Important:** Close ALL Chrome windows and restart completely.

### 4. Verify Installation

#### Method 1: Check in DevTools Console
```javascript
console.log(typeof LanguageModel !== 'undefined' ? 'Chrome AI Available' : 'Not Available');
```

#### Method 2: Use PreVibe
1. Open PreVibe extension
2. Check status indicator in header:
   - 🟢 "On-device AI" = Chrome AI working!
   - 🟡 "Cloud AI" = Using Gemini fallback (Chrome AI not available)
   - 🔴 "Not Available" = No AI configured

## Troubleshooting

### Chrome AI Shows as Unavailable

1. **Check Chrome Version**
   - Go to `chrome://version/`
   - Must be Chrome Canary/Dev 128+

2. **Verify Flags Are Enabled**
   - Double-check both flags are set correctly
   - Restart Chrome after changing flags

3. **Check Model Download**
   - Go to `chrome://components/`
   - "Optimization Guide On Device Model" should show a version number
   - If not, click "Check for update" and wait

4. **Wait for Model to Load**
   - After download, restart Chrome
   - Model takes a few minutes to initialize on first launch

5. **Check Console for Errors**
   - Open DevTools (F12)
   - Look for Chrome AI related errors

### Still Not Working?

**Fallback Option:** PreVibe has a hybrid AI system. If Chrome AI isn't available, it will use Google Gemini Cloud API:

1. Click Settings (⚙️) in PreVibe
2. Enter your Gemini API key
3. Get free key: https://aistudio.google.com/app/apikey

**Note:** The challenge requires Chrome's on-device AI, so please try to get Gemini Nano working for the best experience and to meet competition requirements.

## Resources

- Chrome Built-in AI Documentation: https://developer.chrome.com/docs/ai/built-in
- Gemini Nano Announcement: https://developer.chrome.com/blog/on-device-ai/
- Chrome Canary Download: https://www.google.com/chrome/canary/
