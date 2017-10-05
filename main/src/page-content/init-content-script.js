// Injected into the currently active tab
// Runs sandboxed within the DOM context of the page
// Checks if the main content scripts have been previously injected
//  and returns the boolean result
(() => {
  if (window.FindAndReplaceExtension && window.FindAndReplaceExtension.isInjected) {
    // Trigger messaging port reconnect
    window.FindAndReplaceExtension.restart();
    return true;
  }
  return false;
})();
