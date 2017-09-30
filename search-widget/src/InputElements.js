// Wrappers for HTML input elements - buttons, checkboxes, etc.

import React from 'react';

const Button = ({title, onClick, disabled, small}) => (
  <div className={"button-standard" + (disabled ? " button-disabled":"") + (small ? " button-small":"")}
    onClick={onClick}>
    {title}
  </div>
);

const Checkbox = ({name, checked, onChange, text: descr}) => {
  const id = "checkbox-" + name;
  return (
    <div>
      <div className="checkbox">
        <input type="checkbox" name={name} id={id} checked={checked} onChange={onChange} />
        <label htmlFor={id}></label>
      </div>
      <label htmlFor={id} style={{ cursor: 'pointer' }}> {descr}</label>
    </div>
  );
};

export {
  Button,
  Checkbox
};
