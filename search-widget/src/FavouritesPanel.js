import React from 'react';

import FontAwesome from 'react-fontawesome';
import Storage from './Storage';

class FavouritesPanel extends React.Component {
  constructor(props) {
    super(props);

    this.handleFavouriteRemoved = this.handleFavouriteRemoved.bind(this);
    this.handleFavouriteSelected = this.handleFavouriteSelected.bind(this);
  }

  handleFavouriteSelected(id) {
    // todo- callback up - fill in state and close
  }

  handleFavouriteRemoved(id) {
    Storage.setInFavourites(this.props.favourites[id], /* delete */ true);
  }

  render() {
    return (
      <div className="favourites-list">
        <div className="panel-title">Favourites</div>
        <div>
          {Object.keys(this.props.favourites).map(id => {
            const { findTextInput, replaceTextInput } = this.props.favourites[id];
            return (
              <div className="favourites-list-item" key={id}
                  onClick={() => this.handleFavouriteSelected(id)}>
                <span>
                  {findTextInput}
                  <FontAwesome name='long-arrow-right' />
                  {replaceTextInput}
                </span>
                <FontAwesome className="favourites-list-item-remove" name='times'
                  onClick={() => this.handleFavouriteRemoved(id)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

}

export default FavouritesPanel;
