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
    timeout: 10000, // Increased timeout to 10 seconds
    checkInterval: 1000 // Check every second for port closure
  };

  // Styles remain unchanged...
  const styles = `
    .bot-detector-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    }
    /* ... rest of the styles ... */
  `;

  class ToastManager {
    constructor() {
      this.container = null;
      this.createContainer();
    }

    // ... rest of ToastManager implementation ...
  }

  class BotDetector {
    constructor(config = {}) {
      this.config = {
        ...DEFAULT_CONFIG,
        ...config
      };
      this.abortController = null;
      this.checkTimeout = null;
      this.injectStyles();
      this.toastManager = new ToastManager();
    }

    getClientInfo() {
      try {
        return {
          url: window.location.href,
          referrer: document.referrer,
          screen: {
            width: window.screen?.width,
            height: window.screen?.height,
            colorDepth: window.screen?.colorDepth,
            pixelRatio: window.devicePixelRatio
          },
          window: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
          },
          navigator: {
            language: navigator.language,
            languages: navigator.languages,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            connectionType: navigator.connection?.type,
            connectionSpeed: navigator.connection?.effectiveType,
            vendor: navigator.vendor,
            cookieEnabled: navigator.cookieEnabled
          },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error collecting client info:', error);
        return {
          url: window.location.href,
          timestamp: new Date().toISOString(),
          error: 'Failed to collect complete client info'
        };
      }
    }

    async checkForBot() {
      let attempts = 0;
      const maxAttempts = this.config.retryAttempts;

      while (attempts <= maxAttempts) {
        try {
          // Clear any existing abort controller
          if (this.abortController) {
            this.abortController.abort();
          }
          this.abortController = new AbortController();

          // Set up timeout for the entire operation
          const timeoutPromise = new Promise((_, reject) => {
            this.checkTimeout = setTimeout(() => {
              this.abortController.abort();
              reject(new Error('Operation timed out'));
            }, this.config.timeout);
          });

          // Make the fetch request
          const fetchPromise = fetch(this.config.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(this.getClientInfo()),
            signal: this.abortController.signal,
            mode: 'cors',
            credentials: 'omit' // Explicitly disable credentials
          });

          // Race between fetch and timeout
          const response = await Promise.race([fetchPromise, timeoutPromise]);

          // Clear timeout since we got a response
          clearTimeout(this.checkTimeout);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          this.showDetectionResult(data);
          return data;

        } catch (error) {
          attempts++;
          console.warn(`Attempt ${attempts} failed:`, error);

          if (error.name === 'AbortError' || error.message === 'Operation timed out') {
            if (attempts > maxAttempts) {
              this.showError('Request timed out. Please try again later.');
              throw new Error('Detection request timed out after all attempts');
            }
          } else if (attempts > maxAttempts) {
            this.showError(error.message || 'Detection failed. Please try again later.');
            throw error;
          }

          // Wait before retrying
          await this.delay(this.config.retryDelay * attempts); // Exponential backoff
        } finally {
          // Cleanup
          clearTimeout(this.checkTimeout);
          this.abortController = null;
        }
      }
    }

    showDetectionResult(data) {
      if (!data || !data.data) {
        this.showError('Invalid response from server');
        return;
      }

      const isBot = data.data.isBot;
      const detection = data.data.detection;

      if (isBot) {
        this.toastManager.show({
          type: 'warning',
          title: 'AI Bot Detected!',
          content: `
            <ul>
              <li>Confidence: ${(detection.confidence * 100).toFixed(1)}%</li>
              <li>User Agent Match: ${detection.userAgentMatch ? 'Yes' : 'No'}</li>
              <li>IP Match: ${detection.ipMatch ? 'Yes' : 'No'}</li>
            </ul>
          `,
          duration: 7000
        });
      } else {
        this.toastManager.show({
          type: 'success',
          title: 'No AI Bot Detected',
          content: '<p class="content">Verification completed successfully</p>',
          duration: 5000
        });
      }
    }

    showError(message) {
      this.toastManager.show({
        type: 'error',
        title: 'Detection Error',
        content: `<p class="content">${message}</p>`,
        duration: 5000
      });
    }

    injectStyles() {
      if (!document.getElementById('bot-detector-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'bot-detector-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
      }
    }

    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    cleanup() {
      if (this.abortController) {
        this.abortController.abort();
      }
      clearTimeout(this.checkTimeout);
    }
  }

  // Make BotDetector available globally
  window.BotDetector = BotDetector;

  // Cleanup on page unload
  window.addEventListener('unload', () => {
    if (window.botDetector) {
      window.botDetector.cleanup();
    }
  });

  // Initialize with default configuration
  window.botDetector = new BotDetector();
  window.botDetector.checkForBot().catch(console.error);
})();
