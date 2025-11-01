# VibeCheck

"One wrong upload and—boom—you're trending for all the wrong reasons." 💀 Whether you have 10 followers or 10 million, getting cancelled is every creator’s worst nightmare! 

**VibeCheck** analyzes your video’s tone, clarity, and controversy risk before the internet does.

Built for the **Chrome Built-in AI Challenge 2025**, powered by **Chrome's on-device Gemini Nano** with a cloud fallback for reliability.

---

## Overview

**VibeCheck** is a Chrome extension that analyzes YouTube content before it is published. It evaluates your video's text and thumbnails for sentiment, clarity, and reputation risk, helping creators make informed choices before sharing content publicly.

### What It Does

VibeCheck provides comprehensive AI-powered content analysis including:

- **Sentiment Analysis:** Detects overall tone (positive, neutral, or negative) with 0-100 scoring
- **Clarity Score:** Measures readability, coherence, and how well your message comes across
- **Reputation Risk:** Flags potentially controversial, sensitive, or problematic language with severity levels (low/medium/high)
- **Image Analysis:** Identifies misleading or clickbait thumbnails by comparing visual content against your description
- **Actionable Suggestions:** Offers specific, practical improvements for clarity and tone

---

## Features

### Core Analysis Capabilities
- **Multimodal Analysis** - Analyze text + images together to detect visual-text mismatches
- **Comprehensive Risk Assessment** - Sentiment, clarity, and reputation scoring in one analysis
- **Context-Aware Suggestions** - AI provides tailored recommendations based on your specific content

### Multiple Input Methods
- **Manual Text Entry** - Paste descriptions or transcripts directly
- **Voice Input** - Speech-to-text using Web Speech API for hands-free entry
- **File Upload** - Support for `.txt`, `.srt`, `.vtt` transcript formats with drag-and-drop
- **YouTube URL Analysis** - Automatically extracts title, description, thumbnail, and transcript from any YouTube video
- **Image Upload** - Add thumbnails for multimodal clickbait detection

### User Experience
- **Dual Interface Design:**
  - Compact 420px popup for quick checks
  - Full-page app with tabbed navigation and advanced features
- **Analysis History** - Stores up to 20 past analyses with timestamps and re-analysis capability
- **Dark/Light Mode** - Persistent theme preferences with smooth transitions
- **Real-Time AI Status** - Shows which AI provider is active:
  - 🟢 Chrome AI (On-device)
  - 🟡 Cloud AI (Gemini API)
  - 🔴 Not Available
- **Settings Panel** - Configure Google Gemini API key with encrypted storage
- **Export & Share** - Copy or share analysis results easily

---

## Prerequisites

Before installation, make sure your Chrome setup supports **Gemini Nano** for the best experience (optional but recommended).

### Chrome Version
- Install **Chrome Dev** or **Canary** channel
- Version must be **≥ 128.0.6545.0**
- Download: [Chrome Canary](https://www.google.com/chrome/canary/)

### Enable Gemini Nano and Prompt API (Optional - For On-Device AI)
1. Visit `chrome://flags/#optimization-guide-on-device-model` and set to **Enabled BypassPerfRequirement**
2. Visit `chrome://flags/#prompt-api-for-gemini-nano` and set to **Enabled**
3. Relaunch Chrome
4. Wait a few minutes for the model to download in the background

> **Note:** If you skip this step, VibeCheck will automatically use the cloud API fallback. Both options provide excellent analysis!

---

## Installation

1. **Clone this repository**
   ```bash
   git clone https://github.com/athulya-anil/Vibe-Check.git
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click the puzzle icon → **Manage Extensions**

3. **Enable Developer Mode**
   - Toggle the switch in the upper right corner

4. **Load the Extension**
   - Click **Load unpacked**
   - Select the `Vibe-Check` folder from your cloned repository

5. **Pin to Toolbar**
   - Click the puzzle icon in Chrome toolbar
   - Pin VibeCheck for easy access

---

## API Key Setup

VibeCheck uses a **hybrid AI system** for maximum reliability and privacy:

* **🟢 Chrome AI (Gemini Nano):** On-device and completely private, no API key required
* **🟡 Gemini 2.0 Flash (Cloud):** Reliable fallback for multimodal analysis, requires free API key

### Get Your Free API Key

You can get a free API key here: **[Google AI Studio](https://aistudio.google.com/app/apikey)**

1. Sign in with your Google account
2. Click **"Create API Key"**
3. Select **"Create API key in new project"** (or use an existing project)
4. Copy the key (starts with `AIza...`)

> **Free Tier Limits:** 15 requests per minute, 1,500 requests per day - more than enough for typical use!

### Configure VibeCheck

#### Option 1 – From the Popup (Recommended)

1. Click the **VibeCheck** icon in your Chrome toolbar
2. Click the **⚙️ Settings** icon (gear icon in header)
3. Paste your API key in the input field
4. Click **Save API Key**
5. Check the AI Status indicator:
   * 🟢 **Chrome AI** = On-device processing (most private)
   * 🟡 **Cloud AI** = Using Gemini Flash API
   * 🔴 **Not Available** = API key required or network issue

#### Option 2 – From the Full App

1. Click the **🚀 rocket icon** in the popup to open the full app
2. Click **⚙️ Settings** in the top right header
3. Paste your API key and click **Save API Key**
4. Close the modal - verify AI Status shows 🟢 or 🟡
   
And you're ready to go!!

---

## How to Use

### Quick Popup Analysis

1. Click the **VibeCheck** icon in your Chrome toolbar.
2. Enter content via **text**, **voice**, or **file upload** (`.txt`, `.srt`, `.vtt`).
3. (Optional) Upload a **thumbnail** for multimodal analysis.
4. Click **Analyze Content** and view instant results.

### Full App Experience

Open the full interface by clicking the **🚀 Rocket** button in the popup. Access:

- **Manual Entry** — Text, voice, file upload, and image analysis.
- **YouTube Link** — Paste any YouTube URL for automatic content extraction.
- **History** — View, re-analyze, and export past results.
- **Guide** — Quick reference and tips.

---

## Hybrid AI System

**VibeCheck** intelligently balances on-device and cloud AI:

1. **Gemini Nano (Built-in):** Fast, private, and offline-friendly
2. **Gemini 2.0 Flash API (Cloud):** Reliable fallback for multimodal and extended analysis

The extension checks for on-device availability **every 30 seconds** and switches automatically.

---

## Example Analysis

**Input Text (Diss Track):**

```
Yo, listen up, time to expose the fake,
Your whole career's a mistake, everything you make is trash,
Your rhymes are weak, your flow's a disaster,
I'm the real master, you're just a wannabe pastor...
```

**Input Image:** `Orange.png` (image of an orange fruit)

---

**VibeCheck Analysis:**

**🎨 Image Analysis:**
> Visual Content Assessment: The image shows an orange, a halved orange, and a segment of an orange. This is **unrelated to the text's topic** of a diss track and could be misleading. The image may be perceived as **clickbait** if used as a thumbnail.

**😊 Sentiment Analysis:**
- **NEGATIVE** (Score: 25/100)
- Highly confrontational and aggressive tone

**🔍 Clarity:**
- **CLEAR** - The text is a straightforward diss track with insults and boasts. Message is direct.

**⚠️ Reputation Risk:**
- **MEDIUM**
  - ⚠️ Aggressive language
  - ⚠️ Personal attacks
  - ⚠️ Potentially offensive insults
  - ⚠️ May provoke negative reactions

**💡 Suggestions:**
- Consider softening the language to avoid alienating viewers or provoking backlash
- Ensure disclaimers are present if the content is satirical or entertainment-focused
- Be mindful of potential defamation concerns when making claims about others
- The thumbnail is completely unrelated - consider using an image that matches your content
- Balance competitive spirit with respectful discourse to maintain brand reputation

**⚡ Analyzed with:** 🟡 Google Gemini (Cloud)

---

## Project Structure

```
VibeCheck/
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js           # Service worker - central message hub & API orchestration
├── ai-service.js           # Hybrid AI logic (Chrome AI ↔ Gemini API switching)
├── transcript-parser.js    # File parsing utility (.txt, .srt, .vtt support)
│
├── popup.html              # Compact popup interface (420px)
├── popup.js                # Popup UI logic, event handling
├── popup.css               # Popup styling with animations
│
├── app.html                # Full-page application with tabs
├── app.js                  # App UI logic, history management
├── app.css                 # App styling, dark mode, responsive design
│
├── content.js              # YouTube page integration (button injection)
│
└── icons/                  # Extension icons
    ├── icon16.png          # Toolbar icon
    ├── icon48.png          # Extensions page
    └── icon128.png         # Chrome Web Store
```

### Architecture Overview

```
┌─────────────┐
│   UI Layer  │  (popup.html, app.html)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Message Handler │  (chrome.runtime.sendMessage)
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│  Service Worker  │  (background.js)
│   - Routing      │
│   - YouTube API  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   AI Service     │  (ai-service.js)
│   - Provider     │
│     Selection    │
│   - Prompt       │
│     Engineering  │
└─────┬────┬───────┘
      │    │
      ▼    ▼
  ┌─────┐ ┌────────┐
  │Nano │ │Gemini  │
  │(On) │ │(Cloud) │
  └─────┘ └────────┘
```

---

## Use Cases

### For YouTube Creators
- **Pre-publish checks** to avoid reputation damage
- **Thumbnail testing** to ensure visuals match content
- **Tone verification** before controversial topics
- **Clarity optimization** for better audience understanding

### For Content Reviewers
- **Streamline moderation** workflows with AI-assisted flagging
- **Risk assessment** for community-submitted content
- **Batch analysis** using the history feature

### For Brand Safety Teams
- **Automated content screening** before sponsorships
- **Brand alignment checks** for influencer partnerships
- **Risk mitigation** for corporate YouTube channels

### For Educators
- **Teaching AI ethics** and content moderation
- **Digital literacy** and responsible online communication
- **Demonstrating sentiment analysis** and NLP concepts

---

## Privacy and Security

### Data Protection
- **API keys** stored locally in Chrome's encrypted storage (`chrome.storage.local`)
- **On-device AI** keeps all data on your computer - nothing sent to servers
- **Cloud API** uses HTTPS encryption for secure transmission
- **No tracking** - we don't collect any usage data or analytics
- **No external dependencies** - all processing done by Chrome or Google AI

### Security Best Practices
- Manifest V3 compliance (latest security standards)
- Content Security Policy (CSP) enforcement
- No eval() or unsafe inline scripts
- Minimal permissions (activeTab, storage, scripting)
- Encrypted storage for sensitive data

### What We Store
- **Locally (on your device):**
  - API key (encrypted)
  - Analysis history (last 20 analyses)
  - Theme preference (light/dark)
  - Settings configuration
- **Never stored:**
  - Your content after analysis completes
  - Personal information
  - Usage analytics
  - Browsing history

---

## Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations, gradients, flexbox/grid
- **JavaScript (ES6+)** - Pure vanilla JS for performance
  - Async/await for API calls
  - ES6 modules
  - No framework dependencies

### Chrome Extension Platform
- **Manifest V3** - Latest Chrome extension standard
- **Service Worker** - `background.js` for persistent logic
- **Content Scripts** - YouTube page integration via `content.js`
- **Chrome APIs:**
  - `chrome.storage` - Encrypted local storage
  - `chrome.runtime` - Messaging, lifecycle management
  - `chrome.tabs` - Tab creation, URL querying
  - `chrome.scripting` - Dynamic content injection

### AI/ML
- **Chrome Built-in AI (Gemini Nano)** - On-device language model via new LanguageModel API
- **Google Gemini 2.0 Flash API** - Cloud-based multimodal AI with vision capabilities
- **Chrome Prompt API** - For on-device text generation
- **Hybrid AI Service** - Custom abstraction layer for automatic provider switching

### Data Processing
- **TranscriptParser** - Custom class for `.txt`, `.srt`, `.vtt` formats
  - Regex-based parsing
  - Timestamp stripping
  - Text normalization
- **FileReader API** - File uploads and processing
- **Base64 encoding** - Image transmission for multimodal analysis
- **YouTube oEmbed API** - Video metadata extraction

### Web APIs
- **Web Speech API** - Voice recognition for hands-free input
- **Fetch API** - Network requests
- **LocalStorage** - Theme and preference persistence

---

## What Makes VibeCheck Special

### Innovation Highlights
1. **First-of-its-Kind Hybrid AI** - Seamless automatic switching between on-device and cloud processing
2. **Multimodal Clickbait Detection** - Compares thumbnail visuals against text content semantically
3. **Privacy-First Design** - Prefers on-device processing whenever available
4. **Voice-Powered Input** - Hands-free transcript entry for accessibility
5. **Seamless YouTube Integration** - In-page button with automatic content extraction
6. **Real-Time Provider Monitoring** - Checks Chrome AI availability every 30 seconds and adapts
7. **Production-Ready UX** - Dark mode, smooth animations, responsive design

### Technical Achievements
- Zero external dependencies (pure vanilla JavaScript)
- Manifest V3 compliance with modern security standards
- Comprehensive file format support (.txt, .srt, .vtt)
- Intelligent caching and state management
- Graceful degradation and error handling
- Responsive design for multiple viewport sizes

---

## License

MIT License © 2025 Athulya Anil

---

## Author

Developed by [**Athulya Anil**](https://github.com/athulyaanil)
for the **Google Chrome Built-in AI Challenge 2025**

---

## Resources

* [Chrome Prompt API Documentation](https://developer.chrome.com/docs/ai/built-in)
* [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
* [Chrome Built-in AI Challenge](https://chromeai.devpost.com/)