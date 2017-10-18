import React from 'react';

import FontAwesome from 'react-fontawesome';
import { Toggle } from '../InputElements';

import Storage from '../Storage';

class HelpPanel extends React.Component {
  constructor(props) {
    super(props);

    this.navigate = this.navigate.bind(this);
    this.baseUrl = 'https://find-and-replace-f6588.firebaseapp.com/';
    this.feedbackUrl = this.baseUrl + 'feedback';
    this.contributeUrl = 'https://www.paypal.me/Dalimil/5USD';
    this.helpUrl = '/help.html';

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
    Storage.setAnalyticsEnabled(enabled);
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
        <div className="help-panel-footnote">Made with <FontAwesome name='heart-o' /> by Dalimil. Thank you for your support!</div>
        <div>
          Collect usage stats:
          <Toggle
            style={{ transform: 'scale(0.8)' }}
            checked={this.state.analyticsEnabled}
            onChange={this.handleAnalyticsToggled} />
        </div>
      </div>
    );
  }

}

export default HelpPanel;
