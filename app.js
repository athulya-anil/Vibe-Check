/**
 * PreVibe Full-Page App
 * Standalone interface with history sidebar
 */

let currentAnalysis = null;
let analysisHistory = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 PreVibe Full-Page App initializing...');

  // Load history from storage
  await loadHistory();

  // Set up event listeners
  document.getElementById('newAnalysisBtn').addEventListener('click', newAnalysis);
  document.getElementById('analyzeBtn').addEventListener('click', analyzeContent);
  document.getElementById('clearResultsBtn').addEventListener('click', clearResults);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

  console.log('✅ App ready!');
});

/**
 * Load analysis history from storage
 */
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['analysisHistory']);
    analysisHistory = result.analysisHistory || [];
    renderHistory();
  } catch (error) {
    console.error('Failed to load history:', error);
    analysisHistory = [];
  }
}

/**
 * Save analysis history to storage
 */
async function saveHistory() {
  try {
    await chrome.storage.local.set({ analysisHistory });
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

/**
 * Render history list in sidebar
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

  // Add click listeners to history items
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
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

  // Update input
  document.getElementById('contentInput').value = item.text;

  // Show results
  displayResults(item.analysis, item.text);

  // Update active state in history
  renderHistory();
}

/**
 * Start new analysis
 */
function newAnalysis() {
  currentAnalysis = null;
  document.getElementById('contentInput').value = '';
  document.getElementById('inputSection').style.display = 'block';
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('loadingState').style.display = 'none';

  // Clear active state in history
  renderHistory();
}

/**
 * Analyze content
 */
async function analyzeContent() {
  const contentInput = document.getElementById('contentInput');
  const text = contentInput.value.trim();

  if (!text) {
    alert('Please enter some content to analyze');
    return;
  }

  // Show loading state
  document.getElementById('inputSection').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('loadingState').style.display = 'flex';

  try {
    console.log('📤 Sending analysis request...');

    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_CONTENT',
      text: text
    });

    if (!response.success) {
      throw new Error(response.error || 'Analysis failed');
    }

    console.log('📥 Analysis complete:', response.analysis);

    // Save to history
    const historyItem = {
      text: text,
      analysis: response.analysis,
      timestamp: Date.now()
    };

    // Add to beginning of history (most recent first)
    analysisHistory.unshift(historyItem);

    // Keep only last 50 items
    if (analysisHistory.length > 50) {
      analysisHistory = analysisHistory.slice(0, 50);
    }

    await saveHistory();
    currentAnalysis = historyItem;

    // Update UI
    renderHistory();
    displayResults(response.analysis, text);

  } catch (error) {
    console.error('❌ Analysis failed:', error);

    // Show error
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('inputSection').style.display = 'block';
    alert('Analysis failed: ' + error.message);
  }
}

/**
 * Display analysis results
 */
function displayResults(analysis, originalText) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('inputSection').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'block';

  const resultsContent = document.getElementById('resultsContent');

  // Sentiment icon
  const sentimentIcon = analysis.sentiment === 'positive' ? '😊' :
                       analysis.sentiment === 'negative' ? '😟' : '😐';

  // Risk icon
  const riskIcon = analysis.reputationRisk === 'high' ? '🚨' :
                   analysis.reputationRisk === 'medium' ? '⚠️' : '✅';

  // Clarity icon
  const clarityIcon = analysis.clarity === 'clear' ? '✨' :
                     analysis.clarity === 'unclear' ? '❓' : '💡';

  resultsContent.innerHTML = `
    <div class="result-item">
      <h3>${sentimentIcon} Sentiment</h3>
      <div class="result-value">${capitalizeFirst(analysis.sentiment)}</div>
      <div class="result-note">Score: ${analysis.sentimentScore}/100</div>
    </div>

    <div class="result-item">
      <h3>${clarityIcon} Clarity</h3>
      <div class="result-value">${capitalizeFirst(analysis.clarity)}</div>
      <div class="result-note">${escapeHtml(analysis.clarityNotes || 'No additional notes')}</div>
    </div>

    <div class="result-item">
      <h3>${riskIcon} Reputation Risk</h3>
      <div class="result-value">${capitalizeFirst(analysis.reputationRisk)}</div>
      ${analysis.riskFactors && analysis.riskFactors.length > 0 ? `
        <div class="result-note">
          <strong>Risk Factors:</strong><br>
          ${analysis.riskFactors.map(f => `• ${escapeHtml(f)}`).join('<br>')}
        </div>
      ` : ''}
    </div>

    ${analysis.suggestions && analysis.suggestions.length > 0 ? `
      <div class="result-item">
        <h3>💡 Suggestions</h3>
        <ul class="suggestions-list">
          ${analysis.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <span style="font-size: 12px; color: #9ca3af;">
        Powered by ${escapeHtml(analysis.model || 'AI')}
      </span>
    </div>
  `;
}

/**
 * Clear current results
 */
function clearResults() {
  newAnalysis();
}

/**
 * Clear all history
 */
async function clearHistory() {
  if (!confirm('Are you sure you want to clear all analysis history?')) {
    return;
  }

  analysisHistory = [];
  await saveHistory();
  renderHistory();
  newAnalysis();
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Utility: Capitalize first letter
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Utility: Format timestamp to readable date
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
