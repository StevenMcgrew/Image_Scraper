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
const imgElements = [];
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
        isResizeAndCovert: settingsForm.isResizeAndConvert.checked,
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
    const imgs = [...imgFlexwrap.children];
    const imgSrcs = imgs.map(img => img.src);
    // for (img of imgs) {

    // }
    emit({
        downloadImages: {
            selectedImgSrcs: imgSrcs
        }
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
    for (const src of srcs) {
        const img = document.createElement('img');
        img.src = src;
        img.addEventListener('error', (e) => { handleImgLoadError(e, srcs.length); });
        img.addEventListener('load', (e) => { pushAndContinue(e, srcs.length); });
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
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        const maxW = Math.round(settingsForm.maxW.value);
        const maxH = Math.round(settingsForm.maxH.value);
        const isResizeAndConvert = settingsForm.isResizeAndConvert.checked;

        img.removeEventListener('load', pushAndContinue);

        // Resizing and converting
        if (W > maxW || H > maxH) {
            if (isResizeAndConvert) {
                drawToCanvas(canvas, img, maxW, maxH);
                img.src = canvas.toDataURL('image/jpeg', 1.0);
            }
            else {
                img.src = null;
            }
        }
        else if (isResizeAndConvert) {
            drawToCanvas(canvas, img, W, H);
            img.src = canvas.toDataURL('image/jpeg', 1.0);
        }

        // Append to img-flexwrap
        const flexItem = flexItemTemplate.content.firstElementChild.cloneNode(true);
        const imgContainer = flexItem.querySelector('.img-container');
        img.classList.add('img-preview');
        imgContainer.appendChild(img);
        imgFlexwrap.appendChild(flexItem);
    }
}

function compareWidths(imgA, imgB) {
    return imgB.naturalWidth - imgA.naturalWidth;
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
    return { width: w, height: h };
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