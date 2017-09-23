// Manages all message passing between extension components

const contentScriptFilepath = "src/content_script.js";
const SingletonConnectionApi = new ConnectionApi(contentScriptFilepath);

class ConnectionApi {
  constructor(contentScriptPath) {
    this.dummy = window.chrome == undefined;
    if (this.dummy) return;

    // Connect to background page
    chrome.runtime.connect({
      name: "widget-background-connection"
    });    

    // Inject content script
    chrome.tabs.executeScript(/* tabId - defaults to the active tab */ null,
      {
        file: contentScriptPath
      }
    );

    // Connect with content_script
    this.contentScriptConnectionPromise = new Promise(resolve => {
      chrome.runtime.onConnect.addListener(port => {
        // port.name matches the one defined in the runtime.connect call
        if (port.name == "content-script-connection") {
          resolve(port);
        }
      });
    });
  }

  addResponseHandler(func) {
    this.contentScriptConnectionPromise.then(port => {
      port.onMessage.addListener(func);
    });
  }

  updateSearch(searchParams) {
    if (this.dummy) return;

  }

  findNext() {
    if (this.dummy) return;

  }

  findPrev() {
    if (this.dummy) return;

  }

  replaceCurrent() {
    if (this.dummy) return;

  }

  replaceAll() {
    if (this.dummy) return;

  }

}

export default SingletonConnectionApi;

