(function() {
  // Default configuration
  var DEFAULT_CONFIG = {
    apiUrl: 'https://us-central1-pixel-432500.cloudfunctions.net/entitl-bot-tracker',
    retryAttempts: 1,
    retryDelay: 1000,
    timeout: 10000,
    toastDuration: 3500  // Added default toast duration
  };

  const environment = 'production';

  // Toast Manager Class - Only created when needed
  function ToastManager() {
    this.container = null;
  }

  ToastManager.prototype.createContainer = function() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'bot-detector-toast-container';
      this.container.style.position = 'fixed';
      this.container.style.top = '20px';
      this.container.style.right = '20px';
      this.container.style.zIndex = '9999';
      this.container.style.maxWidth = '300px';
      document.body.appendChild(this.container);
    }
  };

  ToastManager.prototype.show = function(options) {
    // Create container only when first toast needs to be shown
    this.createContainer();

    var toast = document.createElement('div');

    // Toast styling
    toast.style.backgroundColor = 'white';
    toast.style.border = '1px solid #ddd';
    toast.style.padding = '15px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    toast.style.color = 'black';

    // Type-specific styling
    switch(options.type) {
      case 'warning':
        toast.style.borderLeft = '4px solid #F59E0B';
        break;
      case 'error':
        toast.style.borderLeft = '4px solid #EF4444';
        break;
      case 'success':
        toast.style.borderLeft = '4px solid #10B981';
        toast.style.cursor = 'pointer';
        toast.onclick = function() {
          window.open("https://entitl.org/bot-tracker.html", "_blank");
        };
        break;
    }

    // Set content
    toast.innerHTML = options.content || options.message;

    // Add to container
    this.container.appendChild(toast);

    // Fade in
    setTimeout(function() {
      toast.style.opacity = '1';
    }, 10);

    // Auto-remove after specified duration
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() {
        toast.remove();
        // Remove container if no toasts left
        if (this.container && !this.container.hasChildNodes()) {
          this.container.remove();
          this.container = null;
        }
      }.bind(this), 500);
    }.bind(this), options.duration);
  };

  // Bot Detector Constructor
  function BotDetector(config) {
    this.config = Object.assign({}, DEFAULT_CONFIG, config || {});
    this.toastManager = null; // Initialize only when needed
  }

  // Collect client information - removed screen and window parameters
  BotDetector.prototype.getClientInfo = function() {
    try {
      return {
        url: window.location.href,
        navigator: {
          language: navigator.language,
          languages: navigator.languages,
          platform: navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: navigator.deviceMemory,
          connectionType: navigator.connection && navigator.connection.type,
          connectionSpeed: navigator.connection && navigator.connection.effectiveType,
          vendor: navigator.vendor,
          cookieEnabled: navigator.cookieEnabled
        },
        timestamp: new Date().toISOString(),
        environment: environment
      };
    } catch (error) {
      console.error('Error collecting client info:', error);
      return {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        environment: environment,
        error: 'Failed to collect complete client info'
      };
    }
  };

  // Show toast - creates ToastManager only when needed
  BotDetector.prototype.showToast = function(message, type) {
    if (!this.toastManager) {
      this.toastManager = new ToastManager();
    }
    this.toastManager.show({
      content: message,
      type: type,
      duration: this.config.toastDuration
    });
  };

  // Handle bot detection result
  BotDetector.prototype.handleDetectionResult = function(data) {
    // Validate response
    if (!data || !data.data) {
      this.showToast('Detection error', 'error');
      return data;
    }

    // Check if bot is detected
    var isBot = data.data.isBot;
    var detection = data.data.detection || {};
    var botHandling = data.data.botHandling;

    console.log("action: " + botHandling.action);
    console.log("message: " + botHandling.message);

    if (isBot) {
      const entitl_ua = data.request.headers.userAgent;
      const bot_params = new URLSearchParams({
        entitl_ua: entitl_ua,
        entitl_ip_match: detection.ipMatch
      });
      window.location.href = 'https://entitl.ai/?' + bot_params.toString();
    } else if (botHandling.action === 'toast') {
      this.showToast(botHandling.message, 'success');
    }

    return data;
  };

  // Bot detection method with retry mechanism
  BotDetector.prototype.checkForBot = function() {
    var self = this;
    var attempts = 0;
    var maxAttempts = this.config.retryAttempts;

    function attemptDetection() {
      attempts++;

      return fetch(self.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(self.getClientInfo()),
        mode: 'cors',
        credentials: 'omit'
      })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('HTTP error: ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        return self.handleDetectionResult(data);
      })
      .catch(function(error) {
        console.warn('Bot detection attempt ' + attempts + ' failed:', error);

        if (attempts < maxAttempts) {
          return new Promise(function(resolve) {
            setTimeout(resolve, self.config.retryDelay * attempts);
          }).then(attemptDetection);
        }

        self.showToast('Bot detection failed', 'error');
        throw error;
      });
    }

    return attemptDetection();
  };

  // Initialize bot detector
  function initBotDetector(config) {
    var botDetector = new BotDetector(config);
    botDetector.checkForBot().catch(function(error) {
      console.error('Bot detection initialization failed:', error);
    });
    return botDetector;
  }

  // Expose to global scope
  window.BotDetector = BotDetector;
  window.initBotDetector = initBotDetector;

  // Automatically initialize if no custom configuration is needed
  window.botDetector = initBotDetector();
})();
