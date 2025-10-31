// Import AI Service
importScripts('ai-service.js');

// Global AI service instance
let aiService = null;

// Initialize AI service on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🚀 VibeCheck starting up...');
  await initializeAI();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log("✅ VibeCheck Chrome extension installed successfully!");
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

        case 'FETCH_YOUTUBE_DATA':
          try {
            const videoId = message.videoId;
            console.log('📹 Fetching YouTube data for:', videoId);

            let videoData = null;

            // Query for any open YouTube tabs with this video
            const tabs = await chrome.tabs.query({ url: `*://www.youtube.com/watch?v=${videoId}*` });

            if (tabs.length > 0) {
              // If tab is found, try to extract from there
              try {
                const result = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_VIDEO_DATA' });
                if (result && result.success && result.data) {
                  videoData = result.data;
                  console.log('✅ Extracted data from tab:', {
                    hasTitle: !!videoData.title,
                    hasDescription: !!videoData.description,
                    hasThumbnail: !!videoData.thumbnail,
                    hasTranscript: !!videoData.transcript
                  });
                }
              } catch (tabError) {
                console.log('Could not extract from tab, falling back to API');
              }
            }

            // Fallback: Fetch from YouTube's oEmbed API for basic info
            if (!videoData || (!videoData.title && !videoData.description)) {
              const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
              const oembedResponse = await fetch(oembedUrl);

              if (!oembedResponse.ok) {
                throw new Error('Invalid YouTube URL or video not found');
              }

              const oembedData = await oembedResponse.json();
              videoData = {
                title: oembedData.title,
                channelName: oembedData.author_name,
                thumbnail: oembedData.thumbnail_url,
                description: null,
                transcript: null
              };
            }

            // Build content text for analysis
            let contentText = '';
            if (videoData.title) {
              contentText += `Title: ${videoData.title}\n\n`;
            }
            if (videoData.channelName) {
              contentText += `Channel: ${videoData.channelName}\n\n`;
            }
            if (videoData.description) {
              contentText += `Description:\n${videoData.description}\n\n`;
            }
            if (videoData.transcript) {
              contentText += `Transcript:\n${videoData.transcript}\n\n`;
            }

            if (!contentText) {
              contentText = 'No content available for this video.';
            }

            // Fetch thumbnail image as base64 if available
            let thumbnailBase64 = null;
            if (videoData.thumbnail) {
              try {
                const imageResponse = await fetch(videoData.thumbnail);
                if (imageResponse.ok) {
                  const blob = await imageResponse.blob();
                  const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result.split(',')[1];
                      resolve(base64String);
                    };
                    reader.readAsDataURL(blob);
                  });
                  thumbnailBase64 = base64;
                  console.log('✅ Thumbnail fetched successfully');
                }
              } catch (imageError) {
                console.log('⚠️ Could not fetch thumbnail:', imageError);
              }
            }

            sendResponse({
              success: true,
              content: contentText,
              thumbnail: thumbnailBase64,
              hasTranscript: !!videoData.transcript,
              videoData: videoData
            });
          } catch (error) {
            console.error('YouTube fetch error:', error);
            sendResponse({
              success: false,
              error: 'Could not fetch YouTube data. ' + error.message
            });
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
