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
   * Check if Chrome's Prompt API is available
   */
  async checkChromeAI() {
    try {
      // Check if the API exists
      if (!self.ai || !self.ai.languageModel) {
        console.log('❌ self.ai.languageModel not available');
        return false;
      }

      // Check capabilities
      const capabilities = await self.ai.languageModel.capabilities();
      console.log('🔍 Chrome AI capabilities:', capabilities);

      if (capabilities.available === 'no') {
        console.log('❌ Chrome AI capabilities: not available');
        return false;
      }

      if (capabilities.available === 'after-download') {
        console.log('⏳ Chrome AI model needs download...');
        return false;
      }

      // Try to create a session
      try {
        this.chromeAISession = await self.ai.languageModel.create({
          temperature: 0.7,
          topK: 3,
        });
        console.log('✅ Chrome AI session created successfully!');
        return true;
      } catch (sessionError) {
        console.error('❌ Failed to create Chrome AI session:', sessionError);
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
   * Analyze YouTube content for sentiment, clarity, and reputation risk
   */
  async analyzeContent(text) {
    const systemPrompt = `You are an AI content analyzer for YouTube creators. Analyze the provided text and respond ONLY with a JSON object (no markdown, no code blocks) in this exact format:

{
  "sentiment": "positive/neutral/negative",
  "sentimentScore": 0-100,
  "clarity": "clear/moderate/unclear",
  "clarityNotes": "brief explanation",
  "reputationRisk": "low/medium/high",
  "riskFactors": ["factor1", "factor2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Be concise and actionable.`;

    const prompt = `Analyze this YouTube content:\n\n${text}`;

    const response = await this.generateResponse(prompt, systemPrompt);

    try {
      // Try to parse JSON from response
      let jsonText = response.text.trim();

      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const analysis = JSON.parse(jsonText);

      return {
        ...analysis,
        provider: response.provider,
        model: response.model,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('Raw response:', response.text);

      // Fallback: return raw text with basic structure
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
