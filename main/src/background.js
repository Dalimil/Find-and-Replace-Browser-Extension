// Background extension page - Event page (only runs based on event listeners)
// Console log messages will not be shown (only shown in special console)

function setUpIconBrowserAction() {
  const contentScriptFilepath = "src/content_script.js";

  // Called when the user clicks on the browser action.
  chrome.browserAction.onClicked.addListener(tab => {
    chrome.tabs.executeScript(/* tabId - defaults to the active tab */ null,
      {
        file: contentScriptFilepath
      }
    );
  });
}

function setUpKeyboardCommands() {
  const replaceAllManifestCommandName = 'replace-all-action';

  // Keyboard shortcut handler
  chrome.commands.onCommand.addListener(command => {
    if (command == replaceAllManifestCommandName) {
      // TODO: replace all - maybe turn this keyboard shortcut into a local-only one?
      console.log('Replace all action triggered.');
    }
  });
}

function setUpContextMenu() {
  const contextMenuItemId = 'default_context_menu_item';
  chrome.contextMenus.create({
    id: contextMenuItemId,
    contexts: ['selection'],
    title: `Search for '%s' on this page.`
  });

  // Context menu handler
  chrome.contextMenus.onClicked.addListener(info => {
    if (!info.selectionText) {
      console.warn('Invalid context menu command.')
      return;
    }
    const selectionText = info.selectionText;
    console.log('Context menu selection: ', selectionText);
    // TODO: check if popup is open and find the new text
  });
}

// SET UP
setUpIconBrowserAction();
setUpKeyboardCommands();
setUpContextMenu();

console.log("Background event page just executed.");
