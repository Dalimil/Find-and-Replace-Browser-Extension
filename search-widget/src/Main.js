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
      limitToSelectionInput: false
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleFindNext = this.handleFindNext.bind(this);
    this.handleFindPrev = this.handleFindPrev.bind(this);
    this.handleReplaceOne = this.handleReplaceOne.bind(this);
    this.handleReplaceAll = this.handleReplaceAll.bind(this);
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
    const MatchCaseCheckbox = (
      <Checkbox
        name="matchCaseInput"
        checked={this.state.matchCaseInput}
        onChange={this.handleInputChange} />
    );
    const WholeWordsCheckbox = (
      <Checkbox
        name="wholeWordsInput"
        checked={this.state.wholeWordsInput}
        onChange={this.handleInputChange} />
    );
    const UseRegexCheckbox = (
      <Checkbox
        name="useRegexInput"
        checked={this.state.useRegexInput}
        onChange={this.handleInputChange} />
    );
    const LimitToSelectionCheckbox = (
      <Checkbox
        name="limitToSelectionInput"
        checked={this.state.limitToSelectionInput}
        onChange={this.handleInputChange} />
    );

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
        { MatchCaseCheckbox } Match Case <br />
        { WholeWordsCheckbox } Whole Words <br />
        { /* Advanced Search */}
        { LimitToSelectionCheckbox } Limit to text selection <br />
        { UseRegexCheckbox } Use RegEx <br />
      </div>
    );
  }
}

export default Main;
