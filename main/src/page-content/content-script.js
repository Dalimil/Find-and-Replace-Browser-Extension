// Injected into the currently active tab
// Runs sandboxed within the DOM context of the page

document.body.style.backgroundColor="red";
console.log($('textarea'));

function setUpMessageConnections() {
  // Connect to search widget
  const port = chrome.runtime.connect({
    name: "content-script-connection"
  });
  port.postMessage({ type: "test from content script"});
  
  port.onMessage.addListener(msg => {
    console.log("Content Script API: ", msg.action);
    switch (msg.action) {
      case 'shutdown':
        document.body.style.backgroundColor="skyblue";
        //$('textarea').highlightWithinTextarea('destroy');
        break;
      case 'log':
        console.log("Widget Log: ", ...msg.data);
        break;
      case 'updateSearch':
        $('textarea').highlightWithinTextarea({
          highlight: msg.data.query
        });
        break;
      case 'findNext':
        break;
      case 'findPrev':
        break;
      case 'replaceCurrent':
        break;
      case 'replaceAll':
        break;
      default:
        console.log('Invalid API Call: ', msg.action);
    }
  });
}

function clearAllHighlights() {
  const selector = 'span._find-and-replace-highlight';
  document.querySelectorAll(selector).forEach(node => {
    const parent = node.parentNode;
    parent.replaceChild(node.firstChild, node);
    // merge adjacent text nodes
    parent.normalize();
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