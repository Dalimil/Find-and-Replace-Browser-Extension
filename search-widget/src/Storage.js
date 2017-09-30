// Persists UI state even after the widget is destroyed

class Storage {
  constructor() {
    this.dummy = window.chrome == undefined;
    if (this.dummy) return;

    const searchStateKey = 'search-state';
    this.searchStateKey = searchStateKey;

    this.previousSearchStatePromise = new Promise(resolve => {
      chrome.storage.local.get(searchStateKey, items => {
        resolve(items[searchStateKey]);
      });
    });
  }

  saveSearchState(searchState) {
    if (this.dummy) return;

    chrome.storage.local.set({
      [this.searchStateKey]: searchState
    });
  }

}

const MyStorage = new Storage();
export default MyStorage;
