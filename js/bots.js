(async function() {
    // Constants
    const CONFIG = {
        ENDPOINT: 'https://entitl-org-bots-674074734942.us-central1.run.app',
        TOAST_DURATION: {
            DEFAULT: 3000,
            ERROR: 5000
        },
        ANIMATION: {
            DURATION: 300,
            OFFSET: '150%'
        }
    };

    // Add toast styles via JavaScript with entitl- prefix
    const styles = `
        .entitl-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 4px;
            background: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transform: translateX(150%);
            transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
            z-index: 1000;
            opacity: 0;
            max-width: 80vw;
            word-break: break-word;
        }

        .entitl-toast.entitl-show {
            transform: translateX(0);
            opacity: 1;
        }

        .entitl-toast.entitl-info {
            background-color: #2196F3;
            color: white;
        }

        .entitl-toast.entitl-success {
            background-color: #4CAF50;
            color: white;
        }

        .entitl-toast.entitl-warning {
            background-color: #FFC107;
            color: black;
        }

        .entitl-toast.entitl-error {
            background-color: #F44336;
            color: white;
        }
    `;

    // Initialize toast functionality
    function initializeToast() {
        const styleSheet = document.createElement("style");
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        const toastContainer = document.createElement("div");
        toastContainer.id = "entitl-toast";
        toastContainer.className = "entitl-toast";
        document.body.appendChild(toastContainer);
    }

    /**
     * Shows a toast message to the user
     * @param {Object} config Toast configuration
     */
    function showToast({ message, type = 'info', duration = CONFIG.TOAST_DURATION.DEFAULT, requestId = null }) {
        const toast = document.getElementById("entitl-toast");
        if (!toast) return; // Guard clause

        // Clear any existing timeouts
        if (toast.timeoutId) {
            clearTimeout(toast.timeoutId);
        }

        // Build toast message
        const toastMessage = requestId ? `${message} (Request ID: ${requestId})` : message;

        // Update toast content and classes
        toast.textContent = toastMessage;
        toast.className = "entitl-toast"; // Reset classes

        // Force reflow to ensure transition works
        void toast.offsetWidth;

        // Add show class and type
        toast.className = `entitl-toast entitl-show entitl-${type}`;

        // Set timeout to hide toast
        toast.timeoutId = setTimeout(() => {
            toast.style.transform = `translateX(${CONFIG.ANIMATION.OFFSET})`;
            toast.style.opacity = '0';

            // Remove classes after transition
            setTimeout(() => {
                toast.className = "entitl-toast";
            }, CONFIG.ANIMATION.DURATION);
        }, duration);
    }

    /**
     * Formats the bot detection result for display
     * @param {Object} result Bot detection result
     * @returns {Object} Formatted message and type
     */
    function formatBotResult(result) {
        if (!result?.isBot) {
            return {
                message: 'Human visitor detected',
                type: 'success'
            };
        }

        if (result.isAllowed) {
            return {
                message: `Legitimate bot detected: ${result.botType}`,
                type: 'info'
            };
        }

        return {
            message: `Suspicious bot detected: ${result.category}${result.reason ? ` - ${result.reason}` : ''}`,
            type: 'warning'
        };
    }

    /**
     * Handles error responses from the API
     * @param {Response} response Fetch Response object
     * @throws {Error} Enhanced error with details
     */
    async function handleErrorResponse(response) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            throw new Error(`HTTP ${response.status}: ${response.statusText || 'Unknown error occurred'}`);
        }

        const error = new Error(errorData.error || 'Unknown error occurred');
        error.status = response.status;
        error.requestId = errorData.requestId;
        error.details = errorData.details;

        throw error;
    }

    /**
     * Maps HTTP status codes to user-friendly messages
     * @param {Error} error Error object
     * @returns {Object} Formatted error message and type
     */
    function formatErrorMessage(error) {
        const baseMessage = error.message;

        const errorMap = {
            400: {
                message: `Invalid request: ${error.details?.join(', ') || baseMessage}`,
                type: 'warning'
            },
            403: {
                message: 'Access denied',
                type: 'warning'
            },
            429: {
                message: 'Rate limit exceeded. Please try again later.',
                type: 'warning'
            },
            405: {
                message: 'Method not allowed',
                type: 'warning'
            }
        };

        return errorMap[error.status] || {
            message: baseMessage,
            type: 'error'
        };
    }

    /**
     * Performs the bot detection check
     * @returns {Promise<Object>} Bot detection result
     */
    async function checkBot() {
        try {
            const response = await fetch(CONFIG.ENDPOINT, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    userAgent: navigator.userAgent,
                    domain: window.location.hostname,
                    referer: document.referrer
                })
            });

            if (!response.ok) {
                await handleErrorResponse(response);
            }

            const result = await response.json();

            if (!result?.success) {
                throw new Error(result.error || 'Invalid response format');
            }

            const formattedResult = formatBotResult(result.data);

            showToast({
                message: formattedResult.message,
                type: formattedResult.type,
                requestId: result.requestId
            });

            return result.data;

        } catch (error) {
            console.error('Bot check failed:', {
                error: {
                    message: error.message,
                    status: error.status,
                    requestId: error.requestId
                },
                timestamp: new Date().toISOString()
            });

            const formattedError = formatErrorMessage(error);
            showToast({
                message: formattedError.message,
                type: formattedError.type,
                requestId: error.requestId,
                duration: CONFIG.TOAST_DURATION.ERROR
            });

            throw error;
        }
    }

    // Initialize and run
    try {
        initializeToast();
        const result = await checkBot();
        console.debug('Bot check complete:', {
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Error already handled in checkBot()
    }
})();
