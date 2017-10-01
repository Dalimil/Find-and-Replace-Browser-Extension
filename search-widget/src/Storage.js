
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
  }

  getFromStorage(key) {
    return new Promise(resolve => {
      chrome.storage.local.get(key, data => {
        if ((key in data) && data[key] != null && data[key] != undefined) {
          resolve(data[key]);
        } else {
          resolve({});
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
        'h': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'i': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'j': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'k': { findTextInput: 'abc', replaceTextInput: 'cdf' },
        'l': { findTextInput: 'abc', replaceTextInput: 'cdf' },
      });
      return;
    }
    this.favouritesObservers.push(func);
    // Give the observer current data straight away
    this.favouritesPromise.then(favourites => func(favourites));
  }

  hashSearchState_(searchState) {
    // Concatenate property values and stringify
    return Object.keys(searchState).sort().map(x => searchState[x].toString()).join(";");
  }

  reset() {
    chrome.storage.local.set({
      [this.favouritesKey]: {},
      [this.searchStateKey]: {}
    });
  }

}

const MyStorage = new Storage();
export default MyStorage;
