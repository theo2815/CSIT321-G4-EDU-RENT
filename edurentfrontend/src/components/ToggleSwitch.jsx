import React from 'react';
import '../static/ToggleSwitch.css';

/**
 * A custom toggle switch component.
 * 
 * @param {boolean} checked - The current state of the toggle.
 * @param {function} onChange - Callback when the toggle state changes.
 * @param {boolean} disabled - Whether the toggle is disabled.
 * @param {string} id - Optional ID for the input element.
 */
const ToggleSwitch = ({ checked, onChange, disabled, id }) => {
  return (
    <div className="checkbox-con">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

export default ToggleSwitch;
