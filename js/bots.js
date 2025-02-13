(async function() {
    function showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) {
            console.error('Toast element not found');
            return;
        }
        toast.textContent = message;
        toast.className = "toast show";
        setTimeout(() => {
            toast.className = "toast";
        }, 2000);
    }

    async function checkBot() {
        try {
            const response = await fetch('https://us-central1-bots-framework.cloudfunctions.net/bots-check', {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit', // Changed from same-origin since we're using cross-origin
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const { isBot } = await response.json();

            if (!isBot) {
                showToast('NOT a bot!');
            }
        } catch (error) {
            console.error('Bot check failed:', error);
            showToast('Error checking bot status');
        }
    }

    try {
        await checkBot();
    } catch (error) {
        console.error('Failed to run bot check:', error);
        showToast('Failed to run bot check');
    }
})();
