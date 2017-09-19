import React from 'react';
import ReactDOM from 'react-dom';

const title = 'My Minimal React Webpack Babel Setup.';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Loading Search Widget.");

  ReactDOM.render(
    <div>{title}</div>,
    document.getElementById('app-root')
  );
});



