import React from 'react';

import FontAwesome from 'react-fontawesome';

class HelpPanel extends React.Component {
  constructor(props) {
    super(props);

    this.baseUrl = 'https://find-and-replace-f6588.firebaseapp.com/';
  }

  render() {
    return (
      <div className="help-panel">
        <div className="help-panel-title"><FontAwesome name='question-circle' fixedWidth={true} /> Help</div>
        <img className="help-panel-icon" src='/images/icon48.png' />
        <div style={{ fontWeight: 'bold' }} >Find &amp; Replace for Text Editing</div>
        <div className="help-panel-descr">Thank you for your support!</div>
        <div className="help-panel-links">
          <a href={this.baseUrl} >Feedback</a>
          <a href={this.baseUrl} >Website</a>
          <a href={this.baseUrl} >Contribute</a>

          <a href={this.baseUrl} >Help</a>
        </div>
        <div className="help-panel-footnote">Made with <FontAwesome name='heart' /> by Dalimil</div>
      </div>
    );
  }

}

export default HelpPanel;
