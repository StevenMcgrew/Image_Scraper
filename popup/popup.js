const getImagesBtn = document.querySelector('.get-images-btn');
const imgFlexwrap = document.querySelector('.img-flexwrap');
const downloadBtn = document.querySelector('.download-btn');
const settingsBtn = document.querySelector('.settings-btn');
const editSettings = document.querySelector('.edit-settings');
const cancelModalBtn = document.querySelector('.cancel-modal-btn');
const settingsForm = document.querySelector('.settings-form');
const canvas = document.querySelector('.canvas');
const flexItemTemplate = document.querySelector('.flex-item-template');
const getImagesPanel = document.querySelector('.get-images-panel');
const selectAll = document.querySelector('.select-all');
let imgElements = [];
let selectionCount = 0;
let imgCount = 0;
let href = '';
let isAltKeyDown = false;

document.addEventListener("keydown", function (e) {
    isAltKeyDown = true;
});

document.addEventListener("keyup", function (e) {
    isAltKeyDown = false;
});

selectAll.addEventListener('change', (e) => {
    let newChecked;
    let newOutline;
    let newBorderColor;

    if (e.target.checked) {
        newChecked = true;
        newOutline = '2px solid var(--primary)';
        newBorderColor = 'transparent';
    } else {
        newChecked = false;
        newOutline = 'none';
        newBorderColor = 'gray';
    }

    let items = imgFlexwrap.children;
    for (const item of items) {
        const checkbox = item.firstElementChild.firstElementChild;
        checkbox.checked = newChecked;
        item.dataset.checked = newChecked.toString();
        item.style.outline = newOutline;
        item.style.borderColor = newBorderColor;
    }
});

settingsBtn.addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    openModal(settingsModal);
});

editSettings.addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    openModal(settingsModal);
});

cancelModalBtn.addEventListener('click', (e) => {
    setSettingsForm();
    const settingsModal = document.querySelector('.settings-modal');
    closeModal(settingsModal);
});

settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();

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

getImagesBtn.addEventListener('click', (e) => {
    getImagesPanel.hidden = true;
    document.querySelector('.spinner').hidden = false;
    emit({
        getImageSrcs: {
            maxW: Math.round(settingsForm.maxW.value)
        }
    });
});

downloadBtn.addEventListener('click', (e) => {
    let folderNameWithSlash = '';
    if (settingsForm.isCreateFolder.checked) {
        folderNameWithSlash = getFolderName(href) + '/';
    }

    let items = imgFlexwrap.children;
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
});

function showDownloadBtn(selectionCount) {
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

function getRandom_0_to_998() {
    return Math.floor(Math.random() * 999);
}

function getFileName(href) {
    let pathname = new URL(href).pathname;
    const start = pathname.lastIndexOf('/') + 1;
    let fileName = pathname.slice(start);
    return removeIllegalChars(fileName, 'x');
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
            settingsForm.maxW.value = Math.round(result.maxW) || 5000;
            settingsForm.maxH.value = Math.round(result.maxH) || 5000;
            settingsForm.isScaleDown.checked = result.isScaleDown || false;
            settingsForm.isConvertToJPG.checked = result.isConvertToJPG || false;
            settingsForm.isMakeSquare.checked = result.isMakeSquare || false;
            settingsForm.isCreateFolder.checked = result.isCreateFolder || false;
        });
}

function createImgElements(srcs) {
    for (let src of srcs) {
        const img = document.createElement('img');
        img.onerror = (e) => { handleImgLoadError(e, srcs.length); };
        img.onload = (e) => { pushAndContinue(e, srcs.length); };
        img.src = src;
    }
}

function handleImgLoadError(e, srcsLength) {
    imgCount++;
    if (imgCount === srcsLength) {
        continueAndFinish();
    }
}

function pushAndContinue(e, srcsLength) {
    imgCount++;
    imgElements.push(e.currentTarget);
    if (imgCount === srcsLength) {
        continueAndFinish();
    }
}

function continueAndFinish() {
    imgElements.sort(compareWidths);

    for (const img of imgElements) {
        img.onerror = null;
        img.onload = null;

        let W = img.naturalWidth;
        let H = img.naturalHeight;

        if (W < 5 || H < 5) {
            continue;
        }

        const maxW = Math.round(settingsForm.maxW.value);
        const maxH = Math.round(settingsForm.maxH.value);
        let fileName = getFileName(img.src);
        let fileExt = getFileExt(fileName);
        let additionalNote = '';

        // Resizing and converting
        if (W > maxW || H > maxH) {
            if (!settingsForm.isScaleDown.checked) {
                continue;
            }
            const newSize = determineSize(W, H, maxW, maxH);
            W = newSize.width;
            H = newSize.height;
            if (fileExt !== 'jpg' && fileExt !== 'jpeg') {
                fileName = changeFileExtToJpg(fileName);
                fileExt = 'jpg';
                additionalNote += 'Converted & ';
            }
            if (settingsForm.isMakeSquare.checked && W !== H) {
                drawToSquareCanvas(canvas, img, W, H);
                W = (W > H) ? W : H;
                H = W;
                additionalNote += 'Resized & Squared';
            } else {
                drawToCanvas(canvas, img, W, H);
                additionalNote += 'Resized';
            }
            try {
                img.src = canvas.toDataURL('image/jpeg', 1.0);
            } catch (error) {
                console.log('canvas.toDataURL error on this src:  ', img.src);
                console.log(error);
                continue;
            }
        } else {
            if (settingsForm.isMakeSquare.checked && W !== H) {
                drawToSquareCanvas(canvas, img, W, H);
                W = (W > H) ? W : H;
                H = W;
                try {
                    img.src = canvas.toDataURL('image/jpeg', 1.0);
                } catch (error) {
                    console.log('canvas.toDataURL error on this src:  ', img.src);
                    console.log(error);
                    continue;
                }
                if (fileExt !== 'jpg' && fileExt !== 'jpeg') {
                    fileName = changeFileExtToJpg(fileName);
                    fileExt = 'jpg';
                    additionalNote += 'Converted & ';
                }
                additionalNote += 'Squared';
            } else {
                if (fileExt !== 'jpg' && fileExt !== 'jpeg' && settingsForm.isConvertToJPG.checked) {
                    drawToCanvas(canvas, img, W, H);
                    try {
                        img.src = canvas.toDataURL('image/jpeg', 1.0);
                    } catch (error) {
                        console.log('canvas.toDataURL error on this src:  ', img.src);
                        console.log(error);
                        continue;
                    }
                    fileName = changeFileExtToJpg(fileName);
                    fileExt = 'jpg';
                    additionalNote += 'Converted';
                }
            }
        }

        // Append to img-flexwrap
        const flexItem = flexItemTemplate.content.firstElementChild.cloneNode(true);
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
        imgSize.textContent = `${W} x ${H}`;
        imgType.textContent = fileExt;
        if (additionalNote) {
            imgExtraDetails.classList.add('yellow-bg');
            imgExtraDetails.textContent = additionalNote;
        }
        imgName.textContent = fileName;
        imgName.setAttribute('title', fileName);
        img.classList.add('img-preview');
        imgContainer.appendChild(img);
        imgFlexwrap.appendChild(flexItem);
    }

    // Show download-btn and select-all checkbox
    document.querySelector('.spinner').hidden = true;
    const imgCount = imgFlexwrap.childElementCount;
    document.querySelector('.select-all-span').textContent = `Select All (${imgCount})`;
    downloadBtn.textContent = `Download 0 images`;
    selectAll.hidden = false;
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
        downloadBtn.hidden = true;
    }
}

function compareWidths(imgA, imgB) {
    return imgB.naturalWidth - imgA.naturalWidth;
}

function getFileExt(fileName) {
    const start = fileName.lastIndexOf('.') + 1;
    return fileName.slice(start);
}

function changeFileExtToJpg(fileName) {
    const end = fileName.lastIndexOf('.');
    let newFileName = fileName.slice(0, end);
    return newFileName += '.jpg';
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
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, message);
}

// async function getCurrentTab() {
//     let queryOptions = { active: true };
//     let [tab] = await chrome.tabs.query(queryOptions);
//     return tab;
// };

// function injectContentScript(tab) {
//     const { id, url } = tab;
//     chrome.scripting.executeScript(
//         {
//             target: { tabId: id },
//             files: ['content.js']
//         }
//     );
// };

// if (!window['alreadyInjected']) {
//     getCurrentTab().then((tab) => {
//         injectContentScript(tab);
//         window['alreadyInjected'] = true;
//     });
// }

/**************************************************************************
On load
***************************************************************************/
setSettingsForm();
emit({
    getHref: {}
});