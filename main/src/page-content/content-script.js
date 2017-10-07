// Injected into the currently active tab
// Runs sandboxed within the DOM context of the page

(() => {
// Needed for init-content-script.js check
window.FindAndReplaceExtension = {
  isInjected: true
};

const Search = {
  // Group marks by term (without cross-boundary matches it's just 1-to-1 mapping)
  // [{ term, $marks: jQuery{el1, el2, el3} }, ...]
  groupedMarks: [], 
  // Current highlight index - again the 'real' index (merging cross boundary occurrences)
  activeTermIndex: 0,
  // Whether last performed search used user-specified regex
  lastSearchUsedRegexp: false,
  // Save the most recent regexp used during 'find all' operation
  lastSearchRegexp: /^$/
};

/** iFrame handling - all search will only happen in a given context */
const Context = {
  doc: document,
  win: window
};

const TYPES = {
  textarea: 'textarea',
  contenteditable: 'contenteditable',
  mix: 'mix'
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

// Main function that creates connections and inits API
setUpApi();

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

  const termCount = Search.groupedMarks.length;
  if (termCount != 0) {
    index = ((index % termCount) + termCount) % termCount;
    Search.activeTermIndex = index;
    const $current = Search.groupedMarks[index].$marks.addClass(CLASSES.currentHighlight);
    scrollInViewIfNotAlready($current.eq(0));
  } else {
    Search.activeTermIndex = 0;
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

function getCurrentOccurrenceText() {
  return $(SELECTORS.currentHighlight, Context.doc).text();
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
    Utils.flattenNode(el);
  });

  // Check if this is a textarea highlight, replace the mirrored text too if so
  if ($wrapper.length != 0) {
    const textarea = $wrapper.find('textarea');
    const originalText = textarea.val();
    const replacedText = originalText.substr(0, originalOffset) + resultText +
      originalText.substr(originalOffset + originalLength);
    textarea.val(replacedText);
  }

  // Delete term mark-group from our list
  Search.groupedMarks.splice(Search.activeTermIndex, 1);
  // Set to same index because count decreased
  setOccurrenceIndex(Search.activeTermIndex);
}

function replaceAll(resultText) {
  while (Search.groupedMarks.length > 0) {
    replaceCurrent(resultText);
  }
  // Clear indexes
  setOccurrenceIndex(0);
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

function insertTemplate(templateText) {
  const selection = Context.win.getSelection();
  if (selection.rangeCount > 0) {
    const { endContainer: target, endOffset: offset } = selection.getRangeAt(0);
    // todo check if inside contenteditable or textarea
    // textarea will fail getSelection() test
    // todo: save this globally in getActiveSelectionAndContext and just use the element ref + type, here
  }
  // Return success
  return false;
}

/**
 * Returns HTML overlay elements that can be highlighted
 *  instead of the actual textareas
 */
function initTextareas($elements, refocus) {
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
  return $mirrors;
}

function highlightHtml($elements, params) {
  const groupMarks = (terms) => {
    // Group marks by term (without cross-boundary matches it's just 1-to-1 mapping)
    const markGroups = []; // [{ term, $marks: jQuery{el1, el2, el3} }, ...]
    const $marks = $(SELECTORS.regularHighlight, Context.doc);
    let termSoFar = "";
    let markStartIndex = 0;
    // todo this will fail for mix - we had previous marks
    $marks.each((ind, el) => {
      termSoFar += el.textContent;
      if (termSoFar == terms[ind]) {
        markGroups.push({
          term: termSoFar,
          $marks: $marks.slice(markStartIndex, ind + 1)
        });
        markStartIndex = ind + 1;
        termSoFar = "";
      }
    });
    console.log("Terms: ", terms, "Marks: ", $marks, "Result: ", markGroups);
    return markGroups;
  };

  return new Promise((resolve, reject) => {
    // First unmark all potential previous highlights
    // Once finished, mark new elements 
    $elements.unmark({
      done: function() {
        // For each mark we save the corresponding term (potentially longer)
        const terms = [];
        const options = {
          className: CLASSES.regularHighlight,
          acrossElements: true,
          filter: (node, term, counter) => {
            terms.push(term);
            return true;
          },
          done: () => { resolve(groupMarks(terms)); }
        };
        try {
          const regexp = Utils.constructRegExpFromSearchParams(params);
          // Save regexp for reuse, (but not 'g' mod due to lastIndex issue)
          Search.lastSearchRegexp = new RegExp(regexp.source, regexp.flags.replace("g", ""));
          Search.lastSearchUsedRegexp = params.useRegex;
          // Mark.js
          $elements.markRegExp(regexp, options);
        } catch (e) {
          reject(e);
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
      const $mirrors = initTextareas(activeSelection.$element, /* refocus */ true);
      highlightHtml($mirrors, params).then(resolve).catch(reject);
      setEditableAreaGlow(activeSelection.$element);
    } else if (activeSelection.type == TYPES.contenteditable) {
      // Contenteditable
      highlightHtml(activeSelection.$element, params).then(resolve).catch(reject);
      setEditableAreaGlow(activeSelection.$element);
    } else {
      // Both (all are inactive) - but possibly inside a selected iframe
      $mirrors = initTextareas($('textarea', Context.doc));
      $elements = $('[contenteditable]', Context.doc).add($mirrors);
      // $elements sorted in document order (jQuery add() spec)
      highlightHtml($elements, params).then(resolve).catch(reject);
      setEditableAreaGlow($('textarea, [contenteditable]', Context.doc));
    }
  });

  return highlightMatchesPromise.then((groupedMarks) => {
    const oldCount = Search.groupedMarks.length;
    Search.groupedMarks = groupedMarks;
    if (oldCount == groupedMarks.length) {
      // don't jump/reset to first occurrence if same number
      setOccurrenceIndex(Search.activeTermIndex);
    } else {
      setOccurrenceIndex(0);
    }
    return { invalidRegex: false };
  }).catch(e => {
    // Invalid regexp, or error in Mark.js
    return { invalidRegex: true };
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
        return getActiveSelectionAndContext(innerContext, activeElement.contentWindow);
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

function getReplaceText(text) {
  if (!Search.lastSearchUsedRegexp) {
    return text;
  }
  // replace regex groups
  const currentOccurrenceText = getCurrentOccurrenceText();
  const matches = Search.lastSearchRegexp.exec(currentOccurrenceText);
  if (matches && matches.length > 0) {
    // Replace starting from the largest number (replace $11 before $1)
    matches.slice().reverse().forEach((groupText, index) => {
      index = matches.length - 1 - index;
      text = text.replace(new RegExp("\\$" + index, "g"), groupText);
    });
    text = text.replace(new RegExp("\\$&", "g"), matches[0]);
  }
  return text;
}

function getCurrentMatchInfo(replaceText) {
  const currentOccurrenceText = getCurrentOccurrenceText();
  const matches = Search.lastSearchRegexp.exec(currentOccurrenceText);
  return {
    groups: (matches && matches.length > 0) ? matches : [currentOccurrenceText],
    replace: getReplaceText(replaceText)
  };
}

function getApiResponseData(actionName, replaceText) {
  return {
    reply: actionName,
    data: {
      searchState: {
        searchIndex: Search.activeTermIndex,
        searchCount: Search.groupedMarks.length,
        currentMatch: getCurrentMatchInfo(replaceText)
      }
    }
  };
}


function shutdown() {
  $('textarea', Context.doc).highlightWithinTextarea('destroy');
  $('[contenteditable]', Context.doc).unmark();
  $(SELECTORS.textareaContentMirror, Context.doc).unmark();
  clearEditableAreaGlow($('textarea, [contenteditable]', Context.doc));
}


function setUpApi() {
  let port = null;
  setUpMessageConnections();

  function setUpMessageConnections() {
    // Connect to search widget
    port = chrome.runtime.connect({
      name: "content-script-connection"
    });
    port.onMessage.addListener(handleApiCall);
  }

  // To be used inside init-content-script.js
  window.FindAndReplaceExtension.restart = () => {
    port.onMessage.removeListener(handleApiCall);
    return setUpMessageConnections();
  };

  function handleApiCall(msg) {
    if (msg.action != 'log') {
      // Debug log
      console.log("Content Script API: ", msg.action, " Data: ", msg.data);
    }
    switch (msg.action) {
      case 'shutdown':
        //shutdown();
        break;
      case 'log':
        console.log("Widget Log: ", ...msg.data);
        break;
      case 'updateSearch':
        updateSearch(msg.data).then(({ invalidRegex }) => {
          const response = {
            reply: msg.action,
            data: {
              errors: { invalidRegex }
            }
          };
          if (!invalidRegex) {
            Object.assign(response.data, getApiResponseData(msg.action, msg.data.replaceText).data);
          }
          port.postMessage(response);
        });
        break;
      case 'findNext':
        setOccurrenceIndex(Search.activeTermIndex + 1);
        port.postMessage(getApiResponseData(msg.action, msg.data.replaceText));
        break;
      case 'findPrev':
        setOccurrenceIndex(Search.activeTermIndex - 1);
        port.postMessage(getApiResponseData(msg.action, msg.data.replaceText));
        break;
      case 'replaceCurrent':
        replaceCurrent(getReplaceText(msg.data.replaceText));
        port.postMessage(getApiResponseData(msg.action, msg.data.replaceText));
        break;
      case 'replaceAll':
        replaceAll(getReplaceText(msg.data.replaceText));
        port.postMessage(getApiResponseData(msg.action, msg.data.replaceText));
        break;
      case 'insertTemplate':
        const success = insertTemplate(msg.data.text);
        port.postMessage({
          reply: msg.action,
          data: { noCursorPosition: !success }
        });
        break;
      default:
        console.warn('Invalid API Call: ', msg.action);
    }
  }
}


const Utils = {
  flattenNode(node) {
    const parent = node.parentNode;
    if (node.firstChild == null) {
      parent.removeChild(node);
    } else {
      // replace '<>text<>' with 'text'
      parent.replaceChild(node.firstChild, node); 
    }
    // merge adjacent text nodes
    parent.normalize();
  },

  escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  },

  constructRegExpFromSearchParams(params) {
    const mod = params.matchCase ? "mg" : "mgi";
    let regexQuery = params.useRegex ? params.query : Utils.escapeRegExp(params.query);
    if (params.wholeWords) {
      regexQuery = `\\b${regexQuery}\\b`;
    }
    return new RegExp(regexQuery, mod);
  }
};

})();
