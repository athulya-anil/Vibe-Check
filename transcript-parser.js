/**
 * Transcript Parser for VibeCheck
 * Supports: .txt, .srt, .vtt formats
 */

class TranscriptParser {
  /**
   * Parse transcript file and extract text
   * @param {File} file - The transcript file
   * @returns {Promise<string>} - Extracted plain text
   */
  static async parseFile(file) {
    const fileName = file.name.toLowerCase();
    const content = await this.readFile(file);

    if (fileName.endsWith('.txt')) {
      return this.parseTXT(content);
    } else if (fileName.endsWith('.srt')) {
      return this.parseSRT(content);
    } else if (fileName.endsWith('.vtt')) {
      return this.parseVTT(content);
    } else {
      throw new Error('Unsupported file format. Please use .txt, .srt, or .vtt files.');
    }
  }

  /**
   * Read file as text
   */
  static readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse plain text file
   */
  static parseTXT(content) {
    return content.trim();
  }

  /**
   * Parse SRT subtitle file
   * Format:
   * 1
   * 00:00:00,000 --> 00:00:02,000
   * Subtitle text here
   */
  static parseSRT(content) {
    const lines = content.split('\n');
    const textLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip sequence numbers
      if (/^\d+$/.test(line)) continue;

      // Skip timestamps
      if (line.includes('-->')) continue;

      // Skip empty lines
      if (line === '') continue;

      // Collect text
      textLines.push(line);
    }

    return textLines.join(' ').trim();
  }

  /**
   * Parse VTT (WebVTT) subtitle file
   * Format:
   * WEBVTT
   *
   * 00:00:00.000 --> 00:00:02.000
   * Subtitle text here
   */
  static parseVTT(content) {
    const lines = content.split('\n');
    const textLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip WEBVTT header
      if (line.startsWith('WEBVTT')) continue;

      // Skip NOTE blocks
      if (line.startsWith('NOTE')) continue;

      // Skip timestamps
      if (line.includes('-->')) continue;

      // Skip cue identifiers (optional identifiers before timestamps)
      if (/^[\w-]+$/.test(line) && i + 1 < lines.length && lines[i + 1].includes('-->')) continue;

      // Skip empty lines
      if (line === '') continue;

      // Collect text
      textLines.push(line);
    }

    return textLines.join(' ').trim();
  }

  /**
   * Validate file type
   */
  static isValidTranscript(file) {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.txt') ||
           fileName.endsWith('.srt') ||
           fileName.endsWith('.vtt');
  }

  /**
   * Get file format from filename
   */
  static getFormat(file) {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.txt')) return 'Plain Text';
    if (fileName.endsWith('.srt')) return 'SRT Subtitles';
    if (fileName.endsWith('.vtt')) return 'WebVTT Subtitles';
    return 'Unknown';
  }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TranscriptParser;
}
