import React from 'react';
import renderer from 'react-test-renderer';
import Main from '../src/Main';
import HelpPanel from '../src/panels/HelpPanel';
import TemplatesPanel from '../src/panels/TemplatesPanel';
import HistoryPanel from '../src/panels/HistoryPanel';
import FavouritesPanel from '../src/panels/FavouritesPanel';

test('HelpPanel renders correctly', () => {
  const tree = renderer.create(<HelpPanel />).toJSON();
  expect(tree).toMatchSnapshot();
});

test('TemplatesPanel renders correctly', () => {
  const tree = renderer.create(<TemplatesPanel />).toJSON();
  expect(tree).toMatchSnapshot();
});

test('HistoryPanel renders correctly', () => {
  const history = [
    { findTextInput: 'abc', replaceTextInput: 'cdf' },
    { findTextInput: 'abcd', replaceTextInput: 'efgh' },
    { findTextInput: 'car', replaceTextInput: 'boat' }
  ];
  const component = renderer.create(<HistoryPanel history={history} />);
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  tree.props.history = [];
  tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('FavouritesPanel renders correctly', () => {
  const favourites = {
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
  };
  const component = renderer.create(<FavouritesPanel favourites={favourites} />);
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  tree.props.favourites = {};
  tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Whole widget renders correctly', () => {
  const tree = renderer.create(<Main />).toJSON();
  expect(tree).toMatchSnapshot();
});