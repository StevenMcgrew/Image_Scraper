let imgSrcs = [];

function getImages(maxWidth) {
    imgSrcs = [];

    const hn = window.location.hostname;
    hn === 'shop-isspro.mybigcommerce.com' ? handleBigCommerceImages(maxWidth) : null;

    send({
        finishedGettingImages: {
            imgSrcs: imgSrcs
        }
    });
}

function handleBigCommerceImages(maxWidth) {
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

function downloadImages(imgSrcs) {
    for (const imgSrc of imgSrcs) {
        const a = document.createElement('a');
        a.href = imgSrc;
        a.classList.add('downloadAnchor');
        a.setAttribute('download', Date.now());
        a.textContent = imgSrc;
        document.body.appendChild(a);
    }
    // const anchors = [...document.querySelectorAll('.downloadAnchor')];
    // for (const a of anchors) {
    //     a.click();
    // }
}


/**************************************************************************
Handle incoming messages
***************************************************************************/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.getImages) {
        getImages(message.getImages.maxWidth);
        return;
    }
    if (message.downloadImages) {
        downloadImages(message.downloadImages.selectedImgSrcs);
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