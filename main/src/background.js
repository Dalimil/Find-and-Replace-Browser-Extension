// Background extension page - Event page (only runs based on event listeners)
// Console log messages will not be shown (only shown in special console)

function setUpExtensionInstallEvents() {
  if (chrome && chrome.runtime && chrome.runtime.setUninstallURL) {
    chrome.runtime.setUninstallURL('https://find-and-replace-f6588.firebaseapp.com/uninstall');
  }

  chrome.runtime.onInstalled.addListener((details) => {
    if (details && details.reason && details.reason == 'install') {
      chrome.tabs.create({ url: 'help.html' });
    }
  });
}

function setUpContextMenu() {
  const contextMenuHandlingContentScriptFilepath = 'src/page-content/context-menu-content-script.js';
  const contextMenuItemId = 'default_context_menu_item';

  chrome.contextMenus.create({
    id: contextMenuItemId,
    contexts: ['selection'],
    title: 'Find and Replace in Text Selection',
  });

  // Context menu handler
  chrome.contextMenus.onClicked.addListener((info) => {
    if (!info.selectionText) {
      console.warn('Invalid context menu command.');
      return;
    }
    const selectionText = info.selectionText;
    // Pop-up is closed and cannot be opened - insert content script instead

    withActiveTab(function (activeTab) {
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: [contextMenuHandlingContentScriptFilepath],
      });
    });
    // User expects to search in the text selection - update Storage
    const searchStateKey = 'search-state'; // fixed ID
    chrome.storage.local.get(searchStateKey, (data) => {
      const isPreviousSaved =
        searchStateKey in data && data[searchStateKey] != null && data[searchStateKey] != undefined;
      const searchState = isPreviousSaved ? data[searchStateKey] : {};
      searchState.advancedSearchExpanded = true;
      searchState.limitToSelectionInput = true;
      chrome.storage.local.set({
        [searchStateKey]: searchState,
      });
    });
  });
}

/**
 * Injects scripts into a web page in a sequence specified by array order
 */
function executeScripts(sources) {
  const executeScriptPromise = (source, activeTab) =>
    new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: [source],
        },
        resolve
      );
    });

  withActiveTab(function (activeTab) {
    let promiseSequence = Promise.resolve();
    sources.forEach((source) => {
      promiseSequence = promiseSequence.then(() => executeScriptPromise(source, activeTab));
    });
  });
}

function injectContentScripts(activeTab) {
  // Inject the following sources
  const scripts = [
    'src/page-content/lib/jquery-3.2.1.min.js',
    'src/page-content/lib/jquery.highlight-within-textarea.js',
    'src/page-content/lib/jquery.mark.min.js',
    'src/page-content/content-script.js',
  ];
  chrome.scripting.insertCSS({
    target: { tabId: activeTab.id, allFrames: true },
    files: ['src/page-content/content-script.css'],
  });
  executeScripts(scripts);
}

function sendContentScriptShutdownCmd(contentScriptConnection) {
  const isFirefox = typeof InstallTrigger !== 'undefined';

  // (bugfix) Firefox disconnects the port in content script on pop-up close
  if (isFirefox) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'shutdown' });
    });
  } else {
    // Chrome
    if (contentScriptConnection) {
      contentScriptConnection.postMessage({ action: 'shutdown' });
    }
  }
}

function setUpMessageConnections() {
  let contentScriptConnection = null;

  chrome.runtime.onConnect.addListener((port) => {
    // port.name matches the one defined in the runtime.connect call
    if (port.name == 'content-script-connection') {
      contentScriptConnection = port;
      contentScriptConnection.onDisconnect.addListener(() => {
        // Event only fires in Chrome (Firefox bug)
        contentScriptConnection = null;
      });
      return;
    }

    if (port.name == 'widget-background-connection') {
      // Widget has been spawn
      // Inject a content script checking if the page has been initialized
      //  (and script triggers port reconnect if it has)
      withActiveTab(function (activeTab) {
        chrome.scripting.executeScript(
          {
            target: { tabId: activeTab.id },
            files: ['src/page-content/init-content-script.js'],
          },
          ([{ result: initialized } = { result: false }]) => {
            console.log('Script previously injected?: ', initialized);
            if (!initialized) {
              // Content scripts not injected yet
              injectContentScripts(activeTab);
            }
          }
        );
      });
      // Listen for widget shutdown
      port.onDisconnect.addListener(() => {
        console.log('Widget disconnected');
        // Notify content script to clean up and shut down
        sendContentScriptShutdownCmd(contentScriptConnection);
      });
    }
  });
}

function withActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    callback(activeTab);
  });
}

// SET UP
setUpExtensionInstallEvents();
setUpContextMenu();
setUpMessageConnections();

console.log('Background event page just executed.');
