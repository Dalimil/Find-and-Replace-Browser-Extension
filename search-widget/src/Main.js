import React from 'react';

import { Button, Checkbox } from './InputElements';

import ConnectionApi from './ConnectionApi';

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
      limitToSelectionInput: false,
      limitToCurrentFieldInput: false
    };

    ConnectionApi.addResponseHandler(msg => {
      ConnectionApi.log("Handle ", msg);
    });

    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);
    this.handleFindNext = this.handleFindNext.bind(this);
    this.handleFindPrev = this.handleFindPrev.bind(this);
    this.handleReplaceOne = this.handleReplaceOne.bind(this);
    this.handleReplaceAll = this.handleReplaceAll.bind(this);
    this.toggleAdvancedSearch = this.toggleAdvancedSearch.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
    this.findInputElement.focus();
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
        // Notify content script to update search
        ConnectionApi.updateSearch({
          query: this.state.findTextInput,
          regex: this.state.useRegexInput,
          matchCase: this.state.matchCaseInput,
          wholeWords: this.state.wholeWordsInput,
          limitToSelection: this.state.limitToSelectionInput,
          limitToCurrentField: this.state.limitToCurrentFieldInput
        });
      }
    });
  }

  toggleAdvancedSearch() {
    if (this.state.advancedSearchExpanded) {
      this.resetAdvancedSearchOptions();
    }
    this.setState(prevState => ({
      advancedSearchExpanded: !prevState.advancedSearchExpanded
    }));
  }

  resetAdvancedSearchOptions() {
    this.setState({
      useRegexInput: false,
      limitToSelectionInput: false,
      limitToCurrentFieldInput: false
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
        onChange={this.handleSearchInputChange} />
    );
    const ReplaceFieldInput = (
      <input type="text" placeholder="Replace with" className="text-input"
        name="replaceTextInput"
        value={this.state.replaceTextInput}
        onChange={this.handleSearchInputChange} />
    );

    // Checkboxes
    const checkboxes = {
      MatchCaseCheckbox: "matchCaseInput",
      WholeWordsCheckbox: "wholeWordsInput",
      UseRegexCheckbox: "useRegexInput",
      LimitToSelectionCheckbox: "limitToSelectionInput",
      LimitToCurrentFieldCheckbox: "limitToCurrentFieldInput"
    };
    Object.keys(checkboxes).forEach(id => {
      checkboxes[id] = (
        <Checkbox
          name={checkboxes[id]}
          checked={this.state[checkboxes[id]]}
          onChange={this.handleSearchInputChange} />
      );
    });

    // Buttons
    const args = {
      disabled: !this.state.findTextInput
    };
    const FindPrevButton = <Button onClick={this.handleFindPrev} title="<" {...args} small />;
    const FindNextButton = <Button onClick={this.handleFindNext} title=">" {...args} small />;
    const ReplaceOneButton = <Button onClick={this.handleReplaceOne} title="Replace" {...args} />;
    const ReplaceAllButton = <Button onClick={this.handleReplaceAll} title="Replace all" {...args} />;

    const SearchStatus = false ? '2 of 76' : 'No Results'; // todo
    return (
      <div>
        { FindFieldInput }{ FindPrevButton }{ FindNextButton } { SearchStatus }<br />
        { ReplaceFieldInput } { ReplaceOneButton } { ReplaceAllButton } <br /><br />
        { checkboxes.MatchCaseCheckbox } Match Case <br />
        { checkboxes.WholeWordsCheckbox } Whole Words <br />
        <div onClick={this.toggleAdvancedSearch}>▾ Advanced Search</div>
        { /* Advanced Search */}
        { this.state.advancedSearchExpanded && (
          <div>
            { checkboxes.LimitToSelectionCheckbox } Limit to text selection <br />
            { checkboxes.LimitToCurrentFieldCheckbox } Limit to current field <br />
            { checkboxes.UseRegexCheckbox } Use RegEx <br />
          </div>
        )}
        Seconds Elapsed: {this.state.secondsElapsed}<br />
      </div>
    );
  }
}

export default Main;
