// VibeCheck YouTube Integration
console.log("VibeCheck content script active on YouTube page.");

// State
let vibeCheckButton = null;
let resultsOverlay = null;
let currentVideoId = null;
let isAnalyzing = false;

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/**
 * Initialize the extension on YouTube pages
 */
function init() {
  console.log('🚀 VibeCheck initializing on YouTube...');

  // Wait for YouTube to load
  waitForYouTubeLoad().then(() => {
    setupVideoPageDetection();
    injectStyles();
  });
}

/**
 * Wait for YouTube's main content to load
 */
function waitForYouTubeLoad() {
  return new Promise((resolve) => {
    const checkYouTube = () => {
      if (document.querySelector('ytd-app')) {
        resolve();
      } else {
        setTimeout(checkYouTube, 100);
      }
    };
    checkYouTube();
  });
}

/**
 * Set up detection for video page navigation
 */
function setupVideoPageDetection() {
  // Check initial page
  checkAndSetupVideoPage();

  // YouTube is a SPA, so watch for URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      checkAndSetupVideoPage();
    }
  }).observe(document.body, { subtree: true, childList: true });

  console.log('✅ Video page detection set up');
}

/**
 * Check if we're on a video page and set it up
 */
function checkAndSetupVideoPage() {
  const videoId = getVideoId();

  if (videoId && videoId !== currentVideoId) {
    console.log('📹 Video page detected:', videoId);
    currentVideoId = videoId;

    // Remove old button and overlay
    removeVibeCheckElements();

    // Wait for video info to load, then add button
    waitForElement('#description').then(() => {
      addVibeCheckButton();
    });
  } else if (!videoId && currentVideoId) {
    // Left video page
    currentVideoId = null;
    removeVibeCheckElements();
  }
}

/**
 * Get current video ID from URL
 */
function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

/**
 * Wait for an element to appear
 */
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found`));
      } else {
        setTimeout(checkElement, 100);
      }
    };

    checkElement();
  });
}

/**
 * Add VibeCheck button to YouTube UI
 */
function addVibeCheckButton() {
  if (vibeCheckButton) return;

  // Find the actions section (like, dislike, share buttons)
  const actionsSection = document.querySelector('#top-level-buttons-computed, #top-level-buttons');

  if (!actionsSection) {
    // Silently return - actions section may not be loaded yet
    return;
  }

  // Create VibeCheck button container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'vibecheck-button-container';
  buttonContainer.className = 'vibecheck-button-container';

  // Create button
  const button = document.createElement('button');
  button.id = 'vibecheck-analyze-btn';
  button.className = 'vibecheck-button';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"/>
      <circle cx="5" cy="6" r="1"/>
      <circle cx="11" cy="6" r="1"/>
      <path d="M4.5 10c.5 1.5 2 2.5 3.5 2.5s3-.5 3.5-2H4.5z"/>
    </svg>
    <span>VibeCheck Check</span>
  `;

  button.addEventListener('click', handleAnalyzeClick);

  buttonContainer.appendChild(button);
  actionsSection.appendChild(buttonContainer);

  vibeCheckButton = button;
  console.log('✅ VibeCheck button added');
}

/**
 * Handle analyze button click
 */
async function handleAnalyzeClick(e) {
  e.preventDefault();
  e.stopPropagation();

  if (isAnalyzing) return;

  try {
    isAnalyzing = true;
    updateButtonState('analyzing');

    // Extract video description
    const description = extractVideoDescription();

    if (!description) {
      showError('Could not extract video description. Try expanding the description first.');
      return;
    }

    console.log('📝 Extracted description:', description.substring(0, 100) + '...');

    // Send to background for analysis
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_CONTENT',
      text: description
    });

    if (response.success) {
      showResults(response.analysis);
    } else {
      showError(response.error || 'Analysis failed');
    }
  } catch (error) {
    console.error('❌ Analysis error:', error);
    showError(error.message);
  } finally {
    isAnalyzing = false;
    updateButtonState('default');
  }
}

/**
 * Extract video description from YouTube page
 */
function extractVideoDescription() {
  // Try different selectors for description
  const selectors = [
    '#description-inline-expander yt-attributed-string span',
    '#description yt-attributed-string span',
    'ytd-text-inline-expander #content',
    '#description-text'
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      const text = Array.from(elements)
        .map(el => el.textContent)
        .join(' ')
        .trim();

      if (text.length > 0) {
        return text;
      }
    }
  }

  // Fallback: try to get any description text
  const descriptionContainer = document.querySelector('#description');
  if (descriptionContainer) {
    return descriptionContainer.textContent.trim();
  }

  return null;
}

/**
 * Extract all video data including title, description, thumbnail, and transcript
 */
async function extractAllVideoData() {
  const data = {
    title: null,
    description: null,
    thumbnail: null,
    transcript: null,
    channelName: null
  };

  // Extract title
  const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title yt-formatted-string');
  if (titleElement) {
    data.title = titleElement.textContent.trim();
  }

  // Extract description
  data.description = extractVideoDescription();

  // Extract channel name
  const channelElement = document.querySelector('ytd-channel-name a, #channel-name a');
  if (channelElement) {
    data.channelName = channelElement.textContent.trim();
  }

  // Extract thumbnail - try multiple sources
  const thumbnailSelectors = [
    'link[rel="image_src"]',
    'meta[property="og:image"]',
    'video'
  ];

  for (const selector of thumbnailSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (selector === 'video') {
        // Try to get video poster or current frame
        const video = element;
        if (video.poster) {
          data.thumbnail = video.poster;
          break;
        }
      } else if (element.content) {
        data.thumbnail = element.content;
        break;
      } else if (element.href) {
        data.thumbnail = element.href;
        break;
      }
    }
  }

  // Try to extract transcript from captions
  data.transcript = await extractTranscript();

  return data;
}

/**
 * Extract transcript from YouTube captions
 */
async function extractTranscript() {
  try {
    console.log('🔍 Starting transcript extraction...');

    // Look for the transcript button - updated selectors for new YouTube UI
    const transcriptButtons = document.querySelectorAll('button[aria-label*="transcript" i], button[aria-label*="Show transcript" i], ytd-button-renderer:has([aria-label*="transcript" i])');

    console.log('Found transcript buttons:', transcriptButtons.length);

    if (transcriptButtons.length === 0) {
      console.log('❌ No transcript button found - video may not have captions');
      return null;
    }

    // Click to open transcript panel if not already open
    const transcriptButton = transcriptButtons[0];
    const isExpanded = transcriptButton.getAttribute('aria-expanded') === 'true';

    console.log('Transcript button expanded:', isExpanded);

    if (!isExpanded) {
      console.log('📂 Opening transcript panel...');
      transcriptButton.click();
      // Wait for transcript panel to load
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Wait a bit more for content to render
    await new Promise(resolve => setTimeout(resolve, 800));

    // Extract transcript text - updated selectors for new YouTube UI
    const transcriptSelectors = [
      'ytd-transcript-segment-renderer .segment-text',
      'ytd-transcript-segment-list-renderer yt-formatted-string',
      '[class*="transcript"] [class*="segment-text"]',
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] ytd-transcript-segment-renderer .segment-text'
    ];

    for (const selector of transcriptSelectors) {
      const segments = document.querySelectorAll(selector);
      console.log(`Trying selector "${selector}": found ${segments.length} segments`);

      if (segments.length > 0) {
        const transcript = Array.from(segments)
          .map(textEl => textEl.textContent.trim())
          .filter(text => text.length > 0)
          .join(' ');

        if (transcript.length > 0) {
          console.log('✅ Transcript extracted:', transcript.length, 'characters');
          console.log('Preview:', transcript.substring(0, 100) + '...');
          return transcript;
        }
      }
    }

    console.log('⚠️ Transcript panel opened but no content found');
    return null;
  } catch (error) {
    console.error('❌ Error extracting transcript:', error);
    return null;
  }
}

/**
 * Update button visual state
 */
function updateButtonState(state) {
  if (!vibeCheckButton) return;

  switch (state) {
    case 'analyzing':
      vibeCheckButton.innerHTML = `
        <span class="vibecheck-spinner"></span>
        <span>Analyzing...</span>
      `;
      vibeCheckButton.disabled = true;
      break;

    case 'default':
    default:
      vibeCheckButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
          <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"/>
          <circle cx="5" cy="6" r="1"/>
          <circle cx="11" cy="6" r="1"/>
          <path d="M4.5 10c.5 1.5 2 2.5 3.5 2.5s3-.5 3.5-2H4.5z"/>
        </svg>
        <span>VibeCheck Check</span>
      `;
      vibeCheckButton.disabled = false;
      break;
  }
}

/**
 * Show analysis results in overlay
 */
function showResults(analysis) {
  // Remove existing overlay
  if (resultsOverlay) {
    resultsOverlay.remove();
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'vibecheck-overlay';
  overlay.className = 'vibecheck-overlay';

  // Sentiment emoji
  const sentimentEmoji = {
    positive: '😊',
    neutral: '😐',
    negative: '😟'
  }[analysis.sentiment] || '🤔';

  // Clarity emoji
  const clarityEmoji = {
    clear: '✨',
    moderate: '💫',
    unclear: '❓'
  }[analysis.clarity] || '📝';

  // Risk emoji and color
  const riskInfo = {
    low: { emoji: '✅', color: '#10b981' },
    medium: { emoji: '⚠️', color: '#f59e0b' },
    high: { emoji: '🚨', color: '#ef4444' }
  }[analysis.reputationRisk] || { emoji: '❓', color: '#6b7280' };

  // Build suggestions HTML
  let suggestionsHtml = '';
  if (analysis.suggestions && analysis.suggestions.length > 0) {
    suggestionsHtml = `
      <div class="vibecheck-suggestions">
        <strong>💡 Suggestions:</strong>
        <ul>
          ${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Build risk factors HTML
  let riskFactorsHtml = '';
  if (analysis.riskFactors && analysis.riskFactors.length > 0) {
    riskFactorsHtml = `
      <div class="vibecheck-risk-factors">
        <strong>⚠️ Risk Factors:</strong>
        <ul>
          ${analysis.riskFactors.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  overlay.innerHTML = `
    <div class="vibecheck-overlay-content">
      <div class="vibecheck-overlay-header">
        <h2>VibeCheck Analysis Results</h2>
        <button class="vibecheck-close-btn">×</button>
      </div>

      <div class="vibecheck-overlay-body">
        <div class="vibecheck-result-item">
          <strong>${sentimentEmoji} Sentiment:</strong>
          <span class="vibecheck-capitalize">${analysis.sentiment}</span>
          ${analysis.sentimentScore ? `<span class="vibecheck-score">(${analysis.sentimentScore}/100)</span>` : ''}
        </div>

        <div class="vibecheck-result-item">
          <strong>${clarityEmoji} Clarity:</strong>
          <span class="vibecheck-capitalize">${analysis.clarity}</span>
          ${analysis.clarityNotes ? `<div class="vibecheck-note">${analysis.clarityNotes}</div>` : ''}
        </div>

        <div class="vibecheck-result-item" style="border-left-color: ${riskInfo.color}">
          <strong>${riskInfo.emoji} Reputation Risk:</strong>
          <span class="vibecheck-capitalize" style="color: ${riskInfo.color}">${analysis.reputationRisk}</span>
        </div>

        ${riskFactorsHtml}
        ${suggestionsHtml}

        <div class="vibecheck-provider-badge">
          Analyzed with ${analysis.provider === 'chrome' ? 'Chrome AI (Gemini Nano)' : 'Google Gemini AI'}
        </div>
      </div>
    </div>
  `;

  // Add to page
  document.body.appendChild(overlay);
  resultsOverlay = overlay;

  // Close button
  overlay.querySelector('.vibecheck-close-btn').addEventListener('click', () => {
    overlay.remove();
    resultsOverlay = null;
  });

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      resultsOverlay = null;
    }
  });

  console.log('✅ Results displayed');
}

/**
 * Show error message
 */
function showError(message) {
  // Create temporary error overlay
  const errorOverlay = document.createElement('div');
  errorOverlay.id = 'vibecheck-error';
  errorOverlay.className = 'vibecheck-error-toast';
  errorOverlay.textContent = '❌ ' + message;

  document.body.appendChild(errorOverlay);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorOverlay.remove();
  }, 5000);

  console.error('❌ VibeCheck error:', message);
}

/**
 * Remove VibeCheck elements from page
 */
function removeVibeCheckElements() {
  if (vibeCheckButton) {
    vibeCheckButton.closest('.vibecheck-button-container')?.remove();
    vibeCheckButton = null;
  }

  if (resultsOverlay) {
    resultsOverlay.remove();
    resultsOverlay = null;
  }
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_VIDEO_DATA') {
    (async () => {
      try {
        const videoData = await extractAllVideoData();
        if (videoData) {
          sendResponse({ success: true, data: videoData });
        } else {
          sendResponse({ success: false, error: 'Could not extract video data' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});

/**
 * Inject CSS styles into the page
 */
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* VibeCheck Button */
    .vibecheck-button-container {
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
    }

    .vibecheck-button {
      display: inline-flex;
      align-items: center;
      background: #eab308;
      color: white;
      border: none;
      border-radius: 18px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .vibecheck-button:hover {
      background: #ca8a04;
      transform: scale(1.05);
    }

    .vibecheck-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }

    .vibecheck-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      margin-right: 6px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: vibecheck-spin 0.6s linear infinite;
    }

    @keyframes vibecheck-spin {
      to { transform: rotate(360deg); }
    }

    /* Overlay */
    .vibecheck-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: vibecheck-fadeIn 0.2s ease-out;
    }

    @keyframes vibecheck-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .vibecheck-overlay-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: vibecheck-slideUp 0.3s ease-out;
    }

    @keyframes vibecheck-slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .vibecheck-overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 2px solid #eab308;
    }

    .vibecheck-overlay-header h2 {
      margin: 0;
      font-size: 20px;
      color: #374151;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .vibecheck-close-btn {
      background: transparent;
      border: none;
      font-size: 32px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .vibecheck-close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .vibecheck-overlay-body {
      padding: 20px;
    }

    .vibecheck-result-item {
      padding: 12px;
      margin-bottom: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #eab308;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .vibecheck-result-item strong {
      display: block;
      margin-bottom: 4px;
      color: #374151;
      font-size: 14px;
    }

    .vibecheck-result-item span {
      font-size: 14px;
      color: #6b7280;
    }

    .vibecheck-capitalize {
      text-transform: capitalize;
      font-weight: 600;
    }

    .vibecheck-score {
      margin-left: 8px;
      color: #9ca3af;
      font-size: 13px;
    }

    .vibecheck-note {
      margin-top: 8px;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }

    .vibecheck-suggestions,
    .vibecheck-risk-factors {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .vibecheck-risk-factors {
      background: #fef3c7;
      border-color: #fde68a;
    }

    .vibecheck-suggestions strong,
    .vibecheck-risk-factors strong {
      display: block;
      margin-bottom: 8px;
      color: #1e40af;
      font-size: 14px;
    }

    .vibecheck-risk-factors strong {
      color: #92400e;
    }

    .vibecheck-suggestions ul,
    .vibecheck-risk-factors ul {
      margin: 0;
      padding-left: 20px;
    }

    .vibecheck-suggestions li,
    .vibecheck-risk-factors li {
      margin-bottom: 4px;
      color: #1e3a8a;
      font-size: 13px;
      line-height: 1.5;
    }

    .vibecheck-risk-factors li {
      color: #78350f;
    }

    .vibecheck-provider-badge {
      text-align: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* Error Toast */
    .vibecheck-error-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      color: #991b1b;
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid #fecaca;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
      animation: vibecheck-slideIn 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    @keyframes vibecheck-slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;

  document.head.appendChild(style);
  console.log('✅ Styles injected');
}
