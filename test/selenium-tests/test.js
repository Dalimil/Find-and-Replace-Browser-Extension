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

  it('should have the right title - the fancy generator way', function () {
    browser
      .url('https://duckduckgo.com/')
      .setValue('#search_form_input_homepage', 'WebdriverIO')
      .click('#search_button_homepage');
    var title = browser.getTitle();
    assert.equal(title, 'WebdriverIO at DuckDuckGo');
  });
});
