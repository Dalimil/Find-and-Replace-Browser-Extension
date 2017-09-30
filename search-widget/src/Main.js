import React from 'react';
import FontAwesome from 'react-fontawesome';

import { Button, Checkbox } from './InputElements';
import ButtonPanel from './ButtonPanel';

import ConnectionApi from './ConnectionApi';
import Storage from './Storage';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      secondsElapsed: 0, // debug
      advancedSearchExpanded: false,
      findTextInput: '',
      replaceTextInput: '',
      matchCaseInput: false,
      wholeWordsInput: false,
      useRegexInput: false,
      limitToSelectionInput: false
    };

    ConnectionApi.addResponseHandler(msg => {
      ConnectionApi.log("Handle ", msg);
    });

    Storage.previousSearchStatePromise.then(prevSearchState => {
      // setState possibly merges empty {} object
      this.setState(prevSearchState, () => {
        if (prevSearchState.findTextInput) {
          this.findInputElement.select(); // select text at the start
        }
        this.sendSeachUpdate();
      }); 
    });

    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    this.handleFindNext = this.handleFindNext.bind(this);
    this.handleFindPrev = this.handleFindPrev.bind(this);
    this.handleReplaceOne = this.handleReplaceOne.bind(this);
    this.handleReplaceAll = this.handleReplaceAll.bind(this);
    this.toggleAdvancedSearch = this.toggleAdvancedSearch.bind(this);
    this.handleFindInputKeyboardPress = this.handleFindInputKeyboardPress.bind(this);
    this.handleReplaceInputKeyboardPress = this.handleReplaceInputKeyboardPress.bind(this);
    this.handleReplaceInputTabKey = this.handleReplaceInputTabKey.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
    this.findInputElement.select();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
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
      Storage.saveSearchState(this.state);
    });
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
      regex: this.state.useRegexInput,
      matchCase: this.state.matchCaseInput,
      wholeWords: this.state.wholeWordsInput,
      limitToSelection: this.state.limitToSelectionInput
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

  handleFindNext(e) {
    ConnectionApi.findNext();
  }

  handleFindPrev(e) {
    ConnectionApi.findPrev();
  }

  handleReplaceOne(e) { 
    ConnectionApi.replaceCurrent({
      text: this.getReplaceText() 
    });
  }

  handleReplaceAll(e) { 
    ConnectionApi.replaceAll({
      text: this.getReplaceText() 
    });
  }

  getReplaceText() {
    if (this.useRegexInput) {
      // substitute groups first
    }
    return this.replaceTextInput;
  }

  tick() {
    this.setState((prevState) => ({
      secondsElapsed: prevState.secondsElapsed + 1
    }));
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

    const SearchStatus = <div style={{ marginLeft: '0.5em' }}>{true ? '231 of 768' : 'No Results'}</div>; // todo
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
                  <div>full ...</div>
                  <div>$0 ...</div>
                  <div>$1 ...</div>
                  Seconds Elapsed: {this.state.secondsElapsed}<br />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
              <Checkbox name="advancedSearchInput"
                checked={this.state.advancedSearchExpanded}
                onChange={this.toggleAdvancedSearch} 
                text="Advanced Options" />
              <div><FontAwesome name='star-o' fixedWidth={true} size="lg" /> Save to Favourites</div>
            </div>
          </div>
        </div>

        <ButtonPanel />
      </div>
    );
  }
}

export default Main;
