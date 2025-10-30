/**
 * Hybrid AI Service for PreVibe
 * Automatically detects Chrome Prompt API availability and falls back to Google Gemini API
 */

class HybridAIService {
  constructor() {
    this.currentProvider = null;
    this.chromeAISession = null;
    this.geminiApiKey = null;
    this.checkInterval = null;
    this.listeners = [];

    // Configuration - using faster model and optimized settings
    this.GEMINI_MODEL = 'gemini-2.0-flash'; // Faster than 2.5
    this.GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${this.GEMINI_MODEL}:generateContent`;
    this.CHECK_INTERVAL_MS = 30000; // Check every 30 seconds for on-device AI
  }

  /**
   * Initialize the AI service
   */
  async initialize(geminiApiKey = null) {
    console.log('🚀 Initializing Hybrid AI Service...');
    this.geminiApiKey = geminiApiKey;

    // Try to load Gemini API key from storage if not provided
    if (!this.geminiApiKey) {
      const stored = await chrome.storage.local.get(['geminiApiKey']);
      this.geminiApiKey = stored.geminiApiKey;
    }

    // No API key available
    if (!this.geminiApiKey) {
      console.log('⚠️ No Gemini API key found. Please configure one in settings or add as environment variable.');
    }

    // Check for Chrome Prompt API availability
    const chromeAvailable = await this.checkChromeAI();

    if (chromeAvailable) {
      console.log('✅ Chrome Prompt API detected! Using on-device AI.');
      this.currentProvider = 'chrome';
    } else if (this.geminiApiKey) {
      console.log('⚠️ Chrome AI not available. Using Gemini API fallback.');
      this.currentProvider = 'gemini';
      // Start periodic checking for Chrome AI
      this.startPeriodicCheck();
    } else {
      console.warn('❌ No AI provider available. Please set up Gemini API key.');
      this.currentProvider = null;
    }

    this.notifyListeners();
    return this.getStatus();
  }

  /**
   * Check if Chrome's Prompt API is available (using NEW LanguageModel API)
   */
  async checkChromeAI() {
    try {
      // Check if the NEW API exists (LanguageModel global)
      if (typeof LanguageModel === 'undefined') {
        console.log('❌ LanguageModel API not available');
        return false;
      }

      // Check availability using new API with timeout
      const availabilityPromise = LanguageModel.availability();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Chrome AI check timeout')), 2000)
      );

      const availability = await Promise.race([availabilityPromise, timeoutPromise]);
      console.log('🔍 Chrome AI availability:', availability);

      if (availability === 'unavailable') {
        console.log('❌ Chrome AI: unavailable');
        return false;
      }

      if (availability === 'after-download') {
        console.log('⏳ Chrome AI model needs download...');
        return false;
      }

      // Try to create a session with MULTIMODAL support (with timeout)
      try {
        const params = await LanguageModel.params();
        const createPromise = LanguageModel.create({
          temperature: params.defaultTemperature || 0.7,
          topK: params.defaultTopK || 3,
          // Enable multimodal capabilities for images and audio
          expectedInputs: [
            { type: "text", languages: ["en"] },
            { type: "image" }
          ]
        });

        const sessionTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session creation timeout')), 3000)
        );

        this.chromeAISession = await Promise.race([createPromise, sessionTimeoutPromise]);
        console.log('✅ Chrome AI session created with multimodal support!');
        return true;
      } catch (sessionError) {
        console.log('ℹ️ Chrome AI session unavailable (expected if Gemini Nano not installed)');
        return false;
      }
    } catch (error) {
      console.log('❌ Chrome Prompt API check failed:', error.message);
      return false;
    }
  }

  /**
   * Start periodic checking for Chrome AI availability
   */
  startPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    console.log(`🔄 Starting periodic check for Chrome AI (every ${this.CHECK_INTERVAL_MS/1000}s)...`);

    this.checkInterval = setInterval(async () => {
      if (this.currentProvider !== 'chrome') {
        console.log('🔍 Checking if Chrome AI is now available...');
        const available = await this.checkChromeAI();

        if (available) {
          console.log('🎉 Chrome AI is now available! Switching from Gemini to on-device AI.');
          const oldProvider = this.currentProvider;
          this.currentProvider = 'chrome';
          clearInterval(this.checkInterval);
          this.checkInterval = null;
          this.notifyListeners(oldProvider, 'chrome');
        }
      }
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop periodic checking
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Add a listener for provider changes
   */
  onProviderChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners of provider changes
   */
  notifyListeners(oldProvider = null, newProvider = null) {
    const status = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback({ oldProvider, newProvider, status });
      } catch (error) {
        console.error('Error in provider change listener:', error);
      }
    });
  }

  /**
   * Get current AI service status
   */
  getStatus() {
    return {
      provider: this.currentProvider,
      available: this.currentProvider !== null,
      isOnDevice: this.currentProvider === 'chrome',
      isCloud: this.currentProvider === 'gemini',
      hasGeminiKey: !!this.geminiApiKey,
      checkingForChromeAI: !!this.checkInterval,
    };
  }

  /**
   * Set Gemini API key
   */
  async setGeminiApiKey(apiKey) {
    this.geminiApiKey = apiKey;
    await chrome.storage.local.set({ geminiApiKey: apiKey });

    if (!this.currentProvider && apiKey) {
      await this.initialize();
    }
  }

  /**
   * Main method: Generate AI response using available provider
   */
  async generateResponse(prompt, systemPrompt = null) {
    if (!this.currentProvider) {
      throw new Error('No AI provider available. Please set up Gemini API key or enable Chrome AI.');
    }

    if (this.currentProvider === 'chrome') {
      return await this.generateWithChromeAI(prompt, systemPrompt);
    } else if (this.currentProvider === 'gemini') {
      return await this.generateWithGemini(prompt, systemPrompt);
    }

    throw new Error('Unknown AI provider: ' + this.currentProvider);
  }

  /**
   * Generate response using Chrome's Prompt API
   */
  async generateWithChromeAI(prompt, systemPrompt = null) {
    try {
      // Ensure session exists
      if (!this.chromeAISession) {
        const available = await this.checkChromeAI();
        if (!available) {
          throw new Error('Chrome AI session lost. Falling back to Gemini.');
        }
      }

      // Combine system prompt with user prompt if provided
      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\nUser request: ${prompt}`
        : prompt;

      console.log('📤 Sending to Chrome AI:', fullPrompt.substring(0, 100) + '...');

      const response = await this.chromeAISession.prompt(fullPrompt);

      console.log('📥 Chrome AI response received');

      return {
        text: response,
        provider: 'chrome',
        model: 'Gemini Nano (on-device)',
      };
    } catch (error) {
      console.error('❌ Chrome AI error:', error);

      // If Chrome AI fails and we have Gemini, fall back
      if (this.geminiApiKey) {
        console.log('🔄 Falling back to Gemini API due to Chrome AI error...');
        this.currentProvider = 'gemini';
        this.startPeriodicCheck();
        return await this.generateWithGemini(prompt, systemPrompt);
      }

      throw error;
    }
  }

  /**
   * Generate response using Gemini API
   */
  async generateWithGemini(prompt, systemPrompt = null) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Combine system prompt with user prompt
      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;

      console.log('📤 Sending to Gemini API...');

      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800, // Reduced for faster response
            topK: 40,
            topP: 0.95
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      console.log('📥 Gemini API response received');

      return {
        text: text,
        provider: 'gemini',
        model: this.GEMINI_MODEL,
      };
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Analyze content with MULTIMODAL support (text, images, audio)
   * @param {Object} content - { text: string, images: File[], audios: File[] }
   */
  async analyzeContentMultimodal(content) {
    const { text, images = [], audios = [] } = content;

    const systemPrompt = `You are an AI content analyzer for YouTube creators. Respond ONLY with a JSON object (no markdown, no code blocks):

{
  "sentiment": "positive/neutral/negative",
  "sentimentScore": 0-100,
  "clarity": "clear/moderate/unclear",
  "clarityNotes": "brief explanation",
  "reputationRisk": "low/medium/high",
  "riskFactors": ["factor1", "factor2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "imageAnalysis": "if image: concise assessment (under 100 words)"
}

IMAGE RULES:
1. Describe what's in image (1 sentence)
2. Compare to text topic - if different subjects, state "could be unrelated/misleading"
3. Flag mismatches as medium/high risk
4. Use cautious language: "could be", "may be", "appears"
5. Keep under 100 words total`;

    let prompt = `Analyze this YouTube content:\n\nTEXT/TRANSCRIPT:\n${text}`;

    if (images.length > 0) {
      prompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE ANALYSIS REQUIRED - CRITICAL COMPARISON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The text above is about: [summarize main topic from text]
Now examine the ${images.length} image(s) provided.

STEP-BY-STEP ANALYSIS:

1. **Describe Image**: What is the main subject/topic of the image?

2. **CRITICAL TOPIC COMPARISON**:
   - Does the image topic match the text topic?
   - Example: If text is about "smart fan installation" but image shows "LinkedIn tech post", these are DIFFERENT topics
   - If topics are different → COULD BE misleading → Set reputationRisk: "medium" or "high"

3. **Check for Potentially Misleading Elements**:
   - Sensationalized imagery not matching content
   - Shocked faces, arrows, circles when content is straightforward
   - Professional/technical image for entertainment content (or vice versa)

4. **Controversial Visual Elements**:
   - Offensive symbols, inappropriate imagery, violent/sexual content
   - Hate symbols, political extremism, copyright violations

5. **VERDICT** (be concise, 2-3 sentences max):
   - If image and text discuss DIFFERENT topics → Clearly state they're unrelated and flag as potential clickbait
   - If same topic but sensationalized → Note the clickbait elements
   - If matching → Briefly confirm it matches

IMPORTANT: Keep imageAnalysis under 100 words. Be direct and concise.`;
    }
    if (audios.length > 0) {
      prompt += `\n\nNote: ${audios.length} audio file(s) provided for audio analysis.`;
    }

    // Use multimodal generation if we have media files
    const response = images.length > 0 || audios.length > 0
      ? await this.generateMultimodalResponse(prompt, systemPrompt, images, audios)
      : await this.generateResponse(prompt, systemPrompt);

    try {
      let jsonText = response.text.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const analysis = JSON.parse(jsonText);

      return {
        ...analysis,
        provider: response.provider,
        model: response.model,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return {
        sentiment: 'neutral',
        sentimentScore: 50,
        clarity: 'moderate',
        clarityNotes: response.text,
        reputationRisk: 'low',
        riskFactors: [],
        suggestions: ['Unable to parse structured analysis'],
        provider: response.provider,
        model: response.model,
        rawResponse: response.text,
      };
    }
  }

  /**
   * Analyze YouTube content for sentiment, clarity, and reputation risk (TEXT ONLY - legacy)
   */
  async analyzeContent(text) {
    return await this.analyzeContentMultimodal({ text });
  }

  /**
   * Generate response with multimodal inputs (images and/or audio)
   */
  async generateMultimodalResponse(prompt, systemPrompt, images = [], audios = []) {
    if (!this.currentProvider) {
      throw new Error('No AI provider available.');
    }

    // Multimodal only supported with Chrome AI for now
    if (this.currentProvider === 'chrome' && this.chromeAISession) {
      try {
        // Build multimodal message
        const content = [
          { type: 'text', value: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }
        ];

        // Add images
        for (const image of images) {
          content.push({ type: 'image', value: image });
        }

        // Add audio files
        for (const audio of audios) {
          content.push({ type: 'audio', value: audio });
        }

        console.log('📤 Sending multimodal request to Chrome AI...');
        const response = await this.chromeAISession.prompt([{
          role: 'user',
          content: content
        }]);

        return {
          text: response,
          provider: 'chrome',
          model: 'Gemini Nano (multimodal)',
        };
      } catch (error) {
        console.log('ℹ️ Chrome AI unavailable, using cloud fallback');
        // Fallback to text-only with Gemini
        if (this.geminiApiKey) {
          console.log('🔄 Using Gemini Cloud API...');
          return await this.generateWithGemini(prompt, systemPrompt);
        }
        throw error;
      }
    }

    // Fallback: Gemini with image support
    if (this.geminiApiKey && images.length > 0) {
      console.log('🔄 Using Gemini API with image support...');
      return await this.generateWithGeminiMultimodal(prompt, systemPrompt, images);
    }

    // Final fallback: text-only
    console.warn('⚠️ No multimodal support available. Falling back to text-only analysis.');
    return await this.generateResponse(prompt, systemPrompt);
  }

  /**
   * Generate response with Gemini API including images
   */
  async generateWithGeminiMultimodal(prompt, systemPrompt, images) {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      console.log('📤 Sending multimodal request to Gemini API...');

      // Handle images - they can be File objects or already converted to base64
      const imageParts = await Promise.all(images.map(async (image) => {
        let base64, mimeType;

        if (typeof image === 'object' && image.data) {
          // Already converted to base64 format
          base64 = image.data;
          mimeType = image.mimeType || 'image/jpeg';
        } else if (image instanceof File || image instanceof Blob) {
          // File object - convert to base64
          base64 = await this.fileToBase64(image);
          mimeType = image.type || 'image/jpeg';
        } else {
          throw new Error('Invalid image format');
        }

        return {
          inlineData: {
            mimeType: mimeType,
            data: base64
          }
        };
      }));

      // Build parts array: system prompt + user prompt + images
      const parts = [
        { text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt },
        ...imageParts
      ];

      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topK: 40,
            topP: 0.95
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No text in Gemini response');
      }

      return {
        text: text,
        provider: 'gemini',
        model: 'Gemini 2.0 Flash (multimodal)',
      };
    } catch (error) {
      console.error('❌ Gemini multimodal error:', error);
      throw error;
    }
  }

  /**
   * Convert File to base64 string
   */
  async fileToBase64(file) {
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

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.stopPeriodicCheck();

    if (this.chromeAISession) {
      try {
        await this.chromeAISession.destroy();
      } catch (error) {
        console.error('Error destroying Chrome AI session:', error);
      }
      this.chromeAISession = null;
    }

    this.currentProvider = null;
    this.listeners = [];
  }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HybridAIService;
}
