const getImagesBtn = document.querySelector('.get-images-btn');
const imgGrid = document.querySelector('.img-grid');
const downloadBtn = document.querySelector('.download-btn');
const settingsBtn = document.querySelector('.settings-btn');
const editSettings = document.querySelector('.edit-settings');
const cancelModalBtn = document.querySelector('.cancel-modal-btn');
const settingsForm = document.querySelector('.settings-form');

settingsBtn.addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    openModal(settingsModal);
});

editSettings.addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    openModal(settingsModal);
});

cancelModalBtn.addEventListener('click', (e) => {
    const settingsModal = document.querySelector('.settings-modal');
    closeModal(settingsModal);
});

settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Save settings

    const settingsModal = document.querySelector('.settings-modal');
    closeModal(settingsModal);
});

getImagesBtn.addEventListener('click', (e) => {
    send({
        getImages: {
            maxWidth: Math.round(e.target.maxWidth.value)
        }
    });
});

downloadBtn.addEventListener('click', () => {
    const imgs = [...imgGrid.children];
    const imgSrcs = imgs.map(img => img.src);
    // for (img of imgs) {

    // }
    send({
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

function replaceImages(imgSrcs) {
    // let imgArray = [];
    for (const imgSrc of imgSrcs) {
        // Download image and store it or set it to an img element

        // Determine size
        const size = determineSize(img.width, img.height, maxW, maxH);

        // Draw to canvas



        // Create anchor and set href to myCanvas.toDataURL()

        // Click anchor to trigger download


        // const img = new Image(200, 200);
        // img.src = imgSrc;
        // img.classList.add('image-item');
        // imgArray.push(img);
    }
    // imgGrid.replaceChildren(...imgArray);
}

function setGridItemImg(canvas, div) {
    if (canvas.width < div.clientWidth && canvas.height < div.clientHeight) {
        div.style.backgroundSize = 'auto';
    }
    else {
        div.style.backgroundSize = 'contain';
    }
    div.style.backgroundImage = 'url(' + canvas.toDataURL() + ')';
};


/**************************************************************************
Image Ops
***************************************************************************/
function drawOptimizedImage(canvas, image, width, height) {
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
    if (message.finishedGettingImages) {
        replaceImages(message.finishedGettingImages.imgSrcs);
    }
    // Optional: sendResponse({message: "goodbye"});
});


/**************************************************************************
Send outgoing messages
***************************************************************************/
async function send(message) {
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
