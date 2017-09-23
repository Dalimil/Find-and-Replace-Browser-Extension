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

  executeOnPort(func) {
    if (this.dummy) return;

    this.contentScriptConnectionPromise.then(port => func(port));
  }

  addResponseHandler(func) {
    this.executeOnPort(port => {
      port.onMessage.addListener(func);
    });
  }

  updateSearch(searchParams) {
    this.executeOnPort(port => {
      port.postMessage({
        action: 'updateSearch',
        data: searchParams
      });
    });
  }

  findNext() {
    this.executeOnPort(port => {
      port.postMessage({
        action: 'findNext'
      });
    });
  }

  findPrev() {
    this.executeOnPort(port => {
      port.postMessage({
        action: 'findPrev'
      });
    });
  }

  replaceCurrent(replaceParams) {
    this.executeOnPort(port => {
      port.postMessage({
        action: 'replaceCurrent',
        data: replaceParams
      });
    });
  }

  replaceAll(replaceParams) {
    this.executeOnPort(port => {
      port.postMessage({
        action: 'replaceAll',
        data: replaceParams
      });
    });
  }

}

export default SingletonConnectionApi;

