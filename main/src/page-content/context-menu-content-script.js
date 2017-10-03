// Injected into the currently active tab when context menu item is clicked

(() => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  // Create a new DOM element with a hint text
  const hintText = document.createElement('div');
  hintText.innerText = `Press ${isMac ? 'Cmd' : 'Ctrl'}+Shift+F`;
  hintText.style.cssText = `
    all: initial;
    font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
    font-size: 30px;
    font-weight: bold;
    text-shadow: 0 0 1px #fff, 0 0 1px #000;
    position: absolute;
    top: 20px;
    right: 50px;
    z-index: 9999;
    opacity: 1;
    transition: opacity 1s ease-in-out;
  `;
  document.body.appendChild(hintText);

  // Schedule fade-out and removal
  setTimeout(() => {
    hintText.style.opacity = 0;
  }, 1000);
  setTimeout(() => {
    hintText.style.display = 'none';
    hintText.remove();
  }, 2000);
})();

