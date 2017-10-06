import React from 'react';
import FontAwesome from 'react-fontawesome';

import { Button, Checkbox, Star } from './InputElements';
import ButtonPanel from './panels/ButtonPanel';

import ConnectionApi from './ConnectionApi';
import Storage from './Storage';

class Main extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      advancedSearchExpanded: false,
      findTextInput: '',
      replaceTextInput: '',
      matchCaseInput: false,
      wholeWordsInput: false,
      useRegexInput: false,
      limitToSelectionInput: false,
      addedToFavourites: false,
      contentScriptSearch: {
        searchIndex: 0,
        searchCount: 0,
        currentMatch: null
      },
      contentScriptError: {
        invalidRegex: false,
        invalidSelection: false
      }
    };

    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    this.handleFindNext = this.handleFindNext.bind(this);
    this.handleFindPrev = this.handleFindPrev.bind(this);
    this.handleReplaceOne = this.handleReplaceOne.bind(this);
    this.handleReplaceAll = this.handleReplaceAll.bind(this);
    this.toggleAdvancedSearch = this.toggleAdvancedSearch.bind(this);
    this.handleFindInputKeyboardPress = this.handleFindInputKeyboardPress.bind(this);
    this.handleReplaceInputKeyboardPress = this.handleReplaceInputKeyboardPress.bind(this);
    this.handleReplaceInputTabKey = this.handleReplaceInputTabKey.bind(this);
    this.toggleAddToFavourites = this.toggleAddToFavourites.bind(this);
    this.onButtonsPanelClosed = this.onButtonsPanelClosed.bind(this);
    this.onFavouriteSelectedInPanel = this.onFavouriteSelectedInPanel.bind(this);
    this.onHistorySelecedInPanel = this.onHistorySelecedInPanel.bind(this);
    this.handleContentScriptApiResponse = this.handleContentScriptApiResponse.bind(this);

    // Register content-script response listener
    ConnectionApi.addResponseHandler(this.handleContentScriptApiResponse);
  }

  componentDidMount() {
    this.findInputElement.select();

    Storage.previousSearchStatePromise.then(prevSearchState => {
      // Sometimes empty {} object - that's OK
      this.updateStateFromSaved(prevSearchState);
    });
  }

  updateStateFromSaved(savedPartialState) {
    this.setState(savedPartialState, () => {
      if (savedPartialState.findTextInput) {
        this.findInputElement.select(); // select text at the start
      }
      this.sendSeachUpdate();
      this.checkIfStateInFavourites();
    });
  }

  handleSearchInputChange(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    }, () => {
      if (name != 'replaceTextInput') {
       this.sendSeachUpdate();
      }
      // Save the full state (async low priority)
      Storage.saveSearchState(this.getSearchStateForStorage());
      this.checkIfStateInFavourites();
    });
  }

  checkIfStateInFavourites() {
    // Check if the new state is in favourites and update state accordingly
    Storage.isAddedToFavourites(this.getSearchStateForFavourites()).then(isAdded => {
      this.setState({ addedToFavourites: isAdded });
    });
  }

  handleContentScriptApiResponse(msg) {
    ConnectionApi.log("Widget Handling ", msg.reply, " Data: ", msg.data);
    switch (msg.reply) {
      case 'updateSearch':
        const stateUpdateObject = {
          contentScriptError: {
            invalidRegex: msg.data.errors.invalidRegex,
            invalidSelection: msg.data.errors.invalidSelection
          }
        };
        if (msg.data.searchState) {
          stateUpdateObject.contentScriptSearch = msg.data.searchState;
        }
        this.setState(stateUpdateObject);
        break;
      case 'findNext':
      case 'findPrev':
      case 'replaceCurrent':
      case 'replaceAll':
        this.setState({
          contentScriptSearch: msg.data.searchState
        });
        break;
    }
  }

  onFavouriteSelectedInPanel(favourite) {
    this.updateStateFromSaved(favourite);
  }

  onHistorySelecedInPanel(history) {
    this.updateStateFromSaved(history);
  }

  onButtonsPanelClosed() {
    // Maybe previously removed from favourites list
    this.checkIfStateInFavourites();
  }

  handleFindInputKeyboardPress(e) {
    if (e.key == 'Enter') {
      if (e.shiftKey) {
        this.handleFindPrev();
      } else {
        this.handleFindNext();
      }
    }
  }

  handleReplaceInputKeyboardPress(e) {
    if (e.key == 'Enter') {
      if (e.shiftKey) {
        this.handleReplaceAll();
      } else {
        this.handleReplaceOne();
      }
    }
  }

  handleReplaceInputTabKey(e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      this.findInputElement.select();
    }
  }

  sendSeachUpdate() {
    // Notify content script to update search
    ConnectionApi.updateSearch({
      query: this.state.findTextInput,
      useRegex: this.state.useRegexInput,
      matchCase: this.state.matchCaseInput,
      wholeWords: this.state.wholeWordsInput,
      limitToSelection: this.state.limitToSelectionInput,
      replaceText: this.state.replaceTextInput
    });
  }

  toggleAdvancedSearch(e) {
    const expanded = e.target.checked;
    if (!expanded) {
      this.resetAdvancedSearchOptions();
    }
    this.setState({
      advancedSearchExpanded: expanded
    });
  }

  resetAdvancedSearchOptions() {
    this.setState({
      useRegexInput: false,
      limitToSelectionInput: false
    });
  }

  toggleAddToFavourites() {
    const alreadyAdded = this.state.addedToFavourites;
    Storage.setInFavourites(this.getSearchStateForFavourites(), /* delete? */ alreadyAdded);
    this.setState({
      addedToFavourites: !alreadyAdded
    });
  }

  getSearchStateForHistory() {
    const { findTextInput, replaceTextInput } = this.state;
    return {
      findTextInput,
      replaceTextInput
    };
  }

  getSearchStateForFavourites() {
    return this.getSearchStateForStorage();
  }

  getSearchStateForStorage() {
    return {
      advancedSearchExpanded: this.state.advancedSearchExpanded,
      findTextInput: this.state.findTextInput,
      replaceTextInput: this.state.replaceTextInput,
      matchCaseInput: this.state.matchCaseInput,
      wholeWordsInput: this.state.wholeWordsInput,
      useRegexInput: this.state.useRegexInput,
      limitToSelectionInput: this.state.limitToSelectionInput
    };
  }

  handleFindNext(e) {
    ConnectionApi.findNext({
      replaceText: this.state.replaceTextInput
    });
  }

  handleFindPrev(e) {
    ConnectionApi.findPrev({
      replaceText: this.state.replaceTextInput
    });
  }

  handleReplaceOne(e) {
    ConnectionApi.replaceCurrent({
      replaceText: this.state.replaceTextInput
    });
    Storage.addToHistory(this.getSearchStateForHistory());
  }

  handleReplaceAll(e) { 
    ConnectionApi.replaceAll({
      replaceText: this.state.replaceTextInput
    });
    Storage.addToHistory(this.getSearchStateForHistory());
  }

  render() {
    // Text inputs
    const FindFieldInput = (
      <input type="text" placeholder="Find" className="text-input"
        ref={input => { this.findInputElement = input; }}
        name="findTextInput"
        value={this.state.findTextInput}
        onChange={this.handleSearchInputChange}
        onKeyUp={this.handleFindInputKeyboardPress} />
    );
    const ReplaceFieldInput = (
      <input type="text" placeholder="Replace with" className="text-input"
        name="replaceTextInput"
        value={this.state.replaceTextInput}
        onChange={this.handleSearchInputChange}
        onKeyUp={this.handleReplaceInputKeyboardPress}
        onKeyDown={this.handleReplaceInputTabKey} />
    );

    // Checkboxes
    const checkboxes = {
      MatchCaseCheckbox: { id: "matchCaseInput", text: "Match Case" },
      WholeWordsCheckbox: { id: "wholeWordsInput", text: "Whole Words" },
      UseRegexCheckbox: { id: "useRegexInput", text: "Use RegEx" },
      LimitToSelectionCheckbox: { id: "limitToSelectionInput", text: "In Text Selection" }
    };
    Object.keys(checkboxes).forEach(id => {
      checkboxes[id] = (
        <Checkbox
          name={checkboxes[id].id}
          checked={this.state[checkboxes[id].id]}
          onChange={this.handleSearchInputChange} 
          text={checkboxes[id].text} />
      );
    });

    // Buttons
    const args = {
      disabled: !this.state.findTextInput
    };
    const FindPrevButton = <Button onClick={this.handleFindPrev} title={<FontAwesome name='chevron-up' />} {...args} small />;
    const FindNextButton = <Button onClick={this.handleFindNext} title={<FontAwesome name='chevron-down' />} {...args} small />;
    const ReplaceOneButton = <Button onClick={this.handleReplaceOne} title="Replace" {...args} />;
    const ReplaceAllButton = <Button onClick={this.handleReplaceAll} title="Replace all" {...args} style={{ marginLeft: '0.5em'}} />;

    const occurrenceCount = this.state.contentScriptSearch.searchCount;
    const SearchStatus = (
      <div className="search-status-text">{(occurrenceCount == 0 ?
          'No Results' :
          `${this.state.contentScriptSearch.searchIndex + 1} of ${occurrenceCount}`)}</div>
    );

    return (
      <div style={{
        display: 'flex'
      }}>
        <div className="main-panel">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            { FindFieldInput }{ FindPrevButton }{ FindNextButton } { SearchStatus }
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            { ReplaceFieldInput }{ ReplaceOneButton } { ReplaceAllButton }
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
              { checkboxes.MatchCaseCheckbox }
              { checkboxes.WholeWordsCheckbox }
              { /* Advanced Search */}
              { this.state.advancedSearchExpanded && checkboxes.LimitToSelectionCheckbox }
              { this.state.advancedSearchExpanded && checkboxes.UseRegexCheckbox } 
              { /* TODO - BUT NOT MVP */ false && this.state.advancedSearchExpanded && this.state.useRegexInput && (
                <div>
                  <div style={{ fontSize: "1.2em" }}>RegEx Groups</div>
                  <div>Replace with</div>
                  <div>Found - full: ...</div>
                  <div>$0 ...</div>
                  <div>$1 ...</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
              <Checkbox name="advancedSearchInput"
                checked={this.state.advancedSearchExpanded}
                onChange={this.toggleAdvancedSearch} 
                text="Advanced Options" />
              <Star checked={this.state.addedToFavourites}
                onClick={this.toggleAddToFavourites}
                descrBefore="Save to Favourites" descrAfter="Saved" />
            </div>
          </div>
        </div>

        <ButtonPanel
          onPanelClosed={this.onButtonsPanelClosed}
          onFavouriteSelected={this.onFavouriteSelectedInPanel}
          onHistorySelected={this.onHistorySelecedInPanel} />
      </div>
    );
  }
}

export default Main;
