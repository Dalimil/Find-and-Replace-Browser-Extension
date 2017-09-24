// Contains static helper methods

const Utils = {
  // Injects scripts into a web page in a sequence specified by array order
  executeScripts(sources) {
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
};

export default Utils;
