import React from 'react';

import { Button, Checkbox } from './InputElements';
  
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

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleFindNext = this.handleFindNext.bind(this);
    this.handleFindPrev = this.handleFindPrev.bind(this);
    this.handleReplaceOne = this.handleReplaceOne.bind(this);
    this.handleReplaceAll = this.handleReplaceAll.bind(this);
    this.toggleAdvancedSearch = this.toggleAdvancedSearch.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }
  
  handleInputChange(e) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
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
    console.log("Find next");
  }

  handleFindPrev(e) {
    console.log("Find prev");
  }

  handleReplaceOne(e) { 
    console.log("Replace one");
  }

  handleReplaceAll(e) { 
    console.log("Replace all");
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
        name="findTextInput"
        value={this.state.findTextInput}
        onChange={this.handleInputChange} />
    );
    const ReplaceFieldInput = (
      <input type="text" placeholder="Replace with" className="text-input"
        name="replaceTextInput"
        value={this.state.replaceTextInput}
        onChange={this.handleInputChange} />
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
          onChange={this.handleInputChange} />
      );
    });

    // Buttons
    const args = {
      disabled: !this.state.findTextInput
    };
    const FindPrevButton = <Button onClick={this.handleFindPrev} title="< Prev" {...args} />;
    const FindNextButton = <Button onClick={this.handleFindNext} title="Next >" {...args} />;
    const ReplaceOneButton = <Button onClick={this.handleReplaceOne} title="Replace" {...args} />;
    const ReplaceAllButton = <Button onClick={this.handleReplaceAll} title="Replace all" {...args} />;

    return (
      <div>
        Seconds Elapsed: {this.state.secondsElapsed}<br />
        { FindFieldInput } { FindPrevButton } { FindNextButton }<br />
        { ReplaceFieldInput } { ReplaceOneButton } { ReplaceAllButton } <br />
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
      </div>
    );
  }
}

export default Main;
