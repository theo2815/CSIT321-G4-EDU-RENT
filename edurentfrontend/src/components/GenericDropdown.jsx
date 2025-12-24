import React from 'react';
import '../static/Dropdown.css';

export default function GenericDropdown({ 
    label, 
    options = [], 
    onSelect, 
    selectedOption, /* Currently selected value to highlight */
    variant = 'default', /* 'default' or 'borderless' */
    width = 'fit-content'
}) {

  return (
    <div className={`select-container ${variant === 'borderless' ? 'borderless' : ''}`} style={{ width }}>
      <div className="selected-header">
        <span className="user-name-span">
            {label}
        </span>
        
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1em"
          viewBox="0 0 512 512"
          className="arrow-icon"
        >
          <path
            d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
          ></path>
        </svg>
      </div>
      
      <div className="options-list">
        {options.map((option, index) => (
            <button 
                key={index} 
                className={`option-item ${selectedOption === option ? 'active' : ''}`}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent closing if we want to keep it open, but usually we want to close.
                    // Actually CSS hover handles open/close, so clicking is fine.
                    onSelect(option);
                }}
            >
                {option}
            </button>
        ))}
      </div>
    </div>
  );
}
