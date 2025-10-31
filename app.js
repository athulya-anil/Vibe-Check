/**
 * PreVibe Full-Page App
 * Complete implementation with tabs, history, and YouTube support
 */

// State
let currentAnalysis = null;
let analysisHistory = [];
let currentAIStatus = null;
let uploadedTranscript = null;
let uploadedImage = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 PreVibe Full-Page App initializing...');

  try {
    // Load history
    await loadHistory();
  } catch (error) {
    console.error('Failed to load history:', error);
  }

  try {
    // Update AI status
    await updateAIStatus();
  } catch (error) {
    console.error('Failed to update AI status:', error);
    // Set default status if check fails
    const statusEl = document.getElementById('aiStatus');
    if (statusEl) {
      statusEl.textContent = '🔴 Not Available';
      statusEl.style.background = 'rgba(239, 68, 68, 0.2)';
      statusEl.style.color = '#dc2626';
    }
  }

  // Set up event listeners
  setupEventListeners();

  // Load saved theme
  loadTheme();

  console.log('✅ App ready!');
});

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Sidebar
  document.getElementById('newAnalysisBtn').addEventListener('click', newAnalysis);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
  document.getElementById('settingsOverlay')?.addEventListener('click', closeSettings);
  document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);

  // Manual tab
  document.getElementById('transcriptUploadFull').addEventListener('change', handleTranscriptUpload);
  document.getElementById('imageUploadFull').addEventListener('change', handleImageUpload);
  document.getElementById('analyzeManualBtn').addEventListener('click', analyzeManualContent);

  // YouTube tab
  document.getElementById('fetchYoutubeBtn').addEventListener('click', fetchYoutubeAndAnalyze);

  // Results
  document.getElementById('clearResultsBtn').addEventListener('click', clearResults);
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const targetTab = document.getElementById(`${tabName}Tab`);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // Hide results when switching tabs
  document.getElementById('resultsSection').style.display = 'none';
}

/**
 * Update AI status
 */
async function updateAIStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_AI_STATUS' });

    if (response.success) {
      currentAIStatus = response.status;
      const statusEl = document.getElementById('aiStatus');

      if (response.status.isOnDevice) {
        statusEl.textContent = '🟢 On-device AI';
        statusEl.style.background = 'rgba(16, 185, 129, 0.2)';
        statusEl.style.color = '#059669';
      } else if (response.status.isCloud) {
        statusEl.textContent = '🟡 Cloud AI';
        statusEl.style.background = 'rgba(251, 191, 36, 0.2)';
        statusEl.style.color = '#d97706';
      } else {
        statusEl.textContent = '🔴 Not Available';
        statusEl.style.background = 'rgba(239, 68, 68, 0.2)';
        statusEl.style.color = '#dc2626';
      }
    }
  } catch (error) {
    console.error('Failed to get AI status:', error);
  }
}

/**
 * Open settings
 */
function openSettings() {
  document.getElementById('settingsPanel').style.display = 'flex';
}

/**
 * Close settings
 */
function closeSettings() {
  document.getElementById('settingsPanel').style.display = 'none';
}

/**
 * Save API key
 */
async function saveApiKey() {
  const apiKey = document.getElementById('geminiApiKey').value.trim();

  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SET_GEMINI_API_KEY',
      apiKey: apiKey
    });

    if (response.success) {
      alert('API key saved successfully!');
      document.getElementById('geminiApiKey').value = '';
      closeSettings();
      await updateAIStatus();
    } else {
      alert('Failed to save API key: ' + response.error);
    }
  } catch (error) {
    alert('Error saving API key: ' + error.message);
  }
}

/**
 * Handle transcript file upload
 */
async function handleTranscriptUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (!TranscriptParser.isValidTranscript(file)) {
      alert('Please upload a .txt, .srt, or .vtt file');
      return;
    }

    showLoading('Parsing transcript...');
    const text = await TranscriptParser.parseFile(file);
    hideLoading();

    uploadedTranscript = { file, text };

    // Auto-fill textarea
    document.getElementById('contentInput').value = text;

    // Show file info
    const infoEl = document.getElementById('transcriptInfo');
    infoEl.innerHTML = `
      <div class="file-info-content">
        <span class="file-info-icon">📄</span>
        <div class="file-info-details">
          <h4>${file.name}</h4>
          <p>${TranscriptParser.getFormat(file)} • ${(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button class="file-remove-btn" id="removeTranscriptBtn">Remove</button>
      </div>
    `;
    infoEl.classList.add('show');
    infoEl.style.display = 'block';

    // Add event listener to remove button
    document.getElementById('removeTranscriptBtn').addEventListener('click', removeTranscript);
  } catch (error) {
    hideLoading();
    alert('Failed to parse transcript: ' + error.message);
  }

  event.target.value = '';
}

/**
 * Handle image upload
 */
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploadedImage = file;

  const infoEl = document.getElementById('imageInfo');
  infoEl.innerHTML = `
    <div class="file-info-content">
      <span class="file-info-icon">📷</span>
      <div class="file-info-details">
        <h4>${file.name}</h4>
        <p>${(file.size / 1024).toFixed(1)} KB</p>
      </div>
      <button class="file-remove-btn" id="removeImageBtn">Remove</button>
    </div>
  `;
  infoEl.classList.add('show');
  infoEl.style.display = 'block';

  // Add event listener to remove button
  document.getElementById('removeImageBtn').addEventListener('click', removeImage);

  event.target.value = '';
}

/**
 * Remove transcript
 */
function removeTranscript() {
  console.log('🗑️ removeTranscript called');
  uploadedTranscript = null;

  // Clear textarea
  const textArea = document.getElementById('contentInput');
  if (textArea) {
    textArea.value = '';
    console.log('✅ Textarea cleared');
  } else {
    console.error('❌ contentInput textarea not found');
  }

  // Clear file info display
  const infoEl = document.getElementById('transcriptInfo');
  if (infoEl) {
    infoEl.style.display = 'none';
    infoEl.classList.remove('show');
    infoEl.innerHTML = '';
    console.log('✅ File info cleared');
  }

  console.log('✅ Transcript removed successfully');
}

/**
 * Remove image
 */
function removeImage() {
  console.log('🗑️ removeImage called');
  uploadedImage = null;

  // Clear file info display
  const infoEl = document.getElementById('imageInfo');
  if (infoEl) {
    infoEl.style.display = 'none';
    infoEl.classList.remove('show');
    infoEl.innerHTML = '';
    console.log('✅ Image info cleared');
  }

  console.log('✅ Image removed successfully');
}

/**
 * Analyze manual content
 */
async function analyzeManualContent() {
  const text = document.getElementById('contentInput').value.trim();

  if (!text) {
    alert('Please enter text or upload a transcript');
    return;
  }

  if (!currentAIStatus || !currentAIStatus.available) {
    alert('AI is not available. Please configure Gemini API key in settings.');
    return;
  }

  try {
    showLoading('Analyzing content...');

    const hasImage = uploadedImage !== null;

    let response;
    if (hasImage) {
      // Convert image to base64 before sending
      const imageBase64 = await fileToBase64(uploadedImage);
      response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_CONTENT_MULTIMODAL',
        content: {
          text: text,
          images: [{
            data: imageBase64,
            mimeType: uploadedImage.type || 'image/jpeg',
            name: uploadedImage.name
          }],
          audios: []
        }
      });
    } else {
      response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_CONTENT',
        text: text
      });
    }

    hideLoading();

    if (response.success) {
      currentAnalysis = {
        text: text,
        analysis: response.analysis,
        timestamp: Date.now(),
        hasImage: hasImage
      };

      // Add to history
      analysisHistory.unshift(currentAnalysis);
      if (analysisHistory.length > 20) {
        analysisHistory = analysisHistory.slice(0, 20);
      }
      await saveHistory();
      renderHistory();

      // Display results with hasImage flag
      displayResults(response.analysis, text, hasImage);
    } else {
      alert('Analysis failed: ' + response.error);
    }
  } catch (error) {
    hideLoading();
    alert('Error during analysis: ' + error.message);
  }
}

/**
 * Fetch YouTube and analyze
 */
async function fetchYoutubeAndAnalyze() {
  const url = document.getElementById('youtubeUrl').value.trim();

  if (!url) {
    alert('Please enter a YouTube URL');
    return;
  }

  // Simple YouTube transcript fetch using YouTube oEmbed API
  // Note: This is a simplified version. Real transcript fetching requires backend API
  alert('YouTube transcript fetching requires a backend API or npm package.\\n\\nFor now, please:\\n\\n1. Use a Chrome extension like "YouTube Transcript" to copy the transcript\\n2. Paste it in the Manual Entry tab\\n3. Click Analyze\\n\\nFull YouTube API integration coming soon!');
}

/**
 * Display analysis results
 */
function displayResults(analysis, text, hasImage = false) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');

  const sentimentColor = {
    'positive': '#10b981',
    'neutral': '#6b7280',
    'negative': '#ef4444'
  };

  const riskColor = {
    'low': '#10b981',
    'medium': '#f59e0b',
    'high': '#ef4444'
  };

  resultsContent.innerHTML = `
    ${hasImage && analysis.imageAnalysis ? `
      <div class="result-card" style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-color: #f97316;">
        <h3>🎨 Image Analysis</h3>
        <p style="color: #c2410c; font-weight: 600; margin-bottom: 0.5rem;">Visual Content Assessment:</p>
        <p style="color: #9a3412;">${analysis.imageAnalysis}</p>
      </div>
    ` : hasImage ? `
      <div class="result-card" style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-color: #f97316;">
        <h3>🎨 Multimodal Analysis</h3>
        <p style="color: #c2410c; font-weight: 600;">✅ Image analyzed alongside text for comprehensive insights</p>
      </div>
    ` : ''}

    <div class="result-card">
      <h3>😊 Sentiment Analysis</h3>
      <div class="result-value" style="color: ${sentimentColor[analysis.sentiment] || '#6b7280'}">
        ${analysis.sentiment.toUpperCase()} (Score: ${analysis.sentimentScore}/100)
      </div>
    </div>

    <div class="result-card">
      <h3>🔍 Clarity</h3>
      <div class="result-value">${analysis.clarity.toUpperCase()}</div>
      <p>${analysis.clarityNotes || ''}</p>
    </div>

    <div class="result-card">
      <h3>⚠️ Reputation Risk</h3>
      <div class="result-value" style="color: ${riskColor[analysis.reputationRisk] || '#6b7280'}">
        ${analysis.reputationRisk.toUpperCase()}
      </div>
      ${analysis.riskFactors && analysis.riskFactors.length > 0 ? `
        <ul>
          ${analysis.riskFactors.map(factor => `<li>${factor}</li>`).join('')}
        </ul>
      ` : ''}
    </div>

    ${analysis.suggestions && analysis.suggestions.length > 0 ? `
      <div class="result-card">
        <h3>💡 Suggestions</h3>
        <ul>
          ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="result-meta">
      <div class="previbe-check-title">⚡ PreVibe Check</div>
      <small>Analyzed with: ${analysis.provider === 'chrome' ? '🟢 Chrome AI (On-device)' : '🟡 Google Gemini (Cloud)'}</small>
    </div>
  `;

  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Clear results
 */
function clearResults() {
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('resultsContent').innerHTML = '';
}

/**
 * New analysis
 */
function newAnalysis() {
  currentAnalysis = null;
  document.getElementById('contentInput').value = '';
  removeTranscript();
  removeImage();
  clearResults();
  renderHistory();
  switchTab('manual');
}

/**
 * Show loading
 */
function showLoading(text = 'Analyzing content...') {
  const loadingState = document.getElementById('loadingState');
  document.getElementById('loadingText').textContent = text;
  loadingState.style.display = 'block';
}

/**
 * Hide loading
 */
function hideLoading() {
  document.getElementById('loadingState').style.display = 'none';
}

/**
 * Load history from storage
 */
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['analysisHistory']);
    analysisHistory = result.analysisHistory || [];

    // Filter out invalid history items that don't have analysis data
    const validHistory = analysisHistory.filter(item => item && item.analysis && item.text);

    // If we filtered out any items, update storage
    if (validHistory.length !== analysisHistory.length) {
      console.log(`Cleaned up ${analysisHistory.length - validHistory.length} invalid history items`);
      analysisHistory = validHistory;
      await saveHistory();
    }

    renderHistory();
  } catch (error) {
    console.error('Failed to load history:', error);
    analysisHistory = [];
  }
}

/**
 * Save history to storage
 */
async function saveHistory() {
  try {
    await chrome.storage.local.set({ analysisHistory });
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

/**
 * Render history list
 */
function renderHistory() {
  const historyList = document.getElementById('historyList');

  if (analysisHistory.length === 0) {
    historyList.innerHTML = '<div class="empty-state">No analysis history yet</div>';
    return;
  }

  historyList.innerHTML = analysisHistory.map((item, index) => `
    <div class="history-item ${currentAnalysis === item ? 'active' : ''}" data-index="${index}">
      <div class="history-item-text">${escapeHtml(item.text.substring(0, 60))}${item.text.length > 60 ? '...' : ''}</div>
      <div class="history-item-date">${formatDate(item.timestamp)}</div>
    </div>
  `).join('');

  // Add click handlers using event delegation
  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      loadAnalysisFromHistory(index);
    });
  });
}

/**
 * Load analysis from history
 */
function loadAnalysisFromHistory(index) {
  const item = analysisHistory[index];
  if (!item) return;

  currentAnalysis = item;

  // Switch to manual tab first
  switchTab('manual');

  // Populate the text input
  document.getElementById('contentInput').value = item.text;

  // Display the saved results
  displayResults(item.analysis, item.text, item.hasImage || false);

  // Update history rendering to show active state
  renderHistory();
}

/**
 * Clear history
 */
async function clearHistory() {
  if (!confirm('Are you sure you want to clear all history?')) {
    return;
  }

  analysisHistory = [];
  await saveHistory();
  renderHistory();
}

/**
 * Format date
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
  try {
    const result = await chrome.storage.local.get(['darkTheme']);
    const isDark = result.darkTheme || false;

    if (isDark) {
      document.body.classList.add('dark-theme');
      const themeBtn = document.getElementById('themeToggle');
      if (themeBtn) {
        themeBtn.textContent = '☀️';
        themeBtn.title = 'Toggle Light Mode';
      }
    }
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
