// Injected into the currently active tab
// Runs sandboxed within the DOM context of the page

// todo remove debug
(() => {
  $('textarea').css({ border: "1px solid red" });
  $('[contenteditable]').css({ border: "1px solid red" });
})();

const TYPES = {
  textarea: 'textarea',
  contenteditable: 'contenteditable',
  mix: 'mix'
};

let port = null;
// Total # of highlights; multiple adjacent marks across element boundaries count as 1
let occurrenceCount = 0; 
// Current highlight index - again the 'real' index (merging cross boundary occurrences)
let currentOccurrenceIndex = 0;
const Context = {
  doc: document,
  win: window
};

const CLASSES = {
  regularHighlight: 'hwt-mark-highlight',
  currentHighlight: 'hwt-highlight-current',
  textareaContainer: 'hwt-container',
  textareaContentMirror: 'hwt-highlights'
};
const SELECTORS = {}; // '.' + 'className'
Object.keys(CLASSES).forEach(classId => {
  SELECTORS[classId] = `.${CLASSES[classId]}`;
});

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
  const $window = $(Context.win);
  const screenTop = $window.scrollTop();
  const screenBottom = $window.scrollTop() + $window.height();
  if ((currentTop > screenBottom) || (currentBottom < screenTop)) {
    Context.win.scrollTo(
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
  $(SELECTORS.currentHighlight, Context.doc).removeClass(CLASSES.currentHighlight);

  occurrenceCount = $(SELECTORS.regularHighlight, Context.doc).length;
  if (occurrenceCount != 0) {
    index = ((index % occurrenceCount) + occurrenceCount) % occurrenceCount;
    currentOccurrenceIndex = index;
    const $current = $(SELECTORS.regularHighlight, Context.doc).eq(index).addClass(CLASSES.currentHighlight);
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

/**
 * Replaces the current (highlighted) occurrence
 *    performs the replacement in the first node if matched accross elements
 */
function replaceCurrent(resultText) {
  const $nodes = $(SELECTORS.currentHighlight, Context.doc)
    .removeClass(CLASSES.currentHighlight)
    .removeClass(CLASSES.regularHighlight);

  const originalLength = $nodes.text().length;
  const originalOffset = getTextOffsetInParent($nodes.get(0));
  const $wrapper = $nodes.eq(0).closest(SELECTORS.textareaContainer);
  $nodes.each((index, el) => {
    if (index == 0) {
      $(el).text(resultText);
    } else {
      $(el).text("");
    }
    flattenNode(el);
  });

  // Check if this is a textarea highlight, replace the mirrored text too if so
  if ($wrapper.length != 0) {
    const textarea = $wrapper.find('textarea');
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
  // replace '<>text<>' with 'text'
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

function highlightTextarea($elements, params, refocus) {
  // Sets up containers ONLY
  $elements.highlightWithinTextarea({
    highlight: ''
  });
  if (refocus && $elements.length == 1) {
    // only works for a single (previously focused) element
    $elements.focus();
  }
  const $containers = $elements.closest(SELECTORS.textareaContainer);
  const $mirrors = $containers.find(SELECTORS.textareaContentMirror);
  return highlightHtml($mirrors, params);
}

function highlightContenteditable($elements, params) {
  return highlightHtml($elements, params);
}

function highlightHtml($elements, params) {
  return new Promise((resolve, reject) => {
    // First unmark all potential previous highlights
    $elements.unmark({
      done: function() {
        // Once finished, mark new elements 
        const options = {
          className: CLASSES.regularHighlight,
          acrossElements: true,
          done: resolve,
          filter: (node, term, counter) => {
            // todo
            console.log(" filter ->", node, term, counter, node.parentNode);
            return true;
          }
        };
        if (params.useRegex) {
          const mod = params.matchCase ? "mg" : "mgi";
          let regexQuery = params.query;
          if (params.wholeWords) {
            regexQuery = `\\b${regexQuery}\\b`;
          }
          try {
            const regexp = new RegExp(regexQuery, mod);
            $elements.markRegExp(regexp, options);
          } catch (e) {
            reject(e);
          }
        } else {
          options.separateWordSearch = false;
          options.caseSensitive = params.matchCase;
          if (params.wholeWords) {
            options.accuracy = 'exactly'; // predefined option
          }
          $elements.mark(params.query, options);
        }
      }
    });
  });
}



function updateSearch(params) {
  const activeSelection = getActiveSelectionAndContext(document, window);
  Context.doc = activeSelection.documentContext;
  Context.win = activeSelection.windowContext;

  console.log("Active element: ", activeSelection, " Document context: ", Context.doc);

  const highlightMatchesPromise = new Promise((resolve, reject) => {
    if (activeSelection.type == TYPES.textarea) {
      // Textarea
      highlightTextarea(activeSelection.$element, params, /* refocus */ true)
          .then(resolve).catch(reject);
      setEditableAreaGlow(activeSelection.$element);
    } else if (activeSelection.type == TYPES.contenteditable) {
      // Contenteditable
      highlightContenteditable(activeSelection.$element, params)
          .then(resolve).catch(reject);
      setEditableAreaGlow(activeSelection.$element);
    } else {
      // Both (all are inactive) - but possibly inside a selected iframe
      Promise.all([
        highlightTextarea($('textarea', Context.doc), params),
        highlightContenteditable($('[contenteditable]', Context.doc), params)
      ])
      .then(values => values[0] + values[1])
      .then(resolve)
      .catch(reject);
      setEditableAreaGlow($('textarea, [contenteditable]', Context.doc));
    }
  });

  highlightMatchesPromise.then(totalMarks => {
    console.log("Total ", totalMarks);
    /* findAll */
    setOccurrenceIndex(0); // maybe keep current
  }).catch(e => {
    console.log("Invalid regexp? ", e);
  });
}


// TODO: return current text selection
function getActiveSelectionAndContext(documentContext, windowContext) {
  const activeElement = documentContext.activeElement;
  if (activeElement) {
    const tagName = activeElement.tagName.toLowerCase();
    if (tagName == 'textarea') {
      const text = activeElement.value;
      const selectedText = text.substring(activeElement.selectionStart, activeElement.selectionEnd);
      return {
        type: TYPES.textarea,
        $element: $(activeElement),
        documentContext,
        windowContext
      }
    } else if (activeElement.hasAttribute('contenteditable')) {
      const selection = window.getSelection();
      if (selection.isCollapsed) {
        // no text selected
      }
      return {
        type: TYPES.contenteditable,
        $element: $(activeElement),
        documentContext,
        windowContext
      };
    } else if (tagName == 'iframe') {
      try {
        // Get 'document' object of the iframe
        const innerContext = $(activeElement).contents().get(0);
        return getActiveSelection(innerContext, activeElement.contentWindow);
      } catch (e) {
        // ^^^ cross-origin iframe not accessible
        return {
          type: TYPES.mix,
          documentContext,
          windowContext
        };
      }
    }
  }
  // No valid active input - so select all valid inactive
  return {
    type: TYPES.mix,
    documentContext,
    windowContext
  };
}

function shutdown() {
  $('textarea', Context.doc).highlightWithinTextarea('destroy');
  $('[contenteditable]', Context.doc).unmark();
  $(SELECTORS.textareaContentMirror, Context.doc).unmark();
  clearEditableAreaGlow($('textarea, [contenteditable]', Context.doc));
}

function handleApiCall(msg) {
  console.log("Content Script API: ", msg.action, msg.data);
  switch (msg.action) {
    case 'shutdown':
      //shutdown();
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
