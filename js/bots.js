/**
 * Enhanced AI Bot Detection Client with Configurable Handling
 * @version 2.0.0
 */

(() => {
  // Default configuration
  const DEFAULT_CONFIG = {
    apiUrl: 'https://entitl-bots-674074734942.us-central1.run.app',
    retryAttempts: 2,
    retryDelay: 1000,
    timeout: 10000,
    checkInterval: 1000,
    botHandling: {
      mode: 'toast', // Possible modes: 'toast', 'block', 'redirect', 'custom'
      redirectUrl: null, // URL to redirect to if mode is 'redirect'
      customHandler: null, // Custom function for 'custom' mode
      blockMessage: 'Bot access is not allowed.' // Message to display if blocking
    }
  };

  const styles = `
    .bot-detector-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .bot-detector-block-message {
      background: #EF4444;
      padding: 20px;
      border-radius: 10px;
      max-width: 400px;
      text-align: center;
    }

    ${styles}
  `;

  class ToastManager {
    // ... (previous ToastManager implementation remains the same)
  }

  class BotDetector {
    constructor(config = {}) {
      this.config = {
        ...DEFAULT_CONFIG,
        ...config,
        botHandling: {
          ...DEFAULT_CONFIG.botHandling,
          ...(config.botHandling || {})
        }
      };
      this.abortController = null;
      this.checkTimeout = null;
      this.injectStyles();
      this.toastManager = new ToastManager();
    }

    getClientInfo() {
      // ... (previous getClientInfo implementation remains the same)
    }

    async checkForBot() {
      let attempts = 0;
      const maxAttempts = this.config.retryAttempts;

      while (attempts <= maxAttempts) {
        try {
          if (this.abortController) {
            this.abortController.abort();
          }
          this.abortController = new AbortController();

          const timeoutPromise = new Promise((_, reject) => {
            this.checkTimeout = setTimeout(() => {
              this.abortController.abort();
              reject(new Error('Operation timed out'));
            }, this.config.timeout);
          });

          const fetchPromise = fetch(this.config.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(this.getClientInfo()),
            signal: this.abortController.signal,
            mode: 'cors',
            credentials: 'omit'
          });

          const response = await Promise.race([fetchPromise, timeoutPromise]);
          clearTimeout(this.checkTimeout);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          return this.handleDetectionResult(data);

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

          await this.delay(this.config.retryDelay * attempts);
        } finally {
          clearTimeout(this.checkTimeout);
          this.abortController = null;
        }
      }
    }

    handleDetectionResult(data) {
      if (!data || !data.data) {
        this.showError('Invalid response from server');
        return data;
      }

      const isBot = data.data.isBot;
      const detection = data.data.detection;

      if (isBot) {
        switch (this.config.botHandling.mode) {
          case 'toast':
            this.showBotDetectedToast(detection);
            break;
          case 'block':
            this.blockPage(detection);
            break;
          case 'redirect':
            this.redirectPage(detection);
            break;
          case 'custom':
            this.executeCustomHandler(detection);
            break;
          default:
            this.showBotDetectedToast(detection);
        }

        // Throw an error to stop further page execution if needed
        throw new Error('Bot detected');
      } else {
        this.toastManager.show({
          type: 'success',
          title: 'No AI Bot Detected',
          content: '<p class="content">You are Human, not a Bot! :)</p>',
          duration: 2000
        });
      }

      return data;
    }

    showBotDetectedToast(detection) {
      this.toastManager.show({
        type: 'warning',
        title: 'AI Bot Detected!',
        content: `
          <ul>
            <li>Confidence: You are a Bot! You can license data from https://entitl.ai.</li>
            <li>Confidence: ${(detection.confidence * 100).toFixed(1)}%</li>
            <li>User Agent Match: ${detection.userAgentMatch ? 'Yes' : 'No'}</li>
            <li>IP Match: ${detection.ipMatch ? 'Yes' : 'No'}</li>
          </ul>
        `,
        duration: 7000
      });
    }

    blockPage(detection) {
      const overlay = document.createElement('div');
      overlay.className = 'bot-detector-overlay';
      overlay.innerHTML = `
        <div class="bot-detector-block-message">
          <h2>Access Blocked</h2>
          <p>${this.config.botHandling.blockMessage}</p>
          <p>Confidence: ${(detection.confidence * 100).toFixed(1)}%</p>
        </div>
      `;

      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.appendChild(overlay);

      // Stop page interactions
      document.addEventListener('click', this.preventInteraction, true);
      document.addEventListener('keydown', this.preventInteraction, true);
    }

    preventInteraction(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    redirectPage(detection) {
      const redirectUrl = this.config.botHandling.redirectUrl ||
                          'https://entitl.ai/bot-detected';

      // Append detection info to URL
      const url = new URL(redirectUrl);
      url.searchParams.append('confidence', (detection.confidence * 100).toFixed(1));
      url.searchParams.append('user_agent_match', detection.userAgentMatch);
      url.searchParams.append('ip_match', detection.ipMatch);

      window.location.href = url.toString();
    }

    executeCustomHandler(detection) {
      if (typeof this.config.botHandling.customHandler === 'function') {
        this.config.botHandling.customHandler(detection);
      } else {
        console.warn('Custom bot handler is not a function');
        this.showBotDetectedToast(detection);
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
      if (this.toastManager) {
        this.toastManager.clearAll();
      }

      // Remove event listeners and overlay if blocking
      document.removeEventListener('click', this.preventInteraction, true);
      document.removeEventListener('keydown', this.preventInteraction, true);

      const overlay = document.querySelector('.bot-detector-overlay');
      if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
      }
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
