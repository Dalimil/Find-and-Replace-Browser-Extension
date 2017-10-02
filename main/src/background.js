// Background extension page - Event page (only runs based on event listeners)
// Console log messages will not be shown (only shown in special console)

function setUpContextMenu() {
  const contextMenuHandlingContentScriptFilepath = "src/page-content/context-menu-content-script.js";
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

/**
 * Injects scripts into a web page in a sequence specified by array order
 */ 
function executeScripts(sources) {
  const executeScriptPromise = (source) => new Promise(resolve => {
    chrome.tabs.executeScript(
      /* tabId - defaults to the active tab */ null,
      { file: source },
      resolve
    );
  });
  let promiseSequence = Promise.resolve();
  sources.forEach(source => {
    promiseSequence = promiseSequence.then(() => executeScriptPromise(source));
  });
}

function injectContentScripts() {
  // Inject the following sources
  const scripts = [
    "src/page-content/lib/jquery-3.2.1.min.js",
    "src/page-content/lib/jquery.highlight-within-textarea.js",
    "src/page-content/lib/jquery.mark.min.js",
    "src/page-content/content-script.js"
  ];
  chrome.tabs.insertCSS(null, { file: "src/page-content/content-script.css" });
  executeScripts(scripts);
}

function setUpMessageConnections() {
  let contentScriptConnection = null;

  chrome.runtime.onConnect.addListener(port => {
    // port.name matches the one defined in the runtime.connect call
    if (port.name == "content-script-connection") {
      contentScriptConnection = port;
      contentScriptConnection.onDisconnect.addListener(() => {
        contentScriptConnection = null;
      });
      return;
    }
    
    if (port.name == "widget-background-connection") {
      // Widget has been spawn
      if (contentScriptConnection == null) {
        // Content scripts not injected yet
        injectContentScripts();
      } else {
        contentScriptConnection.postMessage({ action: 'restart' });
      }

      // Listen for widget shutdown
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
setUpContextMenu();
setUpMessageConnections();

console.log("Background event page just executed.");
