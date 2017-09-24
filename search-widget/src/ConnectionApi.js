import Utils from './Utils';

// Manages all message passing between extension components

class ConnectionApi {
  constructor() {
    this.dummy = window.chrome == undefined;
    if (this.dummy) return;

    // Connect to background page
    chrome.runtime.connect({
      name: "widget-background-connection"
    });    

    // Inject content scripts
    const scripts = [
      "src/page-content/lib/jquery-3.2.1.min.js",
      "src/page-content/lib/jquery.highlight-within-textarea.js",
      "src/page-content/content-script.js"
    ];
    chrome.tabs.insertCSS(null, { file: "src/page-content/content-script.css" });
    Utils.executeScripts(scripts);

    // Connect with our content script
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

  log(...args) {
    this.executeOnPort(port => {
      port.postMessage({
        action: 'log',
        data: args
      });
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

const SingletonConnectionApi = new ConnectionApi();
export default SingletonConnectionApi;

