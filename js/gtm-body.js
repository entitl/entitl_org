// gtm-body.js
export const initGTMBody = (containerId) => {
    // Create the noscript iframe
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');

    iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';

    noscript.appendChild(iframe);

    // Add it to the beginning of the body
    document.body.insertBefore(noscript, document.body.firstChild);
};
