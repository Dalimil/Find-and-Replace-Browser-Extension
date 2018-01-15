// Testing suite for content-script.js
// Doesn't use any external testing framework, only custom assert functions

function assert(condition, message) {
  if (!condition) {
      message = message || "Assertion failed";
      if (typeof Error !== "undefined") {
          throw new Error(message);
      }
      throw message;
  } else {
    // console.log(".");
  }
}

function assertEqual(a, b, message) {
  assert(a == b, `${a} not equal ${b} ${message ? "- " + message : ""}`);
}

$(() => {
  if (!window.FindAndReplaceExtension || !window.FindAndReplaceExtension.exposeApiDebugMode) {
    console.error("Content script didn't initialize correctly.")
  }
  // Runtime messages don't work so add a timeout for API calls
  const apiCall = (msg) => new Promise(resolve => {
    window.FindAndReplaceExtension.exposeApiDebugMode(msg);
    setTimeout(resolve, 500);
  });

  // Run Tests with the given API mock
  runTests(apiCall).then(() => {
    document.body.innerHTML = `<h1 style="color: #4BB543">All tests passed!</h1>`;
    console.log("Done");
  });
});

// Tests
async function runTests(apiCall) {
  await apiCall({
    action: 'updateSearch',
    data: {
      query: 'ok',
      useRegex: false,
      matchCase: false,
      wholeWords: false,
      limitToSelection: false,
      includeOneLineFields: false,
      replaceText: '_'
    }
  });
  assertEqual($('.hwt-mark-highlight').length, 15);
  assertEqual($('.hwt-highlight-current').length, 1);

  await apiCall({
    action: 'updateSearch',
    data: {
      query: 'ok',
      useRegex: false,
      matchCase: false,
      wholeWords: false,
      limitToSelection: false,
      includeOneLineFields: true,
      replaceText: '_'
    }
  });
  assertEqual($('.hwt-mark-highlight').length, 20);
  assertEqual($('.hwt-highlight-current').length, 1);
  await apiCall({
    action: 'findNext',
    data: { replaceText: '#' }
  });
  await apiCall({
    action: 'findNext',
    data: { replaceText: '#' }
  });
  await apiCall({
    action: 'findNext',
    data: { replaceText: '#' }
  });
  assertEqual($('.hwt-mark-highlight').length, 20);
  assertEqual($('.hwt-highlight-current').length, 1);

  await apiCall({
    action: 'updateSearch',
    data: {
      query: 'o.',
      useRegex: false,
      matchCase: false,
      wholeWords: false,
      limitToSelection: false,
      includeOneLineFields: true,
      replaceText: '_'
    }
  });
  assertEqual($('.hwt-mark-highlight').length, 0);
  assertEqual($('.hwt-highlight-current').length, 0);

  await apiCall({
    action: 'updateSearch',
    data: {
      query: 'o.',
      useRegex: true,
      matchCase: true,
      wholeWords: false,
      limitToSelection: false,
      includeOneLineFields: false,
      replaceText: '_'
    }
  });
  await apiCall({
    action: 'findPrev',
    data: { replaceText: '#' }
  });
  assertEqual($('.hwt-mark-highlight').length, 18);
  assertEqual($('.hwt-highlight-current').length, 1);

  await apiCall({
    action: 'updateSearch',
    data: {
      query: 'o.',
      useRegex: true,
      matchCase: false,
      wholeWords: false,
      limitToSelection: false,
      includeOneLineFields: true,
      replaceText: '_'
    }
  });
  assertEqual($('.hwt-mark-highlight').length, 36);
  assertEqual($('.hwt-highlight-current').length, 1);

  await apiCall({
    action: 'replaceCurrent',
    data: { replaceText: 'REPLACED-1' }
  });
  await apiCall({
    action: 'replaceCurrent',
    data: { replaceText: 'REPLACED-2' }
  });
  assertEqual($('.hwt-mark-highlight').length, 34);
  assertEqual($('.hwt-highlight-current').length, 1);

  await apiCall({
    action: 'replaceAll',
    data: { replaceText: '_KO_' }
  });
  assertEqual($('.hwt-mark-highlight').length, 0);
  assertEqual($('.hwt-highlight-current').length, 0);

  await apiCall({
    action: 'updateSearch',
    data: {
      query: '_KO_',
      useRegex: true,
      matchCase: false,
      wholeWords: false,
      limitToSelection: false,
      includeOneLineFields: true,
      replaceText: ''
    }
  });
  assertEqual($('.hwt-mark-highlight').length, 34);
  assertEqual($('.hwt-highlight-current').length, 1);
  await apiCall({
    action: 'replaceAll',
    data: { replaceText: '.' }
  });
  assertEqual($('.hwt-mark-highlight').length, 0);
  assertEqual($('.hwt-highlight-current').length, 0);

  await apiCall({
    action: 'updateSearch',
    data: {
      query: 'and (\\w+)',
      useRegex: true,
      matchCase: false,
      wholeWords: false,
      limitToSelection: false,
      includeOneLineFields: true,
      replaceText: ''
    }
  });
  assertEqual($('.hwt-mark-highlight').length, 6);
  assertEqual($('.hwt-highlight-current').length, 1);

  await apiCall({
    action: 'replaceAll',
    data: { replaceText: '"$1-$1"' }
  });

  await apiCall({
    action: 'updateSearch',
    data: {
      query: '"_k-_k"',
      useRegex: false,
      matchCase: false,
      wholeWords: false,
      limitToSelection: false,
      includeOneLineFields: true,
      replaceText: ''
    }
  });
  await apiCall({
    action: 'findPrev',
    data: { replaceText: '#' }
  });
  await apiCall({
    action: 'findPrev',
    data: { replaceText: '#' }
  });
  await apiCall({
    action: 'replaceCurrent',
    data: { replaceText: 'DONE' }
  });
  assertEqual($('.hwt-mark-highlight').length, 3);
  assertEqual($('.hwt-highlight-current').length, 1);
  
}