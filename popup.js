// State
let currentStatus = null;
let lastAnalysis = null;
let lastInputText = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await updateAIStatus();
  setupEventListeners();
  setupMessageListener();
});

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Analyze button
  document.getElementById('analyzeBtn').addEventListener('click', analyzeContent);

  // Clear button
  document.getElementById('clearBtn').addEventListener('click', clearAll);

  // Open Full App button
  document.getElementById('openFullApp').addEventListener('click', openFullApp);

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Load saved theme
  loadTheme();

  // Open in new tab button (will be added after analysis)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'openInTab') {
      openResultsInNewTab();
    }
  });
}

/**
 * Listen for messages from background script
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AI_PROVIDER_CHANGED') {
      console.log('🔄 Provider changed notification received:', message);
      updateAIStatusDisplay(message.status);

      // Show notification if switched to Chrome AI
      if (message.newProvider === 'chrome') {
        showNotification('Chrome AI is now available! Switched to on-device processing.', 'success');
      }
    }
  });
}

/**
 * Update AI status from background
 */
async function updateAIStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_AI_STATUS' });

    if (response.success) {
      currentStatus = response.status;
      updateAIStatusDisplay(response.status);
    } else {
      console.error('Failed to get AI status:', response.error);
      showError('Failed to get AI status: ' + response.error);
    }
  } catch (error) {
    console.error('Error getting AI status:', error);
    showError('Error connecting to AI service');
  }
}

/**
 * Update the UI with current AI status
 */
function updateAIStatusDisplay(status) {
  currentStatus = status;
  const statusEl = document.getElementById('aiStatus');
  const providerEl = document.getElementById('aiProvider');

  if (status.isOnDevice) {
    statusEl.textContent = 'On-device AI (Gemini Nano)';
    statusEl.className = 'status-badge status-success';
    providerEl.textContent = '✅ Using Chrome\'s built-in AI';
    providerEl.className = 'provider-info success';
  } else if (status.isCloud) {
    statusEl.textContent = 'Cloud AI (Gemini)';
    statusEl.className = 'status-badge status-warning';
    providerEl.textContent = '☁️ Using Google Gemini API' +
      (status.checkingForChromeAI ? ' (checking for on-device AI...)' : '');
    providerEl.className = 'provider-info warning';
  } else {
    statusEl.textContent = 'Not Available';
    statusEl.className = 'status-badge status-error';
    providerEl.textContent = '❌ Please configure Gemini API key in settings';
    providerEl.className = 'provider-info error';
  }

  // Settings hint removed (API key is hardcoded for local testing)
}

/**
 * Toggle settings panel
 */
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    // Load current API key (masked)
    loadApiKey();
  } else {
    panel.style.display = 'none';
  }
}

/**
 * Load API key into settings (masked for security)
 */
async function loadApiKey() {
  try {
    const stored = await chrome.storage.local.get(['geminiApiKey']);
    if (stored.geminiApiKey) {
      // Show masked version
      const masked = stored.geminiApiKey.substring(0, 8) + '...' + stored.geminiApiKey.slice(-4);
      document.getElementById('geminiApiKey').placeholder = masked;
    }
  } catch (error) {
    console.error('Error loading API key:', error);
  }
}

/**
 * Save Gemini API key
 */
async function saveApiKey() {
  const apiKey = document.getElementById('geminiApiKey').value.trim();

  if (!apiKey) {
    showError('Please enter a valid API key');
    return;
  }

  try {
    showLoading('Saving API key...');

    const response = await chrome.runtime.sendMessage({
      type: 'SET_GEMINI_API_KEY',
      apiKey: apiKey
    });

    hideLoading();

    if (response.success) {
      showNotification('API key saved successfully!', 'success');
      updateAIStatusDisplay(response.status);

      // Clear input and hide settings panel
      document.getElementById('geminiApiKey').value = '';
      document.getElementById('settingsPanel').style.display = 'none';
    } else {
      showError('Failed to save API key: ' + response.error);
    }
  } catch (error) {
    hideLoading();
    console.error('Error saving API key:', error);
    showError('Error saving API key: ' + error.message);
  }
}

/**
 * Analyze content using AI
 */
async function analyzeContent() {
  const input = document.getElementById('inputText').value.trim();

  if (!input) {
    showError('Please enter some text to analyze');
    return;
  }

  if (!currentStatus || !currentStatus.available) {
    showError('AI is not available. Please configure Gemini API key in settings.');
    return;
  }

  try {
    // Show loading state
    showLoading('Analyzing content...');
    clearResults();

    // Send analysis request to background
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_CONTENT',
      text: input
    });

    hideLoading();

    if (response.success) {
      await displayResults(response.analysis);
    } else {
      showError('Analysis failed: ' + response.error);
    }
  } catch (error) {
    hideLoading();
    console.error('Error analyzing content:', error);
    showError('Error analyzing content: ' + error.message);
  }
}

/**
 * Display analysis results
 */
async function displayResults(analysis) {
  // Store for results page
  lastAnalysis = analysis;
  lastInputText = document.getElementById('inputText').value.trim();

  const resultsDiv = document.getElementById('results');
  resultsDiv.style.display = 'block';

  // Store analysis data for opening in new tab (use chrome.storage instead of localStorage)
  const inputText = lastInputText;
  await chrome.storage.local.set({
    'previbe_analysis': JSON.stringify(analysis),
    'previbe_original_text': inputText
  });

  // Sentiment
  const sentimentEmoji = {
    positive: '😊',
    neutral: '😐',
    negative: '😟'
  }[analysis.sentiment] || '🤔';

  document.getElementById('sentiment').innerHTML = `
    <strong>${sentimentEmoji} Sentiment:</strong> ${analysis.sentiment}
    ${analysis.sentimentScore ? ` (${analysis.sentimentScore}/100)` : ''}
  `;

  // Clarity
  const clarityEmoji = {
    clear: '✨',
    moderate: '💫',
    unclear: '❓'
  }[analysis.clarity] || '📝';

  document.getElementById('clarity').innerHTML = `
    <strong>${clarityEmoji} Clarity:</strong> ${analysis.clarity}
    ${analysis.clarityNotes ? `<br><span class="note">${analysis.clarityNotes}</span>` : ''}
  `;

  // Reputation Risk
  const riskEmoji = {
    low: '✅',
    medium: '⚠️',
    high: '🚨'
  }[analysis.reputationRisk] || '⚠️';

  let riskHTML = `<strong>${riskEmoji} Reputation Risk:</strong> ${analysis.reputationRisk}`;

  if (analysis.riskFactors && analysis.riskFactors.length > 0) {
    riskHTML += '<br><span class="note">Factors: ' + analysis.riskFactors.join(', ') + '</span>';
  }

  document.getElementById('risk').innerHTML = riskHTML;

  // Suggestions
  if (analysis.suggestions && analysis.suggestions.length > 0) {
    const suggestionsHTML = `
      <div class="suggestions">
        <strong>💡 Suggestions:</strong>
        <ul>
          ${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    `;
    document.getElementById('suggestions').innerHTML = suggestionsHTML;
  } else {
    document.getElementById('suggestions').innerHTML = '';
  }

  // Show provider info
  const providerInfo = `<div class="provider-badge">Analyzed with: ${analysis.model || analysis.provider}</div>`;
  document.getElementById('providerBadge').innerHTML = providerInfo;
}

/**
 * Clear results
 */
function clearResults() {
  document.getElementById('sentiment').textContent = '';
  document.getElementById('clarity').textContent = '';
  document.getElementById('risk').textContent = '';
  document.getElementById('suggestions').innerHTML = '';
  document.getElementById('providerBadge').innerHTML = '';
}

/**
 * Show loading state
 */
function showLoading(message) {
  const loadingEl = document.getElementById('loading');
  loadingEl.textContent = message;
  loadingEl.style.display = 'block';

  // Disable analyze button
  document.getElementById('analyzeBtn').disabled = true;
}

/**
 * Hide loading state
 */
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('analyzeBtn').disabled = false;
}

/**
 * Show error message
 */
function showError(message) {
  showNotification(message, 'error');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notificationEl = document.getElementById('notification');
  notificationEl.textContent = message;
  notificationEl.className = `notification notification-${type}`;
  notificationEl.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    notificationEl.style.display = 'none';
  }, 5000);
}

/**
 * Open results in new tab
 */
async function openResultsInNewTab() {
  if (!lastAnalysis) {
    showError('No analysis data available');
    return;
  }

  // Encode data in URL hash to pass to results page
  const data = {
    analysis: lastAnalysis,
    text: lastInputText
  };

  const hash = encodeURIComponent(JSON.stringify(data));

  // Open results.html in a new tab with data in URL
  chrome.tabs.create({
    url: chrome.runtime.getURL('results-simple.html#' + hash)
  });
}

/**
 * Clear all content and reset
 */
async function clearAll() {
  // Clear input
  document.getElementById('inputText').value = '';

  // Hide results
  document.getElementById('results').style.display = 'none';

  // Clear state
  lastAnalysis = null;
  lastInputText = null;

  // Reset AI service
  await chrome.runtime.sendMessage({ type: 'RESET_SERVICE' });
  await updateAIStatus();

  showNotification('Cleared! Ready for new analysis', 'success');
}

/**
 * Open full app in new tab
 */
function openFullApp() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('app.html')
  });
}

/**
 * Toggle dark/light theme
 */
async function toggleTheme() {
  const body = document.body;
  const themeBtn = document.getElementById('themeToggle');

  const isDark = body.classList.toggle('dark-theme');
  themeBtn.textContent = isDark ? '☀️' : '🌙';
  themeBtn.title = isDark ? 'Toggle Light Mode' : 'Toggle Dark Mode';

  // Save preference
  await chrome.storage.local.set({ darkTheme: isDark });
}

/**
 * Load saved theme preference
 */
async function loadTheme() {
  const result = await chrome.storage.local.get(['darkTheme']);
  const isDark = result.darkTheme || false;

  if (isDark) {
    document.body.classList.add('dark-theme');
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.textContent = '☀️';
    themeBtn.title = 'Toggle Light Mode';
  }
}
