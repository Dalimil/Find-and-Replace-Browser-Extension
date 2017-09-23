// Background extension page - Event page (only runs based on event listeners)
// Console log messages will not be shown (only shown in special console)

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
  const contextMenuHandlingContentScriptFilepath = "src/context_menu_content_script.js";
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
    // Pop-up is close and cannot be opened - insert content script instead
    chrome.tabs.executeScript(/* tabId - defaults to the active tab */ null,
      {
        file: contextMenuHandlingContentScriptFilepath
      }
    );
  });
}

function setUpMessageConnections() {
  let contentScriptConnection = null;

  chrome.runtime.onConnect.addListener(port => {
    // port.name matches the one defined in the runtime.connect call
    if (port.name == "content-script-connection") {
      contentScriptConnection = port;
      return;
    }
    
    if (port.name == "widget-background-connection") {
      port.onDisconnect.addListener(() => {
        console.log("Widget disconnected");
        // Notify content script to clean up and shut down
        if (contentScriptConnection) {
          contentScriptConnection.postMessage({ action: 'shutdown' });
        }
      });
    }
  });
}

// SET UP
setUpKeyboardCommands();
setUpContextMenu();
setUpMessageConnections();

console.log("Background event page just executed.");
