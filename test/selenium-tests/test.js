// Selenium Tests
// TODO

var assert = require('assert');
describe('Browser running Find & Replace extension', function() {
  browser.log('driver');

  it('should load user guide on extension install', function() {
    const tabIds = browser.getTabIds();
    assert.equal(tabIds.length, 2);
    browser.switchTab(tabIds[1]);
    console.log(tabIds);
    const pageTitle = browser.getText('h1*=Help');
    const pageSubtitle = browser.getText('h2*=Welcome');
    console.log(pageSubtitle);
    assert.equal(pageTitle, 'Help Text & User Guide');
    assert.equal(pageSubtitle, 'Welcome to Find & Replace');
  });
});
