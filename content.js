function getImageSrcs(maxW) {
    const imgSrcs = new Set();

    // const elements = [...document.body.getElementsByTagName("*")];

    // for (const el of elements) {
    //     if (el.tagName !== 'IMG') {
    //         continue;
    //     }

    //     if (el.srcset) {

    //         continue;
    //     }

    //     if (el.src) {

    //         continue;
    //     }

    //     TODO: handle <picture><source> elements
    //     TODO: handle shadowRoot elements
    //     TODO: handle input's of type image (submit buttons that use an image)
    //     TODO: handle anchor's that link to images (href ends in .jpg, for example)
    //     TODO: handle css background-image and background
    // }

    const images = [...document.images];

    for (const img of images) {
        if (img.srcset) {
            const src = getSrcFromSrcset(img.srcset, maxW);
            if (src) {
                imgSrcs.add(src);
                continue;
            }
        }
        if (img.src) {
            imgSrcs.add(img.src);
        }
    }

    emit({
        foundImgSrcs: {
            imgSrcs: [...imgSrcs]
        }
    });
}

function getSrcFromSrcset(srcset, maxW) {
    let currentWidth = 0;
    let currentSrc = '';
    const srcsAndDescriptors = srcset.split(',');

    for (const srcAndDescriptor of srcsAndDescriptors) {
        srcAndDescriptor.trim();
        if (!srcAndDescriptor.includes(' ')) { continue; }
        const srcAndDescriptorArray = srcAndDescriptor.split(' ');
        if (!srcAndDescriptorArray[1].endsWith('w')) { continue; }
        const width = Math.round(srcAndDescriptorArray[1].slice(0, -1));
        if (width < maxW && width > currentWidth) {
            currentWidth = width;
            currentSrc = srcAndDescriptorArray[0];
        }
    }
    return currentSrc;
}

function getHref() {
    emit({
        obtainedHref: {
            href: window.location.href
        }
    });
}


/**************************************************************************
Handle incoming messages
***************************************************************************/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.getImageSrcs) {
        getImageSrcs(message.getImageSrcs.maxW);
        return;
    }
    if (message.getHref) {
        getHref();
        return;
    }
});


/**************************************************************************
Emit outgoing messages
***************************************************************************/
async function emit(message) {
    const response = await chrome.runtime.sendMessage(message);
}