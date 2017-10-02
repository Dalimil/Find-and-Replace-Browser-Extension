import React from 'react';

import FontAwesome from 'react-fontawesome';
import Storage from '../Storage';

class FavouritesPanel extends React.Component {
  constructor(props) {
    super(props);

    this.handleFavouriteRemoved = this.handleFavouriteRemoved.bind(this);
    this.handleFavouriteSelected = this.handleFavouriteSelected.bind(this);
  }

  handleFavouriteSelected(id) {
    this.props.onFavouriteSelected(this.props.favourites[id]);
  }

  handleFavouriteRemoved(id) {
    Storage.setInFavourites(this.props.favourites[id], /* delete */ true);
  }

  render() {
    const noSavedFavouritesMessage = <div style={{ padding: '1em' }}>
        Currently you have no saved items.</div>;

    return (
      <div className="favourites-list">
        <div className="panel-title">Favourites</div>
        <div>
          {Object.keys(this.props.favourites).length == 0 && noSavedFavouritesMessage}
          {Object.keys(this.props.favourites).sort().map(id => {
            const { findTextInput, replaceTextInput } = this.props.favourites[id];
            return (
              <div className="favourites-list-item" key={id}
                  onClick={() => this.handleFavouriteSelected(id)}>
                <span style={{ overflowX: 'hidden', textOverflow: 'ellipsis' }}>
                  <span>{findTextInput}</span> <FontAwesome name='long-arrow-right' /> <span>{replaceTextInput}</span>
                </span>
                <FontAwesome className="favourites-list-item-remove" name='times'
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleFavouriteRemoved(id);
                  }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

}

export default FavouritesPanel;
