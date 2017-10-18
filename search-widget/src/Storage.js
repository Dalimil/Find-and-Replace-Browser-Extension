
// Persists UI state even after the widget is destroyed
class Storage {
  constructor() {
    this.dummy = window.chrome == undefined || window.chrome.storage == undefined;
    if (this.dummy) {
      this.previousSearchStatePromise = Promise.resolve({});
      return;
    }

    this.searchStateKey = 'search-state';
    this.previousSearchStatePromise = this.getFromStorage(this.searchStateKey);
    // search-state: { searchParams }

    this.favouritesKey = 'favourites';
    this.favouritesPromise = this.getFromStorage(this.favouritesKey);
    // favourites: { hashSearchParams: searchParams }
    this.favouritesObservers = [];

    this.historyKey = 'history';
    this.historyPromise = this.getFromStorage(this.historyKey);
    this.historyMaxLength = 10;
    // history: [ searchParamsOldest, ..., searchParamsLatest ]
    this.historyObservers = [];

    this.templatesKey = 'templates';
    this.templatesPromise = this.getFromStorage(this.templatesKey);
    // templates: { templateHash: { title: "title", text: "template text" } }
    this.templatesObservers = [];

    this.clientIdKey = 'clientid';
    this.clientIdPromise = this.getFromStorage(this.clientIdKey);
    // clientid: 'string-id'

    this.analyticsEnabledKey = 'analytics-enabled';
    this.analyticsEnabledPromise = this.getFromStorage(this.analyticsEnabledKey);
    // analytics-enabled: true

    this.initialValues = {
      [this.favouritesKey]: {},
      [this.searchStateKey]: {},
      [this.historyKey]: [],
      [this.templatesKey]: {},
      [this.clientIdKey]: '',
      [this.analyticsEnabledKey]: true
    };
  }

  getFromStorage(key) {
    return new Promise(resolve => {
      chrome.storage.local.get(key, data => {
        if ((key in data) && data[key] != null && data[key] != undefined) {
          resolve(data[key]);
        } else {
          // Set to initial value
          resolve(this.initialValues[key]);
        }
      });
    });
  }

  saveSearchState(searchState) {
    if (this.dummy) return;

    chrome.storage.local.set({
      [this.searchStateKey]: searchState
    });
  }

  getClientId() {
    if (this.dummy) return Promise.resolve("_dummyClientId");

    return this.clientIdPromise = this.clientIdPromise.then(currentId => {
      if (!currentId) {
        const newClientId = this.generateUserId_();
        chrome.storage.local.set({
          [this.clientIdKey]: newClientId
        });
        // Return immediately (there's no need to wait for the actual storage sync)
        return newClientId;
      }
      return currentId;
    });
  }

  setAnalyticsEnabled(enabled) {
    if (this.dummy) return;

    this.analyticsEnabledPromise = this.analyticsEnabledPromise.then(() => {
      chrome.storage.local.set({
        [this.analyticsEnabledKey]: enabled
      });
      return enabled;
    });
  }

  isAnalyticsEnabled() {
    if (this.dummy) return Promise.resolve(false);

    return this.analyticsEnabledPromise;
  }

  addToHistory(searchState) {
    if (this.dummy) return;

    const searchHash = this.hashSearchState_(searchState);
    this.historyPromise = this.historyPromise.then(history => {
      if (history.length > 0 &&
          this.hashSearchState_(history[history.length - 1]) == searchHash) {
        // This history state is already the last saved - do nothing
        return history;
      }
      // Append to history
      history.push(searchState);
      // Drop first few items that are too old
      history = history.slice(Math.max(0, history.length - this.historyMaxLength));
      // Sync storage
      chrome.storage.local.set({
        [this.historyKey]: history
      });
      // Notify change
      this.notifyHistoryChanged_(history);
      // Keep new object in memory
      return history;
    });
  }

  /**
   * Sets the given _searchState_ as 'favourite'
   *  or deletes it (if _deleteNotAdd_ is set)
   */
  setInFavourites(searchState, deleteNotAdd) {
    if (this.dummy) return;

    const searchHash = this.hashSearchState_(searchState);
    this.favouritesPromise = this.favouritesPromise.then(favourites => {
      if (deleteNotAdd) {
        delete favourites[searchHash];
      } else {
        favourites[searchHash] = searchState;
      }
      // Sync storage
      chrome.storage.local.set({
        [this.favouritesKey]: favourites
      });
      // Notify change
      this.notifyFavouritesChanged_(favourites);

      // Keep new object in memory
      return favourites;
    });
  }

  isAddedToFavourites(searchState) {
    if (this.dummy) return Promise.resolve(false);

    const searchHash = this.hashSearchState_(searchState);
    return this.favouritesPromise.then(favourites => {
      return !!favourites[searchHash];
    });
  }

  addToTemplates(title, text) {
    if (this.dummy) return;

    const templateHash = this.hashTemplate_(title, text);
    this.templatesPromise = this.templatesPromise.then(templates => {
      templates[templateHash] = { title, text };
      // Sync storage
      chrome.storage.local.set({
        [this.templatesKey]: templates
      });
      // Notify change
      this.notifyTemplatesChanged_(templates);
      // Keep new object in memory
      return templates;
    });
  }

  removeTemplate(templateId) {
    if (this.dummy) return;

    this.templatesPromise = this.templatesPromise.then(templates => {
      delete templates[templateId];
      chrome.storage.local.set({
        [this.templatesKey]: templates
      });
      this.notifyTemplatesChanged_(templates);
      return templates;
    });
    return this.templatesPromise;
  }

  notifyHistoryChanged_(history) {
    this.historyObservers.forEach(observer => observer(history));
  }

  notifyFavouritesChanged_(favourites) {
    this.favouritesObservers.forEach(observer => observer(favourites));
  }

  notifyTemplatesChanged_(templates) {
    this.templatesObservers.forEach(observer => observer(templates));
  }

  observeOnFavouritesChanged(func) {
    if (this.dummy) {
      func({
        'a': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'b': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'c': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'd': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'e': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'f': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'g': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'h': { findTextInput: 'very long text specified as find input', replaceTextInput: 'very long replace input' },
        'i': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'j': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'k': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'l': { findTextInput: 'abc', replaceTextInput: 'cdf' }
      });
      return;
    }
    this.favouritesObservers.push(func);
    // Give the observer current data straight away
    this.favouritesPromise.then(favourites => func(favourites));
  }

  observeOnHistoryChanged(func) {
    if (this.dummy) {
      func([
        { findTextInput: 'abc', replaceTextInput: 'cdf' },
        { findTextInput: 'abcd', replaceTextInput: 'efgh' },
        { findTextInput: 'car', replaceTextInput: 'boat' }
      ]);
      return;
    }
    this.historyObservers.push(func);
    // Give the observer current data now
    this.historyPromise.then(history => func(history));
  }

  observeOnTemplatesChanged(func) {
    if (this.dummy) {
      func({
        'a': { title: 'abc', text: 'cdf' },
        'b': { title: 'signature', text: 'Dalimil Hajek' },
        'c': { title: 'abc', text: 'This is a long text specified as template ' +
            'content, mouse hover tooltip should wrap the preview of this template.' }
      });
      return;
    }
    this.templatesObservers.push(func);
    // Give the observer current data once available
    this.templatesPromise.then(templates => func(templates));
  }

  hashSearchState_(searchState) {
    // Concatenate property values and stringify
    // Prefix helps with sorting (hack)
    const prefix = (searchState.findTextInput ? searchState.findTextInput : "") + ";";
    return prefix + Object.keys(searchState).sort().map(x => searchState[x].toString()).join(";");
  }

  hashTemplate_(title, text) {
    const hashText = (s) => s.split("").reduce((a,b) => {
      a = a * 31 + b.charCodeAt(0);
      return (a & a);
    }, 0).toString();
    return hashText(title) + "_" + hashText(text);
  }

  generateUserId_() {
    // Taken from https://stackoverflow.com/a/2117523
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  reset() {
    chrome.storage.local.set(this.initialValues);
  }

}

const MyStorage = new Storage();
export default MyStorage;
