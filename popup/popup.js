let btn = document.getElementById('btn');
let p = document.getElementById('p');

btn.addEventListener('click', () => {
    send({ getImages: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.finishedGettingImages) {
        p.textContent = "All done getting images.";
    }
    // Optional: sendResponse({message: "goodbye"});
});


/**************************************************************************
Supporting functions
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
