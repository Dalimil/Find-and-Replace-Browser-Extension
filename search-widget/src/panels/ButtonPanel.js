import React from 'react';
import FontAwesome from 'react-fontawesome';

import Storage from '../Storage';
import ConnectionApi from '../ConnectionApi';
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
      'file-text': 'templates',
      'question-circle': 'help'
    };

    this.state = {
      expanded: false,
      activeTab: null,
      favourites: {},
      history: [],
      templates: [],
      contentScript: {
        noCursorPosition: false
      }
    };

    this.selectMenuItem = this.selectMenuItem.bind(this);
    this.onFavouriteSelected = this.onFavouriteSelected.bind(this);
    this.onHistorySelected = this.onHistorySelected.bind(this);
    this.onTemplateSelected = this.onTemplateSelected.bind(this);

    ConnectionApi.addResponseHandler(msg => {
      if (msg.reply == 'insertTemplate') {
        this.setState({
          contentScript: { noCursorPosition: msg.data.noCursorPosition }
        });
      }
    });
  }

  componentDidMount() {
    Storage.observeOnFavouritesChanged(this.onFavouritesChanged.bind(this));
    Storage.observeOnHistoryChanged(this.onHistoryChanged.bind(this));
    Storage.observeOnTemplatesChanged(this.onTemplatesChanged.bind(this));
  }

  onFavouritesChanged(favourites) {
    ConnectionApi.log("Got favs update: ", favourites);
    this.setState({ favourites });
  }

  onHistoryChanged(history) {
    const historyListLatestFirst = history.slice().reverse();
    ConnectionApi.log("Got history update: ", historyListLatestFirst);
    this.setState({ history: historyListLatestFirst });
  }

  onTemplatesChanged(templates) {
    // Sort templates by title (and keep their id)
    const templateList = Object.keys(templates).map(templateId => {
      return Object.assign({}, templates[templateId], { id: templateId });
    }).sort((a, b) => {
      const titleA = a.title.toUpperCase();
      const titleB = b.title.toUpperCase();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });
    ConnectionApi.log("Got templates update: ", templates, templateList);
    this.setState({ templates: templateList });
  }

  selectMenuItem(name) {
    const tab = this.buttonNames[name];
    if (this.state.expanded && this.state.activeTab == tab) {
      this.closePanels();
      return;
    }
    this.setState({
      expanded: true,
      activeTab: tab
    });
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

  onTemplateSelected(templateText) {
    // this.closePanels();
    ConnectionApi.log(`Pasting template: "${templateText}"`);
    ConnectionApi.insertTemplate({
      text: templateText
    });
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
            templatesDisabled={this.state.contentScript.noCursorPosition}
            templates={this.state.templates}
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
