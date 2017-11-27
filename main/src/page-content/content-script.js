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
  lastSearchRegexp: /^$/,
  // Is the search limited to the (non-collapsed) user-specified text selection
  limitedToSelection: false,
  // Save { start, end, element, type, contentEditableRange } (or null) for the current cursor selection
  activeCursorSelection: null
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
  textareaContentMirror: 'hwt-highlights',
  textareaInput: 'hwt-input',
  areaGlow: 'search-and-replace-area-glow'
};
const SELECTORS = {}; // '.' + 'className'
Object.keys(CLASSES).forEach(classId => {
  SELECTORS[classId] = `.${CLASSES[classId]}`;
});

// Main function that creates connections and inits API
setUpApi();


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
    Utils.scrollInViewIfNotAlready($current.eq(0), Context.win);
  } else {
    Search.activeTermIndex = 0;
  }
}

function getCurrentOccurrenceText() {
  return $(SELECTORS.currentHighlight, Context.doc).text();
}

/**
 * Replace the mark element contents with custom text.
 * It uses the Document.execCommand('insertText') API so it can
 * only be used for contenteditable elements
 * Currently not used due to its unreliability
 */
function replaceContenteditableMarkElementWithText(element, text) {
  const range = Context.doc.createRange();
  range.selectNodeContents(element);
  const sel = Context.win.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  Context.doc.execCommand('insertText', false, text);
  sel.removeAllRanges();
  if (Search.activeCursorSelection &&
      Search.activeCursorSelection.contentEditableRange) {
    // Restore previous selection
    sel.addRange(Search.activeCursorSelection.contentEditableRange);
  }
}

/**
 * Replaces the current (highlighted) occurrence
 *    performs the replacement in the first node if matched accross elements
 */
function replaceCurrent(resultText) {
  if (Search.groupedMarks.length == 0) {
    return;
  }
  const $nodes = $(SELECTORS.currentHighlight, Context.doc)
    .removeClass(CLASSES.currentHighlight)
    .removeClass(CLASSES.regularHighlight);

  // Check if this is a textarea highlight
  const $wrapper = $nodes.eq(0).closest(SELECTORS.textareaContainer);
  if ($wrapper.length != 0) {
    $nodes.each((index, el) => {
      $(el).text(index == 0 ? resultText : "");
      Utils.flattenNode(el);
    });
    // We must replace the mirrored text too
    const $textarea = $wrapper.find(SELECTORS.textareaInput);
    const $mirror = $wrapper.find(SELECTORS.textareaContentMirror);
    $textarea.val($mirror.text());
  } else {
    // Contenteditable - we should use document.execCommand()
    $nodes.each((index, el) => {
      $(el).text(index == 0 ? resultText : "");
      Utils.flattenNode(el);
    });
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

function setEditableAreaGlow($elements) {
  $elements.addClass(CLASSES.areaGlow);
}

function clearEditableAreaGlows() {
  $(SELECTORS.areaGlow, Context.doc).removeClass(CLASSES.areaGlow);
}

/**
 * Inserts templateText at current cursor position
 * Returns success boolean value
 */
function insertTemplate(templateText) {
  if (Search.activeCursorSelection == null) {
    return false;
  }
  if (!templateText) {
    // Empty template text => nothing to do => done
    return true;
  }
  // Active cursor is in a textarea or in a contenteditable element
  if (Search.activeCursorSelection.type == TYPES.textarea) {
    // insert in textarea
    const $textarea = Search.activeCursorSelection.$element;
    const originalText = $textarea.val();
    const replacedText = originalText.substr(0, Search.activeCursorSelection.end) +
      templateText + originalText.substr(Search.activeCursorSelection.end);
    $textarea.val(replacedText);
    // Make sure mirror is updated too
    $textarea.change();
  } else { // contenteditable
    // Inserts a new text node at the end of the current selection
    const anchorNode = Context.win.getSelection().anchorNode;
    Context.doc.execCommand('insertText', false, templateText);
    if (anchorNode && anchorNode.parentElement) {
      anchorNode.parentElement.normalize();
    }
  }
  return true;
}

/**
 * Returns HTML overlay elements that can be highlighted
 *  instead of the actual textareas
 */
function initTextareas($elements, refocus) {
  const skipSetup = ($elements.length == 1 && $elements.hasClass(CLASSES.textareaInput));
  // skipSetup check is needed for single textarea re-stealing focus from popup - only Firefox issue
  if (!skipSetup) {
    // Set up containers only
    $elements.highlightWithinTextarea({
      highlight: ''
    });
    if (refocus && $elements.length == 1) {
      // only works for a single (previously focused) element
      // BUG (fixed by skipSetup check above): In Firefox this steals the focus from the pop-up!
      $elements.focus();
    }
  }
  const $containers = $elements.closest(SELECTORS.textareaContainer);
  const $mirrors = $containers.find(SELECTORS.textareaContentMirror);
  return $mirrors;
}

/**
 * Filters out marks that are outside text selection
 * It also removes <mark> highlight tags for those filtered-out
 * Assumes we have an active (uncollapsed) cursor selection
 */
function filterMarksInSelection(markGroups) {
  return markGroups.filter(({ term, $marks }) => {
    const containerTextOffset = (Search.activeCursorSelection.type == TYPES.textarea) ?
      Utils.getTextOffsetInTextareaMirror($marks.get(0)) :
      Utils.getTextOffsetInContentEditable($marks.get(0), 0);
    const termLength = $marks.text().length;
    const isIncluded = (Search.activeCursorSelection.start <= containerTextOffset &&
      containerTextOffset + termLength <= Search.activeCursorSelection.end);
    if (!isIncluded) {
      // Strip <mark> tags
      $marks.each((index, el) => {
        Utils.flattenNode(el);
      });
    }
    return isIncluded;
  });
}

function groupMarks(terms) {
  // Group marks by term (with no cross-boundary matches it's just 1-to-1 mapping)
  let markGroups = []; // [{ term, $marks: jQuery{el1, el2, el3} }, ...]
  const $marks = $(SELECTORS.regularHighlight, Context.doc);
  let termSoFar = "";
  let markStartIndex = 0;
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
  if (Search.limitedToSelection) {
    markGroups = filterMarksInSelection(markGroups);
  }
  // console.log("Terms: ", terms, "Marks: ", $marks, "Result: ", markGroups);
  return markGroups;
}

function getHighlightTagName() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('linkedin')) {
    // underline
    return 'u';
  }
  if (hostname.includes('facebook')) {
    return 'span';
  }
  return 'mark';
}

function highlightHtml($elements, params) {
  return new Promise((resolve, reject) => {
    // First unmark all potential previous highlights
    // Once finished, mark new elements 
    $elements.unmark({
      done: function() {
        // For each mark we save the corresponding term (potentially longer)
        const terms = [];
        const options = {
          element: getHighlightTagName(),
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

function highlightMatchesProcess(activeSelectionType, $activeElement, params) {
  return new Promise((resolve, reject) => {
    if (activeSelectionType == TYPES.textarea) {
      // Textarea
      const $mirror = initTextareas($activeElement, /* refocus */ true);
      highlightHtml($mirror, params).then(resolve).catch(reject);
      setEditableAreaGlow($mirror.closest(SELECTORS.textareaContainer));
    } else if (activeSelectionType == TYPES.contenteditable) {
      // Contenteditable
      highlightHtml($activeElement, params).then(resolve).catch(reject);
      setEditableAreaGlow($activeElement);
    } else {
      // Both (all are inactive) - but possibly inside a selected iframe
      $mirrors = initTextareas($('textarea', Context.doc));
      $cEditables = $('[contenteditable]', Context.doc);
      $elements = $cEditables.add($mirrors);
      // $elements sorted in document order (jQuery add() spec)
      highlightHtml($elements, params).then(resolve).catch(reject);
      setEditableAreaGlow($mirrors.closest(SELECTORS.textareaContainer));
      setEditableAreaGlow($cEditables);
    }
  });
}

function updateSearch(params) {
  const activeSelection = getActiveSelectionAndContext(document, window);
  // Update globals
  Context.doc = activeSelection.documentContext;
  Context.win = activeSelection.windowContext;
  Search.activeCursorSelection = (!activeSelection.selection ? null : {
    start: activeSelection.selection.start,
    end: activeSelection.selection.end,
    $element: activeSelection.$element,
    type: activeSelection.type,
    contentEditableRange: activeSelection.selection.range || null
  });
  const uncollapsedSelection = (activeSelection.selection && !activeSelection.selection.collapsed);
  Search.limitedToSelection = params.limitToSelection && uncollapsedSelection;
  const limitToSelectionError = params.limitToSelection && !uncollapsedSelection;
  // Debug info
  // console.log("Active element: ", activeSelection, " Document context: ", Context.doc);
  
  // Highlighting operation
  const highlightMatchesPromise =
    highlightMatchesProcess(activeSelection.type, activeSelection.$element, params);

  const noSearchTarget = ((activeSelection.type == TYPES.mix) &&
    $('textarea, [contenteditable]', Context.doc).length == 0);

  return highlightMatchesPromise.then((groupedMarks) => {
    const oldCount = Search.groupedMarks.length;
    Search.groupedMarks = groupedMarks;
    if (oldCount == groupedMarks.length) {
      // don't jump/reset to first occurrence if same number
      setOccurrenceIndex(Search.activeTermIndex);
    } else {
      setOccurrenceIndex(0);
    }
    return { invalidRegex: false, invalidSelection: limitToSelectionError, noSearchTarget };
  }).catch(e => {
    // Invalid regexp, or error in Mark.js
    return { invalidRegex: true, invalidSelection: limitToSelectionError, noSearchTarget };
  });
}

/**
 * By inspecting activeElement in the page, it (potentially) descends into the active iframe
 * It inspects whether the active element is a textarea or contenteditable (or neither)
 * It also returns active selection range (as text indexes)
 */
function getActiveSelectionAndContext(documentContext, windowContext) {
  const defaultReturn = { type: TYPES.mix, documentContext, windowContext };
  const activeElement = documentContext.activeElement;
  if (activeElement) {
    const tagName = activeElement.tagName.toLowerCase();
    if (tagName == 'textarea') {
      return {
        type: TYPES.textarea,
        $element: $(activeElement),
        selection: {
          start: activeElement.selectionStart,
          end: activeElement.selectionEnd,
          collapsed: activeElement.selectionStart == activeElement.selectionEnd
        },
        documentContext,
        windowContext
      }
    } else if (activeElement.hasAttribute('contenteditable')) {
      const range = windowContext.getSelection().getRangeAt(0).cloneRange();
      const start = Utils.getTextOffsetInContentEditable(range.startContainer, range.startOffset);
      const end = Utils.getTextOffsetInContentEditable(range.endContainer, range.endOffset);
      return {
        type: TYPES.contenteditable,
        $element: $(activeElement),
        selection: { start, end, range, collapsed: start == end },
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
        return defaultReturn;
      }
    }
  }
  // No valid active input - so select all valid inactive
  return defaultReturn;
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
  clearEditableAreaGlows();
  $('textarea', Context.doc).highlightWithinTextarea('destroy');
  $('[contenteditable]', Context.doc).unmark();
  $(SELECTORS.textareaContentMirror, Context.doc).unmark();
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

    // Firefox fix (Firefox disconnects our port, so we listen for runtime message)
    chrome.runtime.onMessage.addListener(msg => {
      if (msg.action == 'shutdown') shutdown();
    });
  }

  // To be used inside init-content-script.js
  window.FindAndReplaceExtension.restart = () => {
    port.onMessage.removeListener(handleApiCall);
    return setUpMessageConnections();
  };

  function handleApiCall(msg) {
    if (msg.action != 'log') {
      // Debug log
      // console.log("Content Script API: ", msg.action, " Data: ", msg.data);
    }
    switch (msg.action) {
      case 'shutdown':
        shutdown();
        break;
      case 'log':
        // console.log("Widget Log: ", ...msg.data);
        break;
      case 'updateSearch':
        updateSearch(msg.data).then(errors => {
          const response = {
            reply: msg.action,
            data: { errors }
          };
          if (!errors.invalidRegex) {
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
    if (!parent) {
      return;
    }
    if (node.firstChild == null) {
      parent.removeChild(node);
    } else {
      // replace '<>text<>' with 'text'
      parent.replaceChild(node.firstChild, node); 
    }
    // merge adjacent text nodes
    parent.normalize();
  },

  /**
   * Removes all JavaScript event listeners by replacing a
   * node with its duplicate
   */
  unbind(node){
    const nodeCopy = node.cloneNode(/* deep */ true);
    node.parentNode.replaceChild(nodeCopy, node);
    return nodeCopy;
  },

  getTextOffsetInParent(node) {
    let sibling = node.parentNode.firstChild;
    let textOffset = 0;
    while (sibling && sibling != node) {
      textOffset += sibling.textContent.length;
      sibling = sibling.nextSibling;
    }
    return textOffset;
  },

  getTextOffsetInContentEditable(node, offsetInNode) {
    let textOffset = offsetInNode;
    while (node && !(node.hasAttribute && node.hasAttribute('contenteditable'))) {
      textOffset += Utils.getTextOffsetInParent(node);
      node = node.parentElement;
    }
    return textOffset;
  },

  getTextOffsetInTextareaMirror(node) {
    // Equals offset in parent (the mirror is flat plain-text with <mark>s)
    return Utils.getTextOffsetInParent(node);
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
  },

  scrollInViewIfNotAlready($element, contextWindow) {
    const currentTop = $element.offset().top;
    const currentBottom = $element.offset().top + $element.outerHeight();
    const $window = $(contextWindow);
    const screenTop = $window.scrollTop();
    const screenBottom = $window.scrollTop() + $window.height();
    if ((currentTop > screenBottom) || (currentBottom < screenTop)) {
      contextWindow.scrollTo(
        0,
        Math.max(0, Math.round((currentBottom + currentTop - $window.height()) / 2))
      );
    }
  }
};

})();
