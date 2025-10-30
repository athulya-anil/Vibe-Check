// Import AI Service
importScripts('ai-service.js');

// Global AI service instance
let aiService = null;

// Initialize AI service on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🚀 PreVibe starting up...');
  await initializeAI();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log("✅ PreVibe Chrome extension installed successfully!");
  await initializeAI();
});

/**
 * Initialize the AI service
 */
async function initializeAI() {
  try {
    aiService = new HybridAIService();

    // Listen for provider changes
    aiService.onProviderChange((event) => {
      console.log('🔄 AI Provider changed:', event);

      // Notify all open popups about the change
      chrome.runtime.sendMessage({
        type: 'AI_PROVIDER_CHANGED',
        status: event.status,
        oldProvider: event.oldProvider,
        newProvider: event.newProvider,
      }).catch(() => {
        // Ignore errors if no popup is open
      });
    });

    await aiService.initialize();

    const status = aiService.getStatus();
    console.log('✅ AI Service initialized:', status);
  } catch (error) {
    console.error('❌ Failed to initialize AI service:', error);
  }
}

/**
 * Ensure AI service is initialized
 */
async function ensureInitialized() {
  if (!aiService) {
    console.log('⚠️ AI Service not initialized, initializing now...');
    await initializeAI();
  }
  return aiService !== null;
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'GET_AI_STATUS':
          await ensureInitialized();
          if (aiService) {
            sendResponse({ success: true, status: aiService.getStatus() });
          } else {
            sendResponse({ success: false, error: 'AI service not initialized' });
          }
          break;

        case 'RESET_SERVICE':
          console.log('🔄 Resetting AI service...');
          await initializeAI();
          sendResponse({ success: true, status: aiService ? aiService.getStatus() : null });
          break;

        case 'SET_GEMINI_API_KEY':
          if (aiService) {
            await aiService.setGeminiApiKey(message.apiKey);
            sendResponse({ success: true, status: aiService.getStatus() });
          } else {
            sendResponse({ success: false, error: 'AI service not initialized' });
          }
          break;

        case 'ANALYZE_CONTENT':
          await ensureInitialized();
          if (!aiService) {
            sendResponse({ success: false, error: 'AI service not initialized' });
            break;
          }

          if (!aiService.getStatus().available) {
            sendResponse({
              success: false,
              error: 'No AI provider available. Please set up Gemini API key in settings.'
            });
            break;
          }

          try {
            const analysis = await aiService.analyzeContent(message.text);
            sendResponse({ success: true, analysis });
          } catch (error) {
            console.error('Analysis error:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'ANALYZE_CONTENT_MULTIMODAL':
          await ensureInitialized();
          if (!aiService) {
            sendResponse({ success: false, error: 'AI service not initialized' });
            break;
          }

          if (!aiService.getStatus().available) {
            sendResponse({
              success: false,
              error: 'No AI provider available. Please set up Gemini API key in settings.'
            });
            break;
          }

          try {
            const { text, images, audios } = message.content;
            const analysis = await aiService.analyzeContentMultimodal({ text, images, audios });
            sendResponse({ success: true, analysis });
          } catch (error) {
            console.error('Multimodal analysis error:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'GENERATE_RESPONSE':
          if (!aiService) {
            sendResponse({ success: false, error: 'AI service not initialized' });
            break;
          }

          if (!aiService.getStatus().available) {
            sendResponse({
              success: false,
              error: 'No AI provider available. Please set up Gemini API key in settings.'
            });
            break;
          }

          try {
            const response = await aiService.generateResponse(
              message.prompt,
              message.systemPrompt
            );
            sendResponse({ success: true, response });
          } catch (error) {
            console.error('Generation error:', error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate we'll respond asynchronously
  return true;
});
