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
        else {
            imgSrc = getBackgroundImageURL(el);
        }

        if (imgSrc.startsWith('https:')) {
            // do nothing (we need eliminate this for the rest of the checks)
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

    // const images = [...document.images];

    // for (const img of images) {
    //     let imgSrc = '';

    //     if (img.srcset) {
    //         imgSrc = getSrcFromSrcset(img.srcset, maxW);
    //     } else if (img.src && !imgSrc) {
    //         imgSrc = img.src;
    //     }

    //     if (imgSrc.startsWith('https:')) {
    //         // do nothing (this will skip the remaining "else if"'s)
    //     } else if (imgSrc.startsWith('//')) {
    //         imgSrc = 'https:' + imgSrc;
    //     } else if (imgSrc.startsWith('/')) {
    //         imgSrc = window.location.origin + imgSrc;
    //     } else if (imgSrc.startsWith('http:')) {
    //         imgSrc = changeSrcToHttps(imgSrc);
    //     } else { // default case (should be a relative path without a '/' since the other things were eliminated)
    //         // TODO: set imgSrc to proper value (current page address without # or ? + imgSrc)
    //     }

    //     imgSrcs.add(imgSrc);
    // }

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

function getBackgroundImageURL(element) {
    const bgImage = window.getComputedStyle(element).backgroundImage;
    const start = bgImage.indexOf('url("') + 5;
    const end = bgImage.indexOf('"', start + 1);
    return bgImage.slice(start, end);
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