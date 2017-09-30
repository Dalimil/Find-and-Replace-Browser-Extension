import React from 'react';
import FontAwesome from 'react-fontawesome';

class ButtonPanel extends React.Component {
  constructor(props) {
    super(props);

    this.TABS = {
      favourites: 'favourites',
      history: 'history',
      templates: 'templates',
      help: 'help'
    };
    this.buttonNames = {
      'star': 'favourites',
      'history': 'history',
      'file-text': 'templates',
      'question-circle': 'help'
    };

    this.state = {
      expanded: false,
      activeTab: null
    };
    this.selectMenuItem = this.selectMenuItem.bind(this);
  }

  selectMenuItem(name) {
    const tab = this.buttonNames[name];
    if (this.state.expanded && this.state.activeTab == tab) {
      this.setState({
        expanded: false,
        activeTab: null
      });
      return;
    }
    this.setState({
      expanded: true,
      activeTab: tab
    });
  }

  render() {
    const renderTab = () => {
      if (!this.state.expanded) return;
      
      switch (this.state.activeTab) {
        case this.TABS.favourites:
          return (<div>Favourites - these are user-saved collections</div>);
        case this.TABS.history:
          return (<div>History</div>);
        case this.TABS.templates:
          return (<div>Templates - paste-only text - create new here</div>);
        case this.TABS.help:
          return (<div>Help/Info/Feedback</div>);
      }
      return null;
    };

    return (
      <div className="right-panel">
        <div className={"right-panel-content" + (this.state.expanded ? " active" : "") }>
          {renderTab()}
        </div>
        <div className="right-panel-buttons">
          { Object.keys(this.buttonNames).map(id => (
            <FontAwesome key={id} className="menu-item"
              name={id} fixedWidth={true} size='2x'
              title={this.buttonNames[id][0].toUpperCase() + this.buttonNames[id].slice(1)}
              onClick={() => this.selectMenuItem(id)} />
          ))}
        </div>
      </div>
    );
  }

}

export default ButtonPanel;
