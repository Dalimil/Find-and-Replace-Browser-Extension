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

const CLASSES = {
  regularHighlight: 'hwt-mark-highlight',
  currentHighlight: 'hwt-highlight-current'
};

setUpMessageConnections();

function setUpMessageConnections() {
  // Connect to search widget
  port = chrome.runtime.connect({
    name: "content-script-connection"
  });
  port.onMessage.addListener(handleApiCall);
}

/**
 * Move the active highlight class to an element at position index
 */
function setOccurrenceIndex(index) {
  const regularOccurrenceClass = CLASSES.regularHighlight;
  const currentOccurrenceClass = CLASSES.currentHighlight;
  $(`.${currentOccurrenceClass}`).removeClass(currentOccurrenceClass);

  occurrenceCount = $(`.${regularOccurrenceClass}`).length;
  if (occurrenceCount != 0) {
    index = ((index % occurrenceCount) + occurrenceCount) % occurrenceCount;
    currentOccurrenceIndex = index;
    $(`.${regularOccurrenceClass}`).eq(index).addClass(currentOccurrenceClass);
    console.log(currentOccurrenceIndex + "/" + occurrenceCount);
  } else {
    currentOccurrenceIndex = 0;
    console.log("No occurrences.");
  }
}

function replaceCurrent(resultText) {
  const $node = $(`.${CLASSES.currentHighlight}`)
    .removeClass(CLASSES.currentHighlight)
    .removeClass(CLASSES.regularHighlight)
    .text(resultText);

  flattenNode($node.get(0));
  // Set to same index because count decreased
  setOccurrenceIndex(currentOccurrenceIndex);
}

function replaceAll(resultText) {

}

function flattenNode(node) {
  const parent = node.parentNode;
  parent.replaceChild(node.firstChild, node);
  // merge adjacent text nodes
  parent.normalize();
}


function updateSearch(params) {
  $('textarea').highlightWithinTextarea({
    highlight: [{
      highlight: params.query, // can be regex
      className: CLASSES.regularHighlight
    }]
  });
  setOccurrenceIndex(0);
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
      updateSearch(msg.data);
      break;
    case 'findNext':
      setOccurrenceIndex(currentOccurrenceIndex + 1);
      break;
    case 'findPrev':
      setOccurrenceIndex(currentOccurrenceIndex - 1);
      break;
    case 'replaceCurrent':
      replaceCurrent(msg.data.text);
      break;
    case 'replaceAll':
      replaceAll(msg.data.text);
      break;
    default:
      console.log('Invalid API Call: ', msg.action);
  }
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