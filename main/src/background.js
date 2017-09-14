// Background extension page - Event page (only runs based on event listeners)
// Console log messages will not be shown (only shown in special console)

const contentScriptFilepath = "src/content_script.js";

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(tab => {
  chrome.tabs.executeScript(/* tabId - defaults to the active tab */ null,
    {
      file: contentScriptFilepath
    }
  );
});
