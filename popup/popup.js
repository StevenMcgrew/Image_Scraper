let imgElements = [];
let webRequestDetails = {};
let redirectDetails = {};
let selectionCount = 0;
let imgCount = 0;
let totalImgCount = 0;
let href = '';

function el(selector) {
    return document.querySelector(selector);
}

el('.select-all').addEventListener('change', (e) => {
    const selectAll = e.target;
    let flexItems = el('.img-flexwrap').children;
    for (const flexItem of flexItems) {
        const itemCheckbox = flexItem.firstElementChild.firstElementChild;
        if (selectAll.checked === true && itemCheckbox.checked === false ||
            selectAll.checked === false && itemCheckbox.checked === true) {
            itemCheckbox.click();
        }
    }
});

el('.settings-btn').addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    openModal(settingsModal);
});

el('.edit-settings').addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    openModal(settingsModal);
});

el('.cancel-modal-btn').addEventListener('click', (e) => {
    setSettingsForm();
    const settingsModal = document.querySelector('.settings-modal');
    closeModal(settingsModal);
});

el('.settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const settingsForm = e.currentTarget;

    const settings = {
        maxW: settingsForm.maxW.value,
        maxH: settingsForm.maxH.value,
        isScaleDown: settingsForm.isScaleDown.checked,
        isConvertToJPG: settingsForm.isConvertToJPG.checked,
        isMakeSquare: settingsForm.isMakeSquare.checked,
        isCreateFolder: settingsForm.isCreateFolder.checked
    };

    chrome.storage.sync.set(settings)
        .then(() => {
            const settingsModal = document.querySelector('.settings-modal');
            closeModal(settingsModal);
        });
});

el('.get-images-btn').addEventListener('click', (e) => {
    el('.get-images-panel').hidden = true;
    document.querySelector('.loading-container').hidden = false;
    emit({
        getImageSrcs: {
            maxW: Math.round(el('.settings-form').maxW.value)
        }
    });
});

el('.download-btn').addEventListener('click', (e) => {
    e.target.setAttribute('aria-busy', 'true');
    let folderNameWithSlash = '';
    if (el('.settings-form').isCreateFolder.checked) {
        folderNameWithSlash = getFolderName(href) + '/';
    }

    let items = el('.img-flexwrap').children;
    for (const item of items) {
        if (item.dataset.checked === 'true') {
            const src = item.querySelector('.img-preview').src;
            const fileName = item.querySelector('.img-name').textContent;

            chrome.downloads.download({
                url: src,
                filename: `${folderNameWithSlash}${fileName}`,
                conflictAction: 'uniquify',
                saveAs: false
            });
        }
    }
    setTimeout(() => {
        e.target.setAttribute('aria-busy', 'false');
    }, 1000);
});

function showDownloadBtn(selectionCount) {
    const downloadBtn = el('.download-btn');
    if (selectionCount === 1) {
        downloadBtn.textContent = `Download 1 image`;
    } else {
        downloadBtn.textContent = `Download ${selectionCount} images`;
    }
    downloadBtn.hidden = false;
}

function openModal(modal) {
    document.documentElement.classList.add('modal-is-open', 'modal-is-opening');
    setTimeout(() => {
        document.documentElement.classList.remove('modal-is-opening');
    }, 400);
    modal.setAttribute('open', true);
};

function closeModal(modal) {
    document.documentElement.classList.add('modal-is-closing');
    setTimeout(() => {
        document.documentElement.classList.remove('modal-is-closing', 'modal-is-open');
        modal.removeAttribute('open');
    }, 400);
};

function getFolderName(href) {
    if (!href) {
        return `downloaded-images-${Date.now()}`;
    }
    let hostname = new URL(href).hostname;
    let name = hostname.split('.');
    name = name.reduce((stored, current) => (current.length > stored.length) ? current : stored);
    return `${name}-images-${Date.now()}`;
}

function getRandom4DigitNum() {
    return Math.floor(Math.random() * 9000) + 1000;
}

function getFileNameAndExt(src) {
    if (src.startsWith('data:image')) {
        const start = src.indexOf('/') + 1;
        const end = src.indexOf(';');
        let fileExt = src.slice(start, end);
        switch (fileExt) {
            case 'jpeg': fileExt = 'jpg'; break;
            case 'svg+xml': fileExt = 'svg'; break;
            case 'vnd.microsoft.icon': fileExt = 'ico'; break;
        }
        const fileName = `image-${getRandom4DigitNum()}`;
        return { fileName, fileExt };
    }
    let pathname = new URL(src).pathname;
    const start = pathname.lastIndexOf('/') + 1;
    let fileName = pathname.slice(start);
    fileName = removeIllegalChars(fileName, 'x');
    let lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) {
        lastDot = undefined;
    }
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif', 'gif', 'svg', 'bmp', 'ico', 'avif'];
    let fileExt = fileName.slice(lastDot + 1);
    if (!allowedExtensions.includes(fileExt)) {
        fileExt = 'unknown';
    }
    fileName = fileName.slice(0, lastDot);
    fileName = fileName.slice(0, 30); // limit length of fileName
    fileName = `${fileName}-${getRandom4DigitNum()}`;
    return { fileName, fileExt };
}

function removeIllegalChars(str, replacement) {
    const legalChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-";
    let result = "";
    for (let i = 0; i < str.length; i++) {
        if (legalChars.includes(str[i])) {
            result += str[i];
        } else if (result.length === 0) {
            result += replacement;
        }
    }
    return result;
}

function setSettingsForm() {
    chrome.storage.sync.get(null)
        .then((result) => {
            const settingsForm = el('.settings-form');
            settingsForm.maxW.value = Math.round(result.maxW) || 9999;
            settingsForm.maxH.value = Math.round(result.maxH) || 9999;
            settingsForm.isScaleDown.checked = result.isScaleDown || false;
            settingsForm.isConvertToJPG.checked = result.isConvertToJPG || false;
            settingsForm.isMakeSquare.checked = result.isMakeSquare || false;
            settingsForm.isCreateFolder.checked = result.isCreateFolder || false;
        });
}

function createSrcWithNewSize(src, newW, newH) {
    const widthRegex = /width=\d{1,4}/;
    const heightRegex = /height=\d{1,4}/;
    const wRegex = /w=\d{1,4}/;
    const hRegex = /h=\d{1,4}/;
    src = src.replace(widthRegex, `width=${newW}`);
    src = src.replace(heightRegex, `height=${newH}`);
    src = src.replace(wRegex, `w=${newW}`);
    src = src.replace(hRegex, `h=${newH}`);
    return src;
}

function appendLoader(container) {
    const div = document.createElement('div');
    div.classList.add('loader-div');
    div.classList.add('blue-border');
    container.appendChild(div);
}

function appendModifierLoader(container) {
    const div = document.createElement('div');
    div.classList.add('loader-div');
    div.classList.add('yellow-border');
    container.parentElement.hidden = false;
    container.appendChild(div);
}

function createImgElements(srcs) {
    totalImgCount += srcs.length;
    for (const src of srcs) {
        const img = document.createElement('img');
        img.onerror = (e) => { onImageError(e, totalImgCount); };
        img.onload = (e) => { onImageLoad(e, totalImgCount); };
        img.setAttribute('crossorigin', 'anonymous');
        appendLoader(document.querySelector('.loaded-cell'));
        img.src = src;
    }
}

function createNewImgElement(src) {
    totalImgCount++;
    const img = document.createElement('img');
    img.dataset.newlyCreated = true;
    img.onerror = (e) => { onImageError(e, totalImgCount); };
    img.onload = (e) => { onImageLoad(e, totalImgCount); };
    img.setAttribute('crossorigin', 'anonymous');
    appendLoader(document.querySelector('.loaded-cell'));
    img.src = src;
}

function onImageError(e, totalImgCount) {
    imgCount++;
    let img = e.currentTarget;
    const loaderContainer = document.querySelector('.loaded-cell');
    loaderContainer.lastElementChild.remove();
    if (imgCount === totalImgCount) {
        setTimeout(() => {
            appendImgFlexItems();
        }, 500);
    }
    console.log('IMAGE LOAD ERROR: ', img.src);
    img = null;
}

function onImageLoad(e, totalImgCount) {
    imgCount++;
    let img = e.currentTarget;
    img.onerror = null;
    img.onload = null;
    const settingsForm = el('.settings-form');

    const loaderContainer = document.querySelector('.loaded-cell');
    fillLoader(loaderContainer, 'blue-background');

    if ((img.src.includes('width=') || img.src.includes('w='))
        && !img.dataset.newlyCreated) {
        const W = Math.round(settingsForm.maxW.value);
        const H = Math.round(settingsForm.maxH.value);
        if (W < 1921 || H < 1921) {
            const newSrc = createSrcWithNewSize(img.src, W, H);
            createNewImgElement(newSrc);
        }
    }

    img = convertResizeSquare(img);
    if (img) {
        imgElements.push(img);
    }
    if (imgCount === totalImgCount) {
        setTimeout(() => {
            appendImgFlexItems();
        }, 500);
    }
}

function fillLoader(container, className) {
    const loaders = container.children;
    for (const loader of loaders) {
        if (!loader.classList.contains(className)) {
            loader.classList.add(className);
            break;
        }
    }
}

function fillModifierLoader(note) {
    if (note.includes('Converted')) {
        fillLoader(document.querySelector('.converted-cell'), 'yellow-background');
    }
    if (note.includes('Resized')) {
        fillLoader(document.querySelector('.resized-cell'), 'yellow-background');
    }
    if (note.includes('Squared')) {
        fillLoader(document.querySelector('.squared-cell'), 'yellow-background');
    }
}

function convertResizeSquare(img) {
    let W = img.naturalWidth;
    let H = img.naturalHeight;
    const settingsForm = el('.settings-form');
    const canvas = el('.canvas');

    if (W < 5 || H < 5) {
        return null;
    }

    const maxW = Math.round(settingsForm.maxW.value);
    const maxH = Math.round(settingsForm.maxH.value);
    const imgDetails = webRequestDetails[img.src];
    const alternateImgDetails = getFileNameAndExt(img.src);
    let fileName = imgDetails?.fileName;
    if (!fileName) {
        fileName = alternateImgDetails.fileName;
    }
    let fileExt = imgDetails?.fileExt;
    if (!fileExt) {
        fileExt = alternateImgDetails.fileExt;
    }
    let note = '';

    if (W > maxW || H > maxH) {
        if (!settingsForm.isScaleDown.checked) {
            return null;
        }
        appendModifierLoader(document.querySelector('.resized-cell'));
        const newSize = determineSize(W, H, maxW, maxH);
        W = newSize.width;
        H = newSize.height;
        if (fileExt !== 'jpg' && fileExt !== 'jpeg') {
            appendModifierLoader(document.querySelector('.converted-cell'));
            fileExt = 'jpg';
            note += 'Converted & ';
        }
        if (settingsForm.isMakeSquare.checked && W !== H) {
            appendModifierLoader(document.querySelector('.squared-cell'));
            drawToSquareCanvas(canvas, img, W, H);
            W = (W > H) ? W : H;
            H = W;
            note += 'Resized & Squared';
        } else {
            drawToCanvas(canvas, img, W, H);
            note += 'Resized';
        }
        try {
            img.src = canvas.toDataURL('image/jpeg', 1.0);
        } catch (error) {
            return null;
        }
    } else {
        if (settingsForm.isMakeSquare.checked && W !== H) {
            appendModifierLoader(document.querySelector('.squared-cell'));
            drawToSquareCanvas(canvas, img, W, H);
            W = (W > H) ? W : H;
            H = W;
            try {
                img.src = canvas.toDataURL('image/jpeg', 1.0);
            } catch (error) {
                return null;
            }
            if (fileExt !== 'jpg' && fileExt !== 'jpeg') {
                appendModifierLoader(document.querySelector('.converted-cell'));
                fileExt = 'jpg';
                note += 'Converted & ';
            }
            note += 'Squared';
        } else {
            if (fileExt !== 'jpg' && fileExt !== 'jpeg' && settingsForm.isConvertToJPG.checked) {
                appendModifierLoader(document.querySelector('.converted-cell'));
                drawToCanvas(canvas, img, W, H);
                try {
                    img.src = canvas.toDataURL('image/jpeg', 1.0);
                } catch (error) {
                    return null;
                }
                fileExt = 'jpg';
                note += 'Converted';
            }
        }
    }

    fillModifierLoader(note);

    img.dataset.fileName = `${fileName}.${fileExt}`;
    img.dataset.fileExt = fileExt;
    img.dataset.note = note;
    img.dataset.width = W;
    img.dataset.height = H;
    return img;
}

function appendImgFlexItems() {
    imgElements.sort(compareWidths);
    const imgFlexwrap = el('.img-flexwrap');

    for (const img of imgElements) {
        const flexItem = el('.flex-item-template').content.firstElementChild.cloneNode(true);

        const checkboxLabel = flexItem.querySelector('.select-img');
        const checkbox = flexItem.querySelector('.img-checkbox');
        const imgSize = flexItem.querySelector('.img-size');
        const imgType = flexItem.querySelector('.img-type');
        const imgExtraDetails = flexItem.querySelector('.img-extra-details');
        const imgContainer = flexItem.querySelector('.img-container');
        const imgName = flexItem.querySelector('.img-name');

        flexItem.addEventListener('click', toggleChecked);
        checkboxLabel.addEventListener('click', (e) => e.stopPropagation());
        checkbox.addEventListener('click', toggleFlexItemChecked);
        checkbox.addEventListener('change', trackSelectionCount);

        imgSize.textContent = `${img.dataset.width} x ${img.dataset.height}`;
        imgType.textContent = img.dataset.fileExt;
        if (img.dataset.note) {
            imgExtraDetails.classList.add('yellow-bg');
            imgExtraDetails.textContent = img.dataset.note;
        }
        imgName.textContent = img.dataset.fileName;
        imgName.setAttribute('title', img.dataset.fileName);
        img.classList.add('img-preview');
        imgContainer.appendChild(img);
        imgFlexwrap.appendChild(flexItem);
    }

    const imgCount = imgFlexwrap.childElementCount;
    document.querySelector('.select-all-span').textContent = `Select All (${imgCount})`;
    el('.download-btn').textContent = `Download 0 images`;
    el('.select-all').hidden = false;
}

function toggleChecked(e) {
    const item = e.currentTarget;
    const checkbox = item.firstElementChild.firstElementChild;
    checkbox.click();
}

function toggleFlexItemChecked(e) {
    e.stopPropagation();

    let currentElement = e.currentTarget;
    while (currentElement.dataset.name !== 'flexItem') {
        currentElement = currentElement.parentElement;
        if (currentElement.tagName.toLowerCase() == 'body') {
            break;
        }
    }
    toggleDatasetChecked(currentElement);
}

function toggleDatasetChecked(element) {
    if (element.dataset.checked === 'true') {
        element.dataset.checked = 'false';
        element.style.borderColor = 'gray';
        element.style.outline = 'none';
    } else {
        element.dataset.checked = 'true';
        element.style.outline = '2px solid var(--primary)';
        element.style.borderColor = 'transparent';
    }
}

function trackSelectionCount(e) {
    if (e.target.checked) {
        selectionCount++;
        showDownloadBtn(selectionCount);
        return;
    }
    selectionCount--;
    showDownloadBtn(selectionCount);
    if (selectionCount === 0) {
        el('.download-btn').hidden = true;
    }
}

function compareWidths(imgA, imgB) {
    return imgB.dataset.width - imgA.dataset.width;
}


/**************************************************************************
Image Ops
***************************************************************************/
function drawToCanvas(canvas, image, width, height) {
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
};

function drawToSquareCanvas(canvas, image, imgW, imgH) {
    // Start with square image settings
    let sideLength = imgW;
    let dx = 0;
    let dy = 0;
    if (imgW > imgH) { // adjust if landscape image
        sideLength = imgW;
        dx = 0;
        dy = Math.round((sideLength - imgH) / 2);
    } else if (imgH > imgW) { // adjust if portrait image
        sideLength = imgH;
        dx = Math.round((sideLength - imgW) / 2);
        dy = 0;
    }
    canvas.width = sideLength;
    canvas.height = sideLength;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, dx, dy, imgW, imgH);
    ctx.restore();
}

function determineSize(w, h, maxW, maxH) {
    if (w > h) { // landscape
        if (w > maxW) {
            h = h * maxW / w;
            w = maxW;
        }
    }
    else { // portrait or square
        if (h > maxH) {
            w = w * maxH / h;
            h = maxH;
        }
    }
    return { width: Math.round(w), height: Math.round(h) };
};


/**************************************************************************
webRequest events
***************************************************************************/
chrome.webRequest.onCompleted.addListener(function (details) {
    let url = details.url;
    const originalUrl = redirectDetails[details.requestId];
    if (originalUrl) {
        url = originalUrl;
    }
    webRequestDetails[url] = {
        fileName: getFileNameAndExt(url).fileName,
        fileExt: getFileExt(getContentType(details.responseHeaders))
    };
}, {
    urls: ['<all_urls>'],
    types: ['image']
}, ['responseHeaders']);

function getContentType(headers) {
    for (const header of headers) {
        if (header.name.toLowerCase() === 'content-type') {
            return header.value;
        }
    }
}

function getFileExt(MIMEtype) {
    if (!MIMEtype) {
        return '';
    }
    const start = MIMEtype.indexOf('/') + 1;
    let end = (MIMEtype.indexOf(';'));
    if (end === -1) {
        end = undefined;
    }
    let imgType = MIMEtype.slice(start, end);
    switch (imgType) {
        case 'jpeg': imgType = 'jpg'; break;
        case 'svg+xml': imgType = 'svg'; break;
        case 'vnd.microsoft.icon': imgType = 'ico'; break;
    }
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif', 'gif', 'svg', 'bmp', 'ico', 'avif'];
    if (!allowedExtensions.includes(imgType)) {
        imgType = '';
    }
    return imgType;
}

chrome.webRequest.onBeforeRedirect.addListener(function (details) {
    redirectDetails[details.requestId] = details.url; // store the orignal url
}, {
    urls: ['<all_urls>'],
}, ['responseHeaders']);


/**************************************************************************
Handle incoming messages
***************************************************************************/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.foundImgSrcs) {
        createImgElements(message.foundImgSrcs.imgSrcs);
        return;
    }
    if (message.obtainedHref) {
        href = message.obtainedHref.href;
        return;
    }
});


/**************************************************************************
Emit outgoing messages
***************************************************************************/
async function emit(message) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
        const errorModal = document.querySelector('.error-modal');
        errorModal.firstElementChild.textContent = "Please refresh the page. If you still see this message, then ScrapeApe doesn't work on this page.";
        openModal(errorModal);
    }
}

/**************************************************************************
On load
***************************************************************************/
setSettingsForm();
emit({
    getHref: {}
});
