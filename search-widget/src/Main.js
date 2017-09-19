import React from 'react';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      secondsElapsed: 0, // debug
      advancedSearchExpanded: false,
      findTextInput: '',
      replaceTextInput: '',
      matchCaseInput: false,
      wholeWordsInput: false
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
    e.preventDefault();
    console.log("Find next");
  }

  handleFindPrev(e) {
    e.preventDefault();
    console.log("Find prev");
  }

  handleReplaceOne(e) {
    e.preventDefault();
    console.log("Replace one");
  }

  handleReplaceAll(e) {
    e.preventDefault();
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
      <input type="text" placeholder="Find"
        name="findTextInput"
        value={this.state.findTextInput}
        onChange={this.handleInputChange} />
    );
    const ReplaceFieldInput = (
      <input type="text" placeholder="Replace with"
        name="replaceTextInput"
        value={this.state.replaceTextInput}
        onChange={this.handleInputChange} />
    );
    // Checkboxes
    const MatchCaseCheckbox = (
      <label>
        Match Case:
        <input type="checkbox"
          name="matchCaseInput"
          checked={this.state.matchCaseInput}
          onChange={this.handleInputChange} />
      </label>
    );
    const WholeWordsCheckbox = (
      <label>
        Whole Words:
        <input type="checkbox"
          name="wholeWordsInput"
          checked={this.state.wholeWordsInput}
          onChange={this.handleInputChange} />
      </label>
    );
    
    // Buttons
    const FindPrevButton = <a href="#" onClick={this.handleFindPrev}>&lt; Prev</a>;
    const FindNextButton = <a href="#" onClick={this.handleFindNext}>Next &gt;</a>;
    const ReplaceOneButton = <a href="#" onClick={this.handleReplaceOne}>Replace</a>;
    const ReplaceAllButton = <a href="#" onClick={this.handleReplaceAll}>Replace all</a>;

    return (
      <div>
        Seconds Elapsed: {this.state.secondsElapsed}<br />
        { FindFieldInput } { FindPrevButton } { FindNextButton }<br />
        { ReplaceFieldInput } { ReplaceOneButton } { ReplaceAllButton } <br />
        { MatchCaseCheckbox }
      </div>
    );
  }
}

export default Main;
