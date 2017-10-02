
// Persists UI state even after the widget is destroyed
class Storage {
  constructor() {
    this.dummy = window.chrome == undefined;
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
  }

  getFromStorage(key) {
    return new Promise(resolve => {
      chrome.storage.local.get(key, data => {
        if ((key in data) && data[key] != null && data[key] != undefined) {
          resolve(data[key]);
        } else {
          // Set to initial value
          if (key == this.historyKey) {
            resolve([]);
          } else {
            resolve({});
          }
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

  notifyHistoryChanged_(history) {
    this.historyObservers.forEach(observer => observer(history));
  }

  notifyFavouritesChanged_(favourites) {
    this.favouritesObservers.forEach(observer => observer(favourites));
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

  hashSearchState_(searchState) {
    // Concatenate property values and stringify
    // Prefix helps with sorting (hack)
    const prefix = (searchState.findTextInput ? searchState.findTextInput : "") + ";";
    return prefix + Object.keys(searchState).sort().map(x => searchState[x].toString()).join(";");
  }

  reset() {
    chrome.storage.local.set({
      [this.favouritesKey]: {},
      [this.searchStateKey]: {},
      [this.historyKey]: []
    });
  }

}

const MyStorage = new Storage();
export default MyStorage;
