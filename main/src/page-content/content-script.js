// Injected into the currently active tab
// Runs sandboxed within the DOM context of the page

console.log($('textarea'));
console.log($('[contenteditable]'));
$('textarea').css({ border: "5px solid red" });
$('[contenteditable]').css({ border: "5px solid red" });

// todo make these 'let' after fixing duplicate injection
let port = null;
let currentOccurrenceIndex = 0;
let occurrenceCount = 0;

setUpMessageConnections();

function setUpMessageConnections() {
  // Connect to search widget
  port = chrome.runtime.connect({
    name: "content-script-connection"
  });
  port.onMessage.addListener(handleApiCall);
}

function setOccurrenceIndex(index) {
  const regularOccurrenceClass = 'hwt-mark-highlight';
  const currentOccurrenceClass = 'hwt-highlight-current';

  occurrenceCount = $(`.${regularOccurrenceClass}`).length;
  index = ((index % occurrenceCount) + occurrenceCount) % occurrenceCount;
  currentOccurrenceIndex = index;
  $(`.${currentOccurrenceClass}`).removeClass(currentOccurrenceClass);
  $(`.${regularOccurrenceClass}`).eq(index).addClass(currentOccurrenceClass);
  console.log(currentOccurrenceIndex + "/" + occurrenceCount);
}

function handleApiCall(msg) {
  console.log("Content Script API: ", msg.action);
  switch (msg.action) {
    case 'shutdown':
      $('textarea').css({ border: "5px solid skyblue" });
      $('[contenteditable]').css({ border: "5px solid skyblue" });
      $('textarea').highlightWithinTextarea('destroy');
      break;
    case 'restart':
      port.onMessage.removeListener(handleApiCall);
      return setUpMessageConnections();
      break;
    case 'log':
      console.log("Widget Log: ", ...msg.data);
      break;
    case 'updateSearch':
      $('textarea').highlightWithinTextarea({
        highlight: [{
          highlight: msg.data.query, // can be regex
          className: 'hwt-mark-highlight'
        }]
      });
      setOccurrenceIndex(0);
      /*port.postMessage({
        response: 'updateSearch',
        count: occurrenceCount
      });*/
      break;
    case 'findNext':
      setOccurrenceIndex(currentOccurrenceIndex + 1);
      break;
    case 'findPrev':
      setOccurrenceIndex(currentOccurrenceIndex - 1);
      break;
    case 'replaceCurrent':
      break;
    case 'replaceAll':
      break;
    default:
      console.log('Invalid API Call: ', msg.action);
  }
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