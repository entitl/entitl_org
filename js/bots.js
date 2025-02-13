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
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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
