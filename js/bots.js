/**
 * AI Bot Detection Client with Toast Notifications
 * @version 1.0.0
 */

(() => {
  // Default configuration
  const DEFAULT_CONFIG = {
    apiUrl: 'https://entitl-bots-674074734942.us-central1.run.app',
    retryAttempts: 2,
    retryDelay: 1000,
    timeout: 5000
  };

  // Styles for toast notifications (unchanged)
  const styles = `
    .bot-detector-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    }
    /* ... rest of the styles remain unchanged ... */
  `;

  class ToastManager {
    // ToastManager implementation remains unchanged
  }

  class BotDetector {
    constructor(config = {}) {
      this.config = {
        ...DEFAULT_CONFIG,
        ...config,
        retryAttempts: config.retryAttempts || DEFAULT_CONFIG.retryAttempts,
        retryDelay: config.retryDelay || DEFAULT_CONFIG.retryDelay,
        timeout: config.timeout || DEFAULT_CONFIG.timeout
      };

      // Initialize
      this.injectStyles();
      this.toastManager = new ToastManager();
    }

    // Rest of the BotDetector class implementation remains the same, but update the fetch call:
    async checkForBot() {
      const startTime = performance.now();
      let attempts = 0;

      while (attempts <= this.config.retryAttempts) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

          const response = await fetch(this.config.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(this.getClientInfo()),
            mode: 'cors',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const detectionTime = performance.now() - startTime;

          this.showDetectionResult(data, detectionTime);
          return data;

        } catch (error) {
          attempts++;

          if (error.name === 'AbortError') {
            if (attempts > this.config.retryAttempts) {
              this.showError('Request timed out');
              throw new Error('Detection request timed out');
            }
            await this.delay(this.config.retryDelay);
            continue;
          }

          if (attempts > this.config.retryAttempts) {
            this.showError(error.message);
            throw error;
          }

          await this.delay(this.config.retryDelay);
        }
      }
    }

    // Rest of the methods remain unchanged
  }

  // Make BotDetector available globally
  window.BotDetector = BotDetector;
})();

// Example initialization with custom API URL:
new BotDetector({
  apiUrl: 'https://entitl-bots-674074734942.us-central1.run.app'
}).checkForBot();
