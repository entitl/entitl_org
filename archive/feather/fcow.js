// fcow.js - FewCents On-page Widget

(function() {
    const template = document.createElement('template');
    template.innerHTML = `
        <style>
            .fewcents-paywall {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 4px;
                max-width: 100%;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin: 10px 0;
                font-size: 14px;
                text-align: center;
                position: relative;
            }
            .publisher-logo {
                max-width: 100px;
                margin-bottom: 10px;
            }
            .fewcents-title {
                font-size: 18px;
                color: #1a1a1a;
                margin-bottom: 15px;
            }
            .fewcents-offer {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin: 15px 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .fewcents-flag {
                margin-right: 10px;
                font-size: 30px;
            }
            .fewcents-divider {
                border-top: 1px solid #ddd;
                margin: 15px 0;
            }
            .fewcents-access-button {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px 15px;
                font-size: 16px;
                cursor: pointer;
                border-radius: 4px;
                transition: background-color 0.3s, opacity 0.3s;
                margin-bottom: 15px;
            }
            .fewcents-access-button:hover:not(:disabled) {
                background-color: #45a049;
            }
            .fewcents-access-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .fewcents-consent {
                font-size: 12px;
                margin-top: 15px;
                display: flex;
                align-items: flex-start;
                text-align: left;
            }
            .fewcents-consent input {
                margin-right: 5px;
                margin-top: 2px;
            }
            .fewcents-consent label {
                line-height: 1.3;
            }
            .fewcents-powered-by {
                position: absolute;
                bottom: -23px;
                right: 10px;
                font-size: 10px;
                color: #666;
                display: flex;
                align-items: center;
            }
            .fewcents-logo {
                width: 60px;
                margin-left: 5px;
            }
        </style>
        <div class="fewcents-paywall">
            <img class="publisher-logo" src="" alt="Publisher Logo">
            <h2 class="fewcents-title"></h2>
            <div class="fewcents-offer">
                <span class="fewcents-flag"></span>
                <span class="fewcents-price"></span>
            </div>
            <div class="fewcents-divider"></div>
            <button class="fewcents-access-button"></button>
            <div class="fewcents-consent">
                <input type="checkbox" id="fewcents-consent-checkbox" checked>
                <label for="fewcents-consent-checkbox"></label>
            </div>
            <div class="fewcents-powered-by">
                Powered by <img class="fewcents-logo" src="https://images.volopay.com/h7g7e0fa5l74rlhlmxag73664tcs" alt="FewCents Logo">
            </div>
        </div>
    `;

    class FewcentsPaywall extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }

        connectedCallback() {
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            this.updateContent();
            this.setupEventListeners();
        }

        updateContent() {
            const publisherLogo = this.shadowRoot.querySelector('.publisher-logo');
            publisherLogo.src = this.getAttribute('publisher-logo-url');

            const title = this.shadowRoot.querySelector('.fewcents-title');
            title.textContent = this.getAttribute('title');

            const flag = this.shadowRoot.querySelector('.fewcents-flag');
            flag.textContent = this.getAttribute('flag');

            const price = this.shadowRoot.querySelector('.fewcents-price');
            price.textContent = this.getAttribute('price');

            const button = this.shadowRoot.querySelector('.fewcents-access-button');
            button.textContent = this.getAttribute('button-text');

            const consentLabel = this.shadowRoot.querySelector('.fewcents-consent label');
            consentLabel.innerHTML = this.getAttribute('consent-text');
        }

        setupEventListeners() {
            const consentCheckbox = this.shadowRoot.getElementById('fewcents-consent-checkbox');
            const accessButton = this.shadowRoot.querySelector('.fewcents-access-button');

            const updateButtonState = () => {
                accessButton.disabled = !consentCheckbox.checked;
            };

            consentCheckbox.addEventListener('change', updateButtonState);
            updateButtonState(); // Initial state
        }
    }

    customElements.define('fewcents-paywall', FewcentsPaywall);

    // Function to inject the paywall
    function injectPaywall(anchorClassName, paywallConfig) {
        const anchorElement = document.querySelector(`.${anchorClassName}`);
        if (anchorElement) {
            const paywall = document.createElement('fewcents-paywall');
            Object.keys(paywallConfig).forEach(key => {
                paywall.setAttribute(key, paywallConfig[key]);
            });
            anchorElement.parentNode.insertBefore(paywall, anchorElement.nextSibling);
        } else {
            console.error(`Element with class "${anchorClassName}" not found.`);
        }
    }

    // Auto-initialize the paywall when the DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        injectPaywall('article-content', {
            'publisher-logo-url': 'https://picsum.photos/100/50', // Random image for publisher logo
            'title': 'Read this article for',
            'flag': '🇺🇸',
            'price': '$0.99',
            'button-text': 'Access Article with Fewcents',
            'consent-text': 'I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>, and consent to the collection and use of my data as described therein.'
        });
    });
})();
