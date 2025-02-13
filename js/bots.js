(async function() {
    /**
     * Shows a toast message to the user
     * @param {Object} config Toast configuration
     */
    function showToast({ message, type = 'info', duration = 3000, requestId = null }) {
        const toast = document.getElementById("toast");
        if (!toast) {
            console.error('Toast element not found');
            return;
        }

        // Build toast message
        let toastMessage = message;
        if (requestId) {
            toastMessage += ` (Request ID: ${requestId})`;
        }

        toast.textContent = toastMessage;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.className = "toast";
        }, duration);
    }

    /**
     * Formats the bot detection result for display
     * @param {Object} result Bot detection result
     * @returns {Object} Formatted message and type
     */
    function formatBotResult(result) {
        if (!result.isBot) {
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
            message: `Suspicious bot detected: ${result.category} - ${result.reason || 'unknown pattern'}`,
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
        } catch (e) {
            throw new Error(response.statusText || 'Unknown error occurred');
        }

        const error = new Error(errorData.error || 'Unknown error occurred');
        error.status = response.status;
        error.requestId = errorData.requestId;

        // Add additional error details if available
        if (errorData.details) {
            error.details = errorData.details;
        }

        throw error;
    }

    /**
     * Maps HTTP status codes to user-friendly messages
     * @param {Error} error Error object
     * @returns {Object} Formatted error message and type
     */
    function formatErrorMessage(error) {
        const baseMessage = error.message;
        let type = 'error';

        switch (error.status) {
            case 400:
                return {
                    message: `Invalid request: ${error.details?.join(', ') || baseMessage}`,
                    type: 'warning'
                };
            case 403:
                return {
                    message: 'Access denied',
                    type: 'warning'
                };
            case 429:
                return {
                    message: 'Rate limit exceeded. Please try again later.',
                    type: 'warning'
                };
            case 405:
                return {
                    message: 'Method not allowed',
                    type: 'warning'
                };
            default:
                return {
                    message: baseMessage,
                    type: 'error'
                };
        }
    }

    /**
     * Performs the bot detection check
     * @returns {Promise<Object>} Bot detection result
     */
    async function checkBot() {
        try {
            const response = await fetch('https://entitl-org-bots-674074734942.us-central1.run.app', {
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
            const formattedResult = formatBotResult(result);

            showToast({
                message: formattedResult.message,
                type: formattedResult.type
            });

            return result;

        } catch (error) {
            console.error('Bot check failed:', error);

            const formattedError = formatErrorMessage(error);
            showToast({
                message: formattedError.message,
                type: formattedError.type,
                requestId: error.requestId,
                duration: 5000 // Show errors longer
            });

            throw error;
        }
    }

    try {
        const result = await checkBot();
        console.debug('Bot check complete:', {
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Additional error telemetry could be added here
        console.error('Bot check failed:', {
            error: {
                message: error.message,
                status: error.status,
                requestId: error.requestId
            },
            timestamp: new Date().toISOString()
        });
    }
})();
