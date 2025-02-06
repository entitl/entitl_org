function extractArticleText(anchorId) {
    const anchorDiv = document.getElementById(anchorId);

    if (!anchorDiv) {
        console.error(`Element with id "${anchorId}" not found.`);
        return null;
    }

    // Clone the anchor div to avoid modifying the original content
    const tempDiv = anchorDiv.cloneNode(true);

    // Remove common non-article elements
    const nonArticleSelectors = 'script, style, nav, header, footer, aside';
    tempDiv.querySelectorAll(nonArticleSelectors).forEach(el => el.remove());

    // Remove likely ad elements
    removeAds(tempDiv);

    // Get the inner text, which preserves line breaks
    let extractedText = tempDiv.innerText;

    // Clean up the text
    extractedText = extractedText.trim();
    extractedText = extractedText.replace(/(\r\n|\n|\r){2,}/g, '\n\n');
    extractedText = extractedText.split('\n').map(line => line.trim().replace(/\s+/g, ' ')).join('\n');

    return extractedText;
}

function removeAds(element) {
    const adSelectors = [
        '[class*="ad-"]',
        '[class*="advertisement"]',
        '[id*="ad-"]',
        '[id*="advertisement"]',
        '[class*="sponsor"]',
        '[class*="promoted"]',
        '[data-ad]',
        'iframe',  // Often used for ads
        '.adsbygoogle'  // Google AdSense
    ];

    adSelectors.forEach(selector => {
        element.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Remove elements with very short content (likely to be ads or non-article elements)
    Array.from(element.children).forEach(child => {
        if (child.innerText.trim().length < 50) {
            child.remove();
        }
    });

    // Remove elements that contain common ad-related words
    const adKeywords = ['sponsored', 'advertisement', 'promoted', 'recommended', 'partner'];
    Array.from(element.children).forEach(child => {
        const text = child.innerText.toLowerCase();
        if (adKeywords.some(keyword => text.includes(keyword))) {
            child.remove();
        }
    });
}

// Usage example:
// const articleText = extractArticleText('your-anchor-div-id');
// console.log(articleText);
