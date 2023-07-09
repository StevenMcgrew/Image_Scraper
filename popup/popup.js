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
const selectAllCheckbox = document.querySelector('.select-all');
let imgElements = [];
let imgCount = 0;
let href = '';

settingsBtn.addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    openModal(settingsModal);
});

editSettings.addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    openModal(settingsModal);
});

cancelModalBtn.addEventListener('click', (e) => {
    setSettings();
    const settingsModal = document.querySelector('.settings-modal');
    closeModal(settingsModal);
});

settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const settings = {
        maxW: settingsForm.maxW.value,
        maxH: settingsForm.maxH.value,
        isResizeAndConvert: settingsForm.isResizeAndConvert.checked,
        isCreateFolder: settingsForm.isCreateFolder.checked
    };

    chrome.storage.sync.set(settings)
        .then(() => {
            const settingsModal = document.querySelector('.settings-modal');
            closeModal(settingsModal);
            updateCurrentSettingsList(settings);
        });
});

getImagesBtn.addEventListener('click', (e) => {
    getImagesPanel.hidden = true;
    emit({
        getImageSrcs: {
            maxW: Math.round(settingsForm.maxW)
        }
    });
});

downloadBtn.addEventListener('click', () => {
    // if new folder, set folder name
    let folderNameWithSlash = '';
    if (settingsForm.isCreateFolder.checked) {
        folderNameWithSlash = getFolderName(href) + '/';
    }

    // iterate flex-items
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

function getFileName(href) {
    if (!href) {
        return 'image';
    }
    let pathname = new URL(href).pathname;
    const start = pathname.lastIndexOf('/') + 1;
    return pathname.slice(start);
}


function setSettings() {
    chrome.storage.sync.get(null)
        .then((result) => {
            settingsForm.maxW.value = Math.round(result.maxW);
            settingsForm.maxH.value = Math.round(result.maxH);
            settingsForm.isResizeAndConvert.checked = result.isResizeAndConvert;
            settingsForm.isCreateFolder.checked = result.isCreateFolder;
            updateCurrentSettingsList(result);
        });
}

function updateCurrentSettingsList(settings) {
    const currSettingsList = document.querySelector('.current-settings-list');
    const maxSize = document.createElement('li');
    const resizeAndConvert = document.createElement('li');
    const createFolder = document.createElement('li');

    maxSize.textContent = `Max size:  ${settings.maxW} x ${settings.maxH}`;
    resizeAndConvert.textContent = `Resize and convert:  ${settings.isResizeAndConvert}`;
    createFolder.textContent = `Create new folder:  ${settings.isCreateFolder}`;

    currSettingsList.replaceChildren(maxSize, resizeAndConvert, createFolder);
    // currSettingsList.appendChild(maxSize);
    // currSettingsList.appendChild(resizeAndConvert);
    // currSettingsList.appendChild(createFolder);
}

function createImgElements(srcs) {
    for (let src of srcs) {
        if (src.startsWith('http:')) {
            src = changeSrcToHttps(src);
        }
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
        const maxW = Math.round(settingsForm.maxW.value);
        const maxH = Math.round(settingsForm.maxH.value);
        const isResizeAndConvert = settingsForm.isResizeAndConvert.checked;
        const fileName = getFileName(img.src);
        let fileExt = getFileExt(fileName);
        let additionalNote = '';

        // Resizing and converting
        if (W > maxW || H > maxH) {
            if (isResizeAndConvert) {
                const newSize = determineSize(W, H, maxW, maxH);
                drawToCanvas(canvas, img, newSize.width, newSize.height);
                img.src = canvas.toDataURL('image/jpeg', 1.0);
                fileExt = 'jpg';
                W = newSize.width;
                H = newSize.height;
                additionalNote = 'Resized & Converted';
            } else {
                continue;
            }
        } else {
            if (isResizeAndConvert) {
                if (fileExt !== 'jpg' && fileExt !== 'jpeg') {
                    drawToCanvas(canvas, img, W, H);
                    img.src = canvas.toDataURL('image/jpeg', 1.0);
                    fileExt = 'jpg';
                    additionalNote = 'Converted';
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
        imgSize.textContent = `${W}x${H}`;
        imgType.textContent = fileExt;
        imgExtraDetails.textContent = additionalNote;
        imgName.textContent = fileName;
        imgName.setAttribute('title', fileName);
        img.classList.add('img-preview');
        imgContainer.appendChild(img);
        imgFlexwrap.appendChild(flexItem);
    }

    // Show download-btn and select-all
    selectAllCheckbox.removeAttribute('hidden');
    downloadBtn.removeAttribute('hidden');
}

function toggleChecked(e) {
    const item = e.currentTarget;
    const checkbox = item.firstElementChild.firstElementChild;
    checkbox.checked = !checkbox.checked;
    toggleDatasetChecked(item);
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

function compareWidths(imgA, imgB) {
    return imgB.naturalWidth - imgA.naturalWidth;
}

function getFileExt(fileName) {
    const start = fileName.lastIndexOf('.') + 1;
    return fileName.slice(start);
}

function changeSrcToHttps(src) {
    let arr = src.split(':');
    arr[0] = 'https';
    return arr.join(':');
}


/**************************************************************************
Image Ops
***************************************************************************/
function drawToCanvas(canvas, image, width, height) {
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
};

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
setSettings();
emit({
    getHref: {}
});