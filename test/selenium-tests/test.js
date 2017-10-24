// Selenium Tests
// TODO

var assert = require('assert');
describe('webdriver.io page', function() {
  it('should have the right title - the fancy generator way', function () {
    browser
      .url('https://duckduckgo.com/')
      .setValue('#search_form_input_homepage', 'WebdriverIO')
      .click('#search_button_homepage');
    var title = browser.getTitle();
    assert.equal(title, 'WebdriverIO at DuckDuckGo');
  });
});
