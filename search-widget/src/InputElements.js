// Wrappers for HTML input elements - buttons, checkboxes, etc.

import React from 'react';
import FontAwesome from 'react-fontawesome';

const Button = ({title, onClick, disabled, small, style}) => (
  <div style={style || {}}
    className={"button-standard" + (disabled ? " button-disabled":"") + (small ? " button-small":"")}
    onClick={onClick}>
    {title}
  </div>
);

const Checkbox = ({name, checked, onChange, text: descr, tooltip, error, afterContent}) => {
  const id = "checkbox-" + name;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }} title={tooltip || null}>
      <label htmlFor={id} style={{ cursor: 'pointer', order: '1' }}> {descr}</label>
      <div className={"checkbox" + (error ? " input-error" : "")}>
        <input type="checkbox" name={name} id={id} checked={checked} onChange={onChange} />
        <label htmlFor={id}></label>
      </div>
      <span className="checkbox-after-content" style={{ order: '2' }}>{ afterContent }</span>
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

const Toggle = ({ checked, onChange, style }) => {
  return (
    <label className="switch" style={style || {}}>
      <input type="checkbox"
        className="switch-input"
        checked={checked}
        onChange={onChange} />
      <span className="switch-label" data-on="On" data-off="Off"></span>
      <span className="switch-handle"></span>
    </label>
  );
};


export {
  Button,
  Checkbox,
  Star,
  Toggle
};
