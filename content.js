let imgSrcs = [];

function getImages(maxWidth) {
    const hn = window.location.hostname;

    hn === 'shop-isspro.mybigcommerce.com' ? pushBigCommerceImages(maxWidth) : null;

    send({
        finishedGettingImages: {
            imgSrcs: imgSrcs
        }
    });
}

function pushBigCommerceImages(maxWidth) {
    const anchors = [...document.querySelectorAll('.productView-thumbnail-link')];
    const srcSets = anchors.map(a => a.firstElementChild.srcset);

    for (const srcSet of srcSets) {
        if (srcSet) {
            let currentWidth = 0;
            let currentSrc = '';
            const srcAndWidthArray = srcSet.split(', ');

            for (const srcAndWidth of srcAndWidthArray) {
                if (srcAndWidth) {
                    const splitSrcAndWidth = srcAndWidth.split(' ');
                    const width = Math.round(splitSrcAndWidth[1].slice(0, -1));
                    if (width < maxWidth && width > currentWidth) {
                        currentWidth = width;
                        currentSrc = splitSrcAndWidth[0];
                    }
                }
            }
            imgSrcs.push(currentSrc);
        }
    }
}


/**************************************************************************
Handle incoming messages
***************************************************************************/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.getImages) {
        getImages(message.getImages.maxWidth);
    }
    // Optional: sendResponse({message: "goodbye"});
});


/**************************************************************************
Send outgoing messages
***************************************************************************/
async function send(message) {
    const response = await chrome.runtime.sendMessage(message);
    // Optional: do something with response
}