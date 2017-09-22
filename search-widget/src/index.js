import React from 'react';
import ReactDOM from 'react-dom';
import Main from './Main';

// Connect to background page
const port = chrome.runtime.connect({
  name: "widget-connection"
});

document.addEventListener('DOMContentLoaded', () => {
  console.log("Loading Search Widget.");

  ReactDOM.render(
    <Main />,
    document.getElementById('app-root')
  );
});



