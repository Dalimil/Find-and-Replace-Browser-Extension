import React from 'react';

import FontAwesome from 'react-fontawesome';
import Storage from '../Storage';
import ConnectionApi from '../ConnectionApi';

class HistoryPanel extends React.Component {
  constructor(props) {
    super(props);

    this.handleHistorySelected = this.handleHistorySelected.bind(this);
  }

  handleHistorySelected(historyItem) {
    this.props.onHistorySelected(historyItem);
  }

  render() {
    const noSavedHistoryMessage = <div style={{ padding: '1em' }}>
        Currently there is no search history.</div>;

    return (
      <div className="history-list">
        <div className="panel-title">History</div>
        <div>
          {this.props.history.length == 0 && noSavedHistoryMessage}
          {this.props.history.map((historyItem, index) => {
            const { findTextInput, replaceTextInput } = historyItem;
            return (
              <div className="history-list-item" key={index}
                  onClick={() => this.handleHistorySelected(historyItem)}>
                <span>
                  <span>{findTextInput}</span> <FontAwesome name='long-arrow-right' /> <span>{replaceTextInput}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

}

export default HistoryPanel;
