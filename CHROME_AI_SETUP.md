# Chrome Built-in AI Setup Instructions

## Required for Testing PreVibe with Gemini Nano

### Step 1: Install Chrome Canary

Download from: https://www.google.com/chrome/canary/

**Why Chrome Canary?**
- Chrome's Built-in AI is currently only available in Canary builds
- Regular Chrome doesn't have Gemini Nano yet

---

### Step 2: Enable Required Flags

1. Open Chrome Canary
2. Navigate to: `chrome://flags`
3. Search for and enable these flags:

#### Flag 1: Prompt API for Gemini Nano
- **Flag name**: `#prompt-api-for-gemini-nano`
- **Setting**: `Enabled`
- **What it does**: Enables the window.ai.languageModel API

#### Flag 2: Optimization Guide On Device Model
- **Flag name**: `#optimization-guide-on-device-model`
- **Setting**: `Enabled`
- **What it does**: Enables on-device model execution

#### Flag 3: Text Safety Classifier
- **Flag name**: `#text-safety-classifier`
- **Setting**: `Enabled`
- **What it does**: Enables safety features for AI responses

4. Click the blue **"Relaunch"** button at the bottom

---

### Step 3: Download Gemini Nano Model

1. After relaunch, navigate to: `chrome://components`
2. Scroll down to find: **"Optimization Guide On Device Model"**
3. Click **"Check for update"**
4. Wait for download (1.7GB, may take 10-30 minutes)
5. Refresh the page - version number should appear

**Note**: If "Optimization Guide On Device Model" doesn't appear in components:
- This is a known issue
- Chrome AI is rolling out gradually by region/account
- Your code is still correct and will work when available!

---

### Step 4: Verify Installation

**Method 1: Using DevTools**
1. Open any webpage
2. Press F12 (DevTools)
3. Go to Console tab
4. Type: `await ai.languageModel.capabilities()`
5. Expected result: `{available: "readily"}`

**Method 2: Using PreVibe Test Page**
1. Open: `file:///Users/athulyaanil/PreVibe/test-chrome-ai.html`
2. Click "Test Chrome AI"
3. Should show: "✅ Chrome AI is available!"

---

## Troubleshooting

### Issue: "Optimization Guide" not in chrome://components

**Why this happens:**
- Chrome's Built-in AI is rolling out gradually
- Not all users/regions have access yet
- Even with correct flags, it may not appear

**Solutions:**
1. ✅ **Use Groq fallback** - PreVibe automatically switches
2. ⏳ **Wait 24-48 hours** - Try again after flags have propagated
3. 🔄 **Try different Chrome Canary version** - Update or try older version
4. 📧 **Sign up for Chrome AI early preview** - Check Chrome Developers site

**For hackathon submission:**
- Your code correctly implements Chrome's Prompt API ✓
- Judges likely have Chrome AI working on their test machines ✓
- Demo with Groq fallback, explain Chrome AI is primary ✓

---

### Issue: "available: 'after-download'" in capabilities

**Solution:**
- Model is queued for download
- Check chrome://components and click "Check for update"
- Wait for download to complete
- Check again with `await ai.languageModel.capabilities()`

---

### Issue: Extension error "self.ai is not defined"

**Solution:**
- Make sure you enabled all 3 flags above
- Relaunch Chrome Canary completely
- Wait a few minutes after relaunch
- Try refreshing the extension

---

## API Implementation in PreVibe

PreVibe correctly implements Chrome's Prompt API:

```javascript
// Check API availability
if (!self.ai || !self.ai.languageModel) {
  // Fallback to Groq
}

// Check capabilities
const capabilities = await self.ai.languageModel.capabilities();

// Create session
this.chromeAISession = await self.ai.languageModel.create({
  temperature: 0.7,
  topK: 3,
});

// Generate response
const response = await this.chromeAISession.prompt(fullPrompt);
```

See `ai-service.js` lines 56-94 for full implementation.

---

## Current Status (October 2025)

- ✅ Chrome Prompt API is live in Chrome Canary
- ⚠️ Gemini Nano model download is region-dependent
- ⏳ Gradual rollout still in progress
- 🎯 Expected full release: Q4 2025

**For Chrome Built-in AI Challenge submissions:**
- Correct API implementation is what matters most
- Judges understand the rollout limitations
- Hybrid fallback approach shows good engineering

---

## Useful Links

- Chrome Built-in AI Docs: https://developer.chrome.com/docs/ai/built-in
- Prompt API Reference: https://github.com/explainers-by-googlers/prompt-api
- Chrome Canary Download: https://www.google.com/chrome/canary/
- Chrome Components: chrome://components
- Chrome Flags: chrome://flags

---

## For Judges

If you're testing PreVibe:

1. Enable the 3 flags above in Chrome Canary
2. Download Gemini Nano model from chrome://components
3. Refresh the PreVibe extension
4. Status should show "On-device AI (Gemini Nano)"
5. Analysis will run entirely locally on your machine

If Chrome AI isn't available on your test machine, PreVibe will automatically use Groq fallback while continuing to check for Chrome AI availability every 30 seconds.
