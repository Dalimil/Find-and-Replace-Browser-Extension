import React from 'react';

import FontAwesome from 'react-fontawesome';
import { Toggle } from '../InputElements';

import Storage from '../Storage';
import Analytics from '../Analytics';

class HelpPanel extends React.Component {
  constructor(props) {
    super(props);

    this.navigate = this.navigate.bind(this);
    this.baseUrl = 'https://find-and-replace-f6588.firebaseapp.com/';
    this.feedbackUrl = this.baseUrl + 'feedback';
    this.contributeUrl = 'https://www.paypal.me/Dalimil/5USD';
    this.helpUrl = '/help.html';
    this.privacyPolicyUrl = 'https://www.iubenda.com/privacy-policy/8243040';

    this.state = {
      analyticsEnabled: true
    };
    this.handleAnalyticsToggled = this.handleAnalyticsToggled.bind(this);
  }

  componentDidMount() {
    Storage.isAnalyticsEnabled().then(enabled => {
      this.setState({ analyticsEnabled: enabled });
    });
  }

  handleAnalyticsToggled(e) {
    const enabled = e.target.checked;
    this.setState({ analyticsEnabled: enabled });
    if (!enabled) {
      Analytics.sendEvent("analytics-switch", "analytics-disabled");
    }
    Storage.setAnalyticsEnabled(enabled);
    if (enabled) {
      Analytics.sendEvent("analytics-switch", "analytics-enabled");
    }
  }

  navigate(e) {
    e.preventDefault();
    const href = e.target.href;
    chrome.tabs.create({ url: href });
  }

  render() {
    return (
      <div className="help-panel">
        <div className="help-panel-title"><FontAwesome name='question-circle' fixedWidth={true} /> Help</div>
        <img className="help-panel-icon" src='/images/icon48.png' />
        <div style={{ fontWeight: 'bold' }} >Find &amp; Replace for Text Editing</div>
        <div className="help-panel-links">
          <a onClick={this.navigate} href={this.feedbackUrl} >Feedback</a>
          <a onClick={this.navigate} href={this.baseUrl} >Website</a>
          <a onClick={this.navigate} href={this.contributeUrl} >Contribute</a>

          <a onClick={this.navigate} href={this.helpUrl} >Help</a>
        </div>
        <div className="help-panel-footnote">
          Made with <FontAwesome name='heart-o' /> by Dalimil. Thank you for your support!
        </div>
        <div className="help-panel-footnote">
          <a onClick={this.navigate} href={this.privacyPolicyUrl}>Privacy Policy</a>
          Usage reporting:
          <Toggle
            style={{ transform: 'scale(0.75)', marginTop: '-4px', marginLeft: '-5px' }}
            checked={this.state.analyticsEnabled}
            onChange={this.handleAnalyticsToggled} />
        </div>
      </div>
    );
  }

}

export default HelpPanel;
