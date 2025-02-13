(function() {
  // Default configuration
  var DEFAULT_CONFIG = {
    apiUrl: 'https://entitl-bots-674074734942.us-central1.run.app',
    retryAttempts: 1,
    retryDelay: 1000,
    timeout: 10000,
    fallbackBotHandling: {
      mode: 'toast' // Default mode is toast
    }
  };

  // Toast Manager Class
  function ToastManager() {
    this.container = null;
    this.createContainer();
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

    // Auto-remove after 2 seconds
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() {
        toast.remove();
      }, 300);
    }, 2000);
  };
  // Bot Detector Constructor
  function BotDetector(config) {
    this.config = Object.assign({}, DEFAULT_CONFIG, config || {});
    this.toastManager = new ToastManager();
  }

  // Collect client information
  BotDetector.prototype.getClientInfo = function() {
    try {
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
          connectionType: navigator.connection && navigator.connection.type,
          connectionSpeed: navigator.connection && navigator.connection.effectiveType,
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

    // Determine bot handling mode
    var botHandling = data.data.botHandling || this.config.fallbackBotHandling;

    // Handle bot detection based on mode
    if (isBot) {
      if (botHandling.mode === 'redirect') {
        // Hardcoded redirect URL when server specifies redirect
        this.redirectPage(detection);
      } else {
        // Default to toast
        this.showBotDetectedToast(detection);
      }
    } else {
      // Log successful human detection
      this.showToast('You are not a restricted Bot! :)', 'success');
    }

    return data;
  };

  // Redirect page for bot detection
  BotDetector.prototype.redirectPage = function() {
    window.location.href = 'https://entitl.ai/bot-detected';
  };

  // Show bot detected toast
  BotDetector.prototype.showBotDetectedToast = function(detection) {
    var content = [
      'You are a Bot! Try https://entitl.ai',
      'Confidence: ' + (detection.confidence * 100).toFixed(1) + '%',
      'User Agent Match: ' + (detection.userAgentMatch ? 'Yes' : 'No'),
      'IP Match: ' + (detection.ipMatch ? 'Yes' : 'No')
    ].join('<br>');

    this.showToast(content, 'warning');
  };

  // Generic toast method
  BotDetector.prototype.showToast = function(message, type) {
    this.toastManager.show({
      content: message,
      type: type,
      duration: 2000 // 2 seconds as requested
    });
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
          // Retry with exponential backoff
          return new Promise(function(resolve) {
            setTimeout(resolve, self.config.retryDelay * attempts);
          }).then(attemptDetection);
        }

        // Log final error if all attempts fail
        self.showToast('Bot detection failed', 'error');
        throw error;
      });
    }

    return attemptDetection();
  };

  // Initialize bot detector
  function initBotDetector(config) {
    var botDetector = new BotDetector(config);

    // Start bot detection
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
