// Injected into the currently active tab
// Runs sandboxed within the DOM context of the page

document.body.style.backgroundColor="red";


function setUpMessageConnections() {
  // Connect to search widget
  const port = chrome.runtime.connect({
    name: "content-script-connection"
  });
  port.postMessage({ type: "test from content script"});
  
  port.onMessage.addListener(msg => {
    console.log("Content Script: ", msg);
    if (msg.action == 'shutdown') {
      document.body.style.backgroundColor="skyblue";
    }
  });
}

setUpMessageConnections();

/*
const TYPES = {
  input: 1,
  textarea: 2,
  ceditable: 3
};

function getInputElementsForNode(root) {
  const inputTexts = [...root.querySelectorAll('input[type=text]')];
  const textareas = [...root.querySelectorAll('textarea')];
  const contentEditables = [...root.querySelectorAll('[contenteditable]')];
  
  return inputTexts.map(x => ({ el: x, type: TYPES.input }))
  .concat(
    textareas.map(x => ({ el: x, type: TYPES.textarea }))
  )
  .concat(
    contentEditables.map(x => ({ el: x, type: TYPES.ceditable }))
  );
}

const mainBody = getInputElementsForNode(document.body);

const iframes = [...document.querySelectorAll('iframe')].map(iframe => ({
  el: iframe,
  inputElements: getInputElementsForNode(iframe.contentWindow.document.body)
}));

*/