(async function() {
    function showToast(message, isError = false) {
        const toast = document.getElementById("toast");
        if (!toast) {
            console.error('Toast element not found');
            return;
        }
        toast.textContent = message;
        // Add error class if it's an error message
        toast.className = `toast show ${isError ? 'error' : ''}`;
        setTimeout(() => {
            toast.className = "toast";
        }, 3000); // Increased to 3 seconds for better readability
    }

    function formatBotResult(result) {
        if (!result.isBot) {
            return 'Human visitor detected';
        }

        if (result.isAllowed) {
            return `Legitimate bot detected: ${result.botType}`;
        }

        return `Suspicious bot detected: ${result.reason || 'unknown pattern'}`;
    }

    async function handleErrorResponse(response) {
        let errorMessage = 'An error occurred';

        try {
            const errorData = await response.json();

            switch (response.status) {
                case 400:
                    errorMessage = `Validation error: ${errorData.details?.join(', ') || 'Invalid request'}`;
                    break;
                case 429:
                    errorMessage = 'Too many requests. Please try again later.';
                    break;
                case 405:
                    errorMessage = 'Method not allowed';
                    break;
                case 500:
                    errorMessage = `Server error${errorData.requestId ? ` (Request ID: ${errorData.requestId})` : ''}`;
                    break;
                default:
                    errorMessage = errorData.error || 'Unknown error occurred';
            }
        } catch (e) {
            // If we can't parse the error JSON, use the status text
            errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
    }

    async function checkBot() {
        try {
            const response = await fetch('https://entitl-bot-check-674074734942.us-central1.run.app', {
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
            const message = formatBotResult(result);
            showToast(message, result.isBot && !result.isAllowed);

            // Return the result for potential further use
            return result;

        } catch (error) {
            console.error('Bot check failed:', error);
            showToast(error.message || 'Error checking bot status', true);
            throw error; // Re-throw for the outer try-catch
        }
    }

    try {
        const result = await checkBot();
        // You can do additional handling with the result here if needed
        console.debug('Bot check complete:', result);
    } catch (error) {
        console.error('Failed to run bot check:', error);
        // Toast is already shown by the checkBot function
    }
})();
