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

  // Styles definition moved before use
  const toastStyles = `
    .bot-detector-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    }

    .bot-detector-toast {
      min-width: 300px;
      max-width: 400px;
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateX(120%);
      transition: transform 0.3s ease-in-out;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      position: relative;
    }

    .bot-detector-toast.show {
      transform: translateX(0);
    }

    .bot-detector-toast.success {
      border-left: 4px solid #10B981;
    }

    .bot-detector-toast.warning {
      border-left: 4px solid #F59E0B;
    }

    .bot-detector-toast.error {
      border-left: 4px solid #EF4444;
    }

    .bot-detector-toast h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      padding-right: 20px;
    }

    .bot-detector-toast .content {
      margin: 0;
      font-size: 14px;
      color: #374151;
    }

    .bot-detector-toast .close-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
      padding: 4px;
      font-size: 18px;
      line-height: 1;
    }

    .bot-detector-toast .close-btn:hover {
      color: #374151;
    }

    .bot-detector-toast ul {
      list-style: none;
      padding: 0;
      margin: 8px 0 0 0;
    }

    .bot-detector-toast li {
      margin: 4px 0;
      font-size: 13px;
      color: #4B5563;
    }
  `;

  const botDetectorStyles = `
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
  `;

  class ToastManager {
    constructor() {
      this.container = null;
      this.toasts = new Set();
      this.createContainer();
    }

    createContainer() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'bot-detector-toast-container';
        document.body.appendChild(this.container);
      }
    }

    show(options) {
      const toast = document.createElement('div');
      toast.className = `bot-detector-toast ${options.type}`;

      toast.innerHTML = `
        <button class="close-btn">&times;</button>
        <h4>${options.title}</h4>
        ${options.content}
      `;

      this.container.appendChild(toast);
      this.toasts.add(toast);

      // Force a reflow before adding the show class
      toast.offsetHeight;

      // Add show class for animation
      setTimeout(() => toast.classList.add('show'), 10);

      // Setup close button
      const closeBtn = toast.querySelector('.close-btn');
      closeBtn.addEventListener('click', () => this.closeToast(toast));

      // Auto close after duration
      setTimeout(() => this.closeToast(toast), options.duration || 5000);
    }

    closeToast(toast) {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(toast);
      }, 300); // Match the CSS transition duration
    }

    clearAll() {
      this.toasts.forEach(toast => this.closeToast(toast));
    }
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
      if (!document.getElementById('bot-detector-toast-styles')) {
        const toastStyleSheet = document.createElement('style');
        toastStyleSheet.id = 'bot-detector-toast-styles';
        toastStyleSheet.textContent = toastStyles;
        document.head.appendChild(toastStyleSheet);
      }

      if (!document.getElementById('bot-detector-overlay-styles')) {
        const overlayStyleSheet = document.createElement('style');
        overlayStyleSheet.id = 'bot-detector-overlay-styles';
        overlayStyleSheet.textContent = botDetectorStyles;
        document.head.appendChild(overlayStyleSheet);
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
