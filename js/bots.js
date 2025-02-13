/**
 * AI Bot Detection Client with Toast Notifications
 * @version 1.0.0
 */

(() => {
  // Internal configuration
  const API_CONFIG = {
    url: 'https://entitl-bots-674074734942.us-central1.run.app'
  };

  // Styles for toast notifications
  const styles = `
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

  class ToastManager {
    constructor() {
      this.container = null;
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

      // Trigger reflow
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
      setTimeout(() => toast.remove(), 300);
    }
  }

  class BotDetector {
    constructor(config = {}) {
      this.config = {
        retryAttempts: config.retryAttempts || 2,
        retryDelay: config.retryDelay || 1000,
        timeout: config.timeout || 5000
      };

      // Initialize
      this.injectStyles();
      this.toastManager = new ToastManager();
    }

    // Collect client information
    getClientInfo() {
      return {
        url: window.location.href,
        referrer: document.referrer,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
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
    }

    async checkForBot() {
      const startTime = performance.now();
      let attempts = 0;

      while (attempts <= this.config.retryAttempts) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

          const response = await fetch(API_CONFIG.url, {
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

    showDetectionResult(data, detectionTime) {
      const isBot = data.data.isBot;
      const detection = data.data.detection;

      if (isBot) {
        this.toastManager.show({
          type: 'warning',
          title: 'AI Bot Detected!',
          content: `
            <ul>
              <li>Confidence: ${detection.confidence.toFixed(1)}%</li>
              <li>User Agent Match: ${detection.userAgentMatch ? 'Yes' : 'No'}</li>
              <li>IP Match: ${detection.ipMatch ? 'Yes' : 'No'}</li>
              <li>Detection Time: ${(detectionTime).toFixed(1)}ms</li>
            </ul>
          `,
          duration: 7000
        });
      } else {
        this.toastManager.show({
          type: 'success',
          title: 'No AI Bot Detected',
          content: `<p class="content">Verified in ${(detectionTime).toFixed(1)}ms</p>`,
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
  }

  // Make BotDetector available globally
  window.BotDetector = BotDetector;
})();

new BotDetector().checkForBot();
