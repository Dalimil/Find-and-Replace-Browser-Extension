import React from 'react';
import FontAwesome from 'react-fontawesome';

import Storage from '../Storage';
import Logger from '../Logger';
import Analytics from '../Analytics';

import FavouritesPanel from './FavouritesPanel';
import HistoryPanel from './HistoryPanel';
import TemplatesPanel from './TemplatesPanel';
import HelpPanel from './HelpPanel';

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
      'book': 'templates',
      'question-circle': 'help'
    };

    this.state = {
      expanded: false,
      activeTab: null,
      favourites: {},
      history: []
    };

    this.selectMenuItem = this.selectMenuItem.bind(this);
    this.closePanels = this.closePanels.bind(this);
    this.onFavouriteSelected = this.onFavouriteSelected.bind(this);
    this.onHistorySelected = this.onHistorySelected.bind(this);
    this.onTemplateSelected = this.onTemplateSelected.bind(this);
  }

  componentDidMount() {
    Storage.observeOnFavouritesChanged(this.onFavouritesChanged.bind(this));
    Storage.observeOnHistoryChanged(this.onHistoryChanged.bind(this));
  }

  onFavouritesChanged(favourites) {
    Logger.log("Got favs update: ", favourites);
    this.setState({ favourites });
  }

  onHistoryChanged(history) {
    const historyListLatestFirst = history.slice().reverse();
    Logger.log("Got history update: ", historyListLatestFirst);
    this.setState({ history: historyListLatestFirst });
  }

  selectMenuItem(name) {
    const tab = this.buttonNames[name];
    if (this.state.expanded && this.state.activeTab == tab) {
      this.closePanels();
      return;
    }
    const wasClosed = !this.state.expanded;
    this.setState({
      expanded: true,
      activeTab: tab
    });
    if (wasClosed) {
      this.props.onPanelOpened();
    }
    Analytics.sendPageView(tab);
  }

  closePanels() {
    this.setState({
      expanded: false,
      activeTab: null
    });
    this.props.onPanelClosed();
  }

  onFavouriteSelected(favourite) {
    this.closePanels();
    this.props.onFavouriteSelected(favourite);
  }

  onHistorySelected(historyItem) {
    this.closePanels();
    this.props.onHistorySelected(historyItem);
  }

  onTemplateSelected() {
    this.props.onTemplateSelected();
  }

  render() {
    const renderTab = () => {
      if (!this.state.expanded) return;
      
      switch (this.state.activeTab) {
        case this.TABS.favourites: return (
          <FavouritesPanel
            favourites={this.state.favourites}
            onFavouriteSelected={this.onFavouriteSelected} />
        );
        case this.TABS.history: return (
          <HistoryPanel
            history={this.state.history}
            onHistorySelected={this.onHistorySelected} />
        );
        case this.TABS.templates: return (
          <TemplatesPanel
            onTemplateSelected={this.onTemplateSelected} />
        );
        case this.TABS.help: return (
          <HelpPanel />
        );
      }
      return null;
    };

    return (
      <div className="right-panel">
        <div className={"right-panel-content" + (this.state.expanded ? " active" : "") }>
          {renderTab()}
        </div>
        <div className="right-panel-buttons" onClick={this.closePanels}>
          { Object.keys(this.buttonNames).map(id => (
            <div key={id}
                className={"menu-item" +
                  ((this.buttonNames[id] == this.state.activeTab) ? " menu-item-active":"")}
                title={this.buttonNames[id][0].toUpperCase() + this.buttonNames[id].slice(1)}
                onClick={(e) => {
                  e.stopPropagation();
                  this.selectMenuItem(id);
                }}>

              <FontAwesome name={id} fixedWidth={true} size='2x' />
            </div>
          ))}
        </div>
      </div>
    );
  }

}

export default ButtonPanel;
