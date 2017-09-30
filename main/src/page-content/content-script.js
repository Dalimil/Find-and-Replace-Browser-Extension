// Injected into the currently active tab
// Runs sandboxed within the DOM context of the page

console.log($('textarea'));
console.log($('[contenteditable]'));
$('textarea').css({ border: "1px solid red" });
$('[contenteditable]').css({ border: "1px solid red" });

const TYPES = {
  textarea: 'textarea',
  contenteditable: 'contenteditable',
  mix: 'mix'
};

let port = null;
let currentOccurrenceIndex = 0;
let occurrenceCount = 0;

const CLASSES = {
  regularHighlight: 'hwt-mark-highlight',
  currentHighlight: 'hwt-highlight-current',
  textareaContainer: 'hwt-container'
};

setUpMessageConnections();

function setUpMessageConnections() {
  // Connect to search widget
  port = chrome.runtime.connect({
    name: "content-script-connection"
  });
  port.onMessage.addListener(handleApiCall);
}


function scrollInViewIfNotAlready($element) {
  const currentTop = $element.offset().top;
  const currentBottom = $element.offset().top + $element.outerHeight();
  const $window = $(window);
  const screenTop = $window.scrollTop();
  const screenBottom = $window.scrollTop() + $window.height();
  if ((currentTop > screenBottom) || (currentBottom < screenTop)) {
    window.scrollTo(
      0,
      Math.max(0, Math.round((currentBottom + currentTop - $window.height()) / 2))
    );
  }
}

/**
 * Move the active highlight class to an element at position index
 * Scrolls to the element in view if needed
 */
function setOccurrenceIndex(index) {
  const regularOccurrenceClass = CLASSES.regularHighlight;
  const currentOccurrenceClass = CLASSES.currentHighlight;
  $(`.${currentOccurrenceClass}`).removeClass(currentOccurrenceClass);

  occurrenceCount = $(`.${regularOccurrenceClass}`).length;
  if (occurrenceCount != 0) {
    index = ((index % occurrenceCount) + occurrenceCount) % occurrenceCount;
    currentOccurrenceIndex = index;
    const $current = $(`.${regularOccurrenceClass}`).eq(index).addClass(currentOccurrenceClass);
    scrollInViewIfNotAlready($current);
    console.log(currentOccurrenceIndex + "/" + occurrenceCount);
  } else {
    currentOccurrenceIndex = 0;
    console.log("No occurrences.");
  }
}

function getTextOffsetInParent(node) {
  let sibling = node.parentNode.firstChild;
  let textOffset = 0;
  while (sibling && sibling != node) {
    textOffset += sibling.textContent.length;
    sibling = sibling.nextSibling;
  }
  return textOffset;
}

function replaceCurrent(resultText) {
  const $node = $(`.${CLASSES.currentHighlight}`)
    .removeClass(CLASSES.currentHighlight)
    .removeClass(CLASSES.regularHighlight);

  const originalLength = $node.text().length;
  const originalOffset = getTextOffsetInParent($node.get(0));
  $node.text(resultText);
  flattenNode($node.get(0));

  // Check if this is a textarea highlight,
  //  replace the mirrored text too if so
  const wrapper = $node.closest(`.${CLASSES.textareaContainer}`);
  if (wrapper.size() != 0) {
    const textarea = wrapper.find('textarea');
    const originalText = textarea.val();
    const replacedText = originalText.substr(0, originalOffset) + resultText +
      originalText.substr(originalOffset + originalLength);
    textarea.val(replacedText);
  }

  // Set to same index because count decreased
  setOccurrenceIndex(currentOccurrenceIndex);
}

function replaceAll(resultText) {
  while (occurrenceCount > 0) {
    replaceCurrent(resultText);
  }
  // Clear indexes
  setOccurrenceIndex(0);
}

function flattenNode(node) {
  const parent = node.parentNode;
  parent.replaceChild(node.firstChild, node);
  // merge adjacent text nodes
  parent.normalize();
}

function setEditableAreaGlow($element) {
  $element.css({
    boxShadow: "inset 0 0 1em rgba(255, 94, 94, 0.8)"
  });
}

function clearEditableAreaGlow($element) {
  $element.css({
    boxShadow: ""
  });
}

function highlightTextarea($element, params, refocus) {
  $element.highlightWithinTextarea({
    highlight: [{
      highlight: params.query,
      className: CLASSES.regularHighlight
    }]
  });
  if (refocus) {
    $element.focus();
  }
}

function highlightContenteditable($element, params) {
  // Remove previous marks and mark new elements
  $("[contenteditable]").unmark({
    done: function() {
      const options = {
        className: CLASSES.regularHighlight,
        acrossElements: true,
        iframes: true
      };
      if (params.regex) {
        $element.markRegExp(params.query, options);
      } else {
        options.separateWordSearch = false;
        $element.mark(params.query, options);
      }
    }
  });
}

function updateSearch(params) {
  const activeSelection = getActiveSelection();
  console.log("Active element: ", activeSelection);

  if (activeSelection.type == TYPES.textarea) {
    // Textarea
    highlightTextarea(activeSelection.$element, params, /* refocus */ true);
    setEditableAreaGlow(activeSelection.$element);
  } else if (activeSelection.type == TYPES.contenteditable) {
    // Contenteditable
    highlightContenteditable(activeSelection.$element, params);
    setEditableAreaGlow(activeSelection.$element);
  } else {
    // Both (all are inactive)
    highlightTextarea($('textarea'), params);
    highlightContenteditable($('[contenteditable]'), params);
    setEditableAreaGlow($('textarea, [contenteditable]'));
  }

  // Reset current active
  // todo: maybe keep the previous index based on cursor?
  setOccurrenceIndex(0);
}


function getActiveSelection() {
  const activeElement = document.activeElement;
  const tagName = activeElement.tagName.toLowerCase();
  if (tagName == 'textarea') {
    const text = activeElement.value;
    const selectedText = text.substring(activeElement.selectionStart, activeElement.selectionEnd);
    return {
      type: TYPES.textarea,
      $element: $(activeElement)
    }
  } else if (activeElement.hasAttribute('contenteditable')) {
    const selection = window.getSelection();
    if (selection.isCollapsed) {
      // no text selected
    }
    return {
      type: TYPES.contenteditable,
      $element: $(activeElement)
    };
  }
  // No valid active input - so select all valid inactive
  return {
    type: TYPES.mix
  };
}

function shutdown() {
  $('textarea').css({ border: "1px solid skyblue" });
  $('[contenteditable]').css({ border: "1px solid skyblue" });
  $('textarea').highlightWithinTextarea('destroy');
  $("[contenteditable]").unmark();
  clearEditableAreaGlow($('textarea, [contenteditable]'));
}

function handleApiCall(msg) {
  console.log("Content Script API: ", msg.action);
  switch (msg.action) {
    case 'shutdown':
      shutdown();
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
