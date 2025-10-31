# VibeCheck Check

**VibeCheck** helps YouTube creators analyze their content for potential reputation risks BEFORE publishing. Get instant feedback on sentiment, clarity, reputation risk, and misleading thumbnails using AI.

Built for the **Chrome Built-in AI Challenge 2025** - leveraging Chrome's on-device Gemini Nano with cloud fallback.

## What Does It Do?

VibeCheck analyzes YouTube content (description/transcript + thumbnails) and provides:

- **😊 Sentiment Analysis** - Positive, neutral, or negative tone
- **✨ Clarity Score** - How clear and understandable your content is
- **⚠️ Reputation Risk** - Flags potentially controversial or problematic topics
- **🎨 Image Analysis** - Detects misleading or clickbait thumbnails
- **💡 Suggestions** - Actionable improvements for your content

## Quick Start

### 1. Install the Extension

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `VibeCheck` folder
6. Pin the extension to your toolbar

### 2. Get a Google Gemini API Key (Free)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### 3. Configure the Extension

1. Click the VibeCheck extension icon
2. Click the ⚙️ settings button
3. Paste your Gemini API key
4. Click "Save API Key"

### 4. Analyze Your Content

**Option 1: Popup (Quick Analysis)**
1. Click the VibeCheck icon
2. Paste your YouTube description or transcript
3. Optionally upload a thumbnail image
4. Click "Analyze Content"

**Option 2: Full App (View in a larger tab)**
1. Click the 🚀 rocket button to open the full app
2. Upload transcript files (.txt, .srt, .vtt) or paste text
3. Upload thumbnails for multimodal analysis
4. View detailed analysis with history
5. Use Guide tab for reference

## Hybrid AI System

VibeCheck uses a **hybrid approach** for maximum reliability:

1. **Chrome's Built-in AI (Gemini Nano)** - Privacy-first, on-device processing
   - No data leaves your computer
   - Fast and free
   - Requires Chrome Canary with flags enabled

2. **Google Gemini Cloud API** - Reliable fallback
   - Works immediately with any Chrome version
   - Automatic fallback when on-device AI unavailable
   - Free tier with generous limits

The extension automatically uses the best available option!

## Features

- **Multimodal Analysis** - Analyze text + images together to detect misleading content
- **History Tracking** - View all your past analyses in the full app
- **Dark Mode** - Easy on the eyes with automatic theme switching
- **Export Results** - Copy or share analysis results
- **File Upload Support** - Upload .txt, .srt, .vtt transcript files
- **Real-time Status** - See which AI provider is currently active

## Project Structure

```
VibeCheck/
├── manifest.json           # Extension configuration
├── background.js           # Service worker
├── ai-service.js           # Hybrid AI logic
├── popup.html/js/css       # Extension popup
├── app.html/js/css         # Full-page app
├── transcript-parser.js    # File parsing utility
├── content.js              # YouTube page integration
└── icons/                  # Extension icons
```

## Use Cases

- **YouTube Creators** - Check content before publishing
- **Content Reviewers** - Quickly assess reputation risks
- **Community Managers** - Screen user-submitted content
- **Brand Safety Teams** - Automated content flagging
- **Educators** - Teaching content moderation

## Privacy & Security

- **API keys** stored locally in Chrome's encrypted storage
- **On-device AI** keeps all data on your computer
- **Cloud fallback** uses HTTPS encryption
- **No tracking** - we don't collect any usage data

## Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Chrome Extension APIs (Manifest V3)

**AI/ML:**
- Chrome Built-in AI (Gemini Nano) - On-device language model
- Google Gemini 1.5 Flash API - Cloud-based multimodal AI
- Chrome Prompt API - For on-device text generation

**Storage:**
- Chrome Storage API (encrypted local storage)
- Session storage for analysis history

**File Processing:**
- Custom transcript parser (.txt, .srt, .vtt)
- FileReader API for image/file uploads

**Development Tools:**
- Chrome Extensions Developer Mode
- Chrome Canary (for built-in AI testing)

## Example Analysis

**Input Text (Diss Track Transcript):**
> "Yo, listen up, time to expose the fake,
> Your whole career's a mistake, everything you make is trash,
> Your rhymes are weak, your flow's a disaster,
> I'm the real master, you're just a wannabe pastor,
> Preaching lies while I'm living truth,
> Your success is a fluke, I got the proof,
> You claim you're the best but you can't compete,
> When I drop this track, you'll accept defeat"

**VibeCheck Analysis:**
- **Sentiment:** Negative (confrontational, aggressive)
- **Clarity:** High (clear message and intent)
- **Reputation Risk:** Moderate-High
  - Risk Factors: Personal attacks, potentially defamatory claims, confrontational language
  - Could lead to online conflict or legal concerns
  - May alienate some audience segments
- **Suggestions:**
  - Consider if personal attacks align with your brand
  - Be mindful of defamation laws when making claims
  - Balance competitive spirit with respectful discourse
  - Consider potential backlash from the target's fanbase
  - Ensure claims can be substantiated if challenged

## License

MIT License

## Contributing

Built by [Athulya Anil](https://github.com/athulyaanil) for the Chrome Built-in AI Challenge.

## Links

- [Chrome Prompt API Docs](https://developer.chrome.com/docs/ai/built-in)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Chrome Built-in AI Challenge](https://chromeai.devpost.com/)
