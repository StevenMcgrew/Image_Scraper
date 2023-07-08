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
        isResizeAndConvert: settingsForm.isResizeAndConvert.checked,
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
    emit({
        getImageSrcs: {
            maxW: Math.round(settingsForm.maxW)
        }
    });
});

downloadBtn.addEventListener('click', () => {
    const url = 'data:image/jpeg;base64,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';
    chrome.downloads.download({ url: url },
        function (id) {
        });
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

function setSettingsForm() {
    chrome.storage.sync.get(null)
        .then((result) => {
            settingsForm.maxW.value = Math.round(result.maxW);
            settingsForm.maxH.value = Math.round(result.maxH);
            settingsForm.isResizeAndConvert.checked = result.isResizeAndConvert;
            settingsForm.isCreateFolder.checked = result.isCreateFolder;
        });
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

        // Resizing and converting
        let resizedMessage = '';
        if (W > maxW || H > maxH) {
            if (isResizeAndConvert) {
                const newSize = determineSize(W, H, maxW, maxH);
                drawToCanvas(canvas, img, newSize.width, newSize.height);
                img.src = canvas.toDataURL('image/jpeg', 1.0);
                W = newSize.width;
                H = newSize.height;
                resizedMessage = 'Resized & ';
            } else {
                continue;
            }
        } else {
            if (isResizeAndConvert) {
                const fileExt = getFileExtFromSrc(img.src);
                if (fileExt !== 'jpg' && fileExt !== 'jpeg') {
                    drawToCanvas(canvas, img, W, H);
                    img.src = canvas.toDataURL('image/jpeg', 1.0);
                }
            }
        }

        // Get file type
        let fileType = '';
        if (img.src.startsWith('data')) {
            fileType = `${resizedMessage}Converted to ${getImageTypeFromDataURL(img.src)}`;
        }
        else {
            fileType = getFileExtFromSrc(img.src);
        }

        // Append to img-flexwrap
        const flexItem = flexItemTemplate.content.firstElementChild.cloneNode(true);
        const checkboxLabel = flexItem.querySelector('.select-img');
        const checkbox = flexItem.querySelector('.img-checkbox');
        const imgDetails = flexItem.querySelector('.img-details');
        const imgContainer = flexItem.querySelector('.img-container');
        flexItem.addEventListener('click', toggleChecked);
        checkboxLabel.addEventListener('click', (e) => e.stopPropagation());
        checkbox.addEventListener('click', toggleFlexItemChecked);
        imgDetails.textContent = `${W}x${H} ${fileType}`;
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
        element.style.outline = '1px solid gray';
    } else {
        element.dataset.checked = 'true';
        element.style.outline = '2px solid var(--primary)';
    }
}

function compareWidths(imgA, imgB) {
    return imgB.naturalWidth - imgA.naturalWidth;
}

function getFileExtFromSrc(src) {
    const indexOfQuery = src.indexOf('?');
    const end = (indexOfQuery === -1) ? undefined : indexOfQuery;
    let output = src.slice(0, end);
    const start = output.lastIndexOf('.') + 1;
    return output.slice(start);
}

function getImageTypeFromDataURL(dataURL) {
    const start = dataURL.indexOf('/') + 1;
    const end = dataURL.indexOf(';');
    return dataURL.slice(start, end);
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
    }
    // Optional: sendResponse({message: "goodbye"});
});


/**************************************************************************
Emit outgoing messages
***************************************************************************/
async function emit(message) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, message);
    // Optional: do something with response
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