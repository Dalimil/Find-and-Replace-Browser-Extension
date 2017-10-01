// Wrappers for HTML input elements - buttons, checkboxes, etc.

import React from 'react';
import FontAwesome from 'react-fontawesome';

const Button = ({title, onClick, disabled, small, style}) => (
  <div style={style ? style : {}}
    className={"button-standard" + (disabled ? " button-disabled":"") + (small ? " button-small":"")}
    onClick={onClick}>
    {title}
  </div>
);

const Checkbox = ({name, checked, onChange, text: descr}) => {
  const id = "checkbox-" + name;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline' }}>
      <label htmlFor={id} style={{ cursor: 'pointer', order: '1' }}> {descr}</label>
      <div className="checkbox">
        <input type="checkbox" name={name} id={id} checked={checked} onChange={onChange} />
        <label htmlFor={id}></label>
      </div>
    </div>
  );
};

const Star = ({descrBefore, descrAfter, onClick, checked}) => {
  return (
    <div className="star-wrapper">
      <span className="star-label"
        onClick={onClick}> {checked ? descrAfter : descrBefore}</span>
      <span className={"fa-stack fa-lg star-checkbox" + (checked ? " active" : "")}
          onClick={onClick} >
        <FontAwesome
          name='star'
          style={{ fontSize: '1.8em' }}
          stack="1x" />
        <FontAwesome
          name='star-o'
          stack="2x" />
      </span>
    </div>
  );
};

export {
  Button,
  Checkbox,
  Star
};
