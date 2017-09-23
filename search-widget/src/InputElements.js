// Wrappers for HTML input elements - buttons, checkboxes, etc.

import React from 'react';

const Button = ({title, onClick, disabled, small}) => (
  <div className={"button-standard" + (disabled ? " button-disabled":"") + (small ? " button-small":"")}
    onClick={onClick}>
    {title}
  </div>
);

const Checkbox = ({name, checked, onChange}) => {
  const id = "checkbox-" + name;
  return (
    <div className="checkbox">
      <input type="checkbox" name={name} id={id} onChange={onChange} />
      <label htmlFor={id}></label>
    </div>
  );
};

export {
  Button,
  Checkbox
};
