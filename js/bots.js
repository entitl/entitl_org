(function() {

    function showToast(message) {
          const toast = document.getElementById("toast");
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userAgent: navigator.userAgent,
                    domain: window.location.hostname,
                    referer: document.referrer,
                    // Add any other relevant headers/data
                })
            });

            const { isBot } = await response.json();

            // if (isBot) {
            //     document.body.innerHTML = '<div style="text-align:center;padding:50px"><h1>Access Denied</h1></div>';
            // }
            if (!isBot) {
                showToast('Not a Bot!');
            }
        } catch (error) {
            // Fail open - if check fails, allow access
            console.error('Bot check failed:', error);
        }
    }

    // Run check immediately
    checkBot();
})();
