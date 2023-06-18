const getImagesForm = document.getElementById('getImagesForm');
const p = document.getElementById('p');
const img = document.getElementById('img');

getImagesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();

    send({
        getImages: {
            maxWidth: Math.round(e.target.maxWidth.value)
        }
    });
});


/**************************************************************************
Handle incoming messages
***************************************************************************/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.finishedGettingImages) {
        p.textContent = message.finishedGettingImages.imgSrcs;
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
