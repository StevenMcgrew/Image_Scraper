function getImages() {
    const anchors = [...document.querySelectorAll('.productView-thumbnail-link')];
    const srcSets = anchors.map(a => a.firstElementChild.srcset);
    for (const s of srcSets) {
        console.log(s);
    }
    send({ finishedGettingImages: true });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.getImages) {
        getImages();
    }
    // Optional: sendResponse({message: "goodbye"});
});


/**************************************************************************
Supporting functions
***************************************************************************/
async function send(message) {
    const response = await chrome.runtime.sendMessage(message);
    // Optional: do something with response
}