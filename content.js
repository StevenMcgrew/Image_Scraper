function getImageSrcs(maxW) {
    const imgSrcs = new Set();
    const elements = [...document.body.getElementsByTagName("*")];

    for (const el of elements) {
        let imgSrc = '';

        if (el.tagName === 'IMG' || el.tagName === 'SOURCE') {
            if (el.srcset) {
                imgSrc = getSrcFromSrcset(el.srcset, maxW);
            }
            if (el.src && !imgSrc) {
                imgSrc = el.src;
            }
        }
        else if (el.tagName === 'A') {
            imgSrc = getHrefFromAnchor(el);
        }
        else {
            imgSrc = getBackgroundImageURL(el);
        }

        if (!imgSrc ||
            imgSrc.startsWith('https:') ||
            imgSrc.startsWith('data:image')) {
            // do nothing (we need to eliminate this for the rest of the checks)
        } else if (imgSrc.startsWith('//')) {
            imgSrc = 'https:' + imgSrc;
        } else if (imgSrc.startsWith('/')) {
            imgSrc = window.location.origin + imgSrc;
        } else if (imgSrc.startsWith('http:')) {
            imgSrc = changeSrcToHttps(imgSrc);
        } else { // default case (should be a relative path without a '/' since the other things were eliminated)
            imgSrc = window.location.origin + window.location.pathname + imgSrc;
        }

        imgSrcs.add(imgSrc);
    }

    emit({
        foundImgSrcs: {
            imgSrcs: [...imgSrcs]
        }
    });
}

function getHrefFromAnchor(anchor) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.gif', '.svg', '.bmp', '.ico', '.avif'];
    for (const ext of allowedExtensions) {
        if (anchor.href.includes(ext)) {
            return anchor.href;
        }
    }
    return '';
}

function getSrcFromSrcset(srcset, maxW) {
    let currentWidth = 0;
    let currentSrc = '';
    const srcsAndDescriptors = srcset.split(',');

    for (let srcAndDescriptor of srcsAndDescriptors) {
        srcAndDescriptor = srcAndDescriptor.trim();
        if (!srcAndDescriptor.includes(' ')) { continue; }
        const srcAndDescriptorArray = srcAndDescriptor.split(' ');
        if (!srcAndDescriptorArray[1].endsWith('w')) { continue; }
        const width = Math.round(srcAndDescriptorArray[1].slice(0, -1));

        if (width <= maxW && width > currentWidth) {
            currentWidth = width;
            currentSrc = srcAndDescriptorArray[0];
        }
    }
    return currentSrc;
}

function getBackgroundImageURL(element) {
    let bgImage = window.getComputedStyle(element).backgroundImage;
    const start = bgImage.indexOf('url("') + 5;
    const end = bgImage.indexOf('"', start + 1);
    bgImage = bgImage.slice(start, end);
    return bgImage.includes(' ') ? '' : bgImage;
}

function getHref() {
    emit({
        obtainedHref: {
            href: window.location.href
        }
    });
}

function changeSrcToHttps(src) {
    let arr = src.split(':');
    arr[0] = 'https';
    return arr.join(':');
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