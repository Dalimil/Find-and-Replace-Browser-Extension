import React from 'react';
import Logger from './Logger';

class AdvancedSearchInfo extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    if (!this.props.matchInfo) {
      return null;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 'bold', margin: '5px 0' }}>RegEx Group Info</div>
        <div className="advanced-search-info-list">
          {this.props.matchInfo.groups.map((group, index) => (
            <div className="advanced-search-info-item">
              <span className="advanced-search-info-item-name">{"$"+index}</span>
              <span className="advanced-search-info-item-text code-font">{group}</span>
            </div>
          ))}
          <div className="advanced-search-info-item">
            <span className="advanced-search-info-item-name">Result</span>
            <span className="advanced-search-info-item-text code-font">{this.props.matchInfo.replace}</span>
          </div>
        </div>
      </div>
    );
  }

}

export default AdvancedSearchInfo;
