import React from 'react';
import '../static/Dropdown.css';

export default function GenericDropdown({ 
    label, 
    options = [], 
    onSelect, 
    selectedOption, /* Currently selected value to highlight */
    variant = 'default', /* 'default' or 'borderless' */
    width = 'fit-content',
    placeholder = 'Select an option',
    badgeCounts = {} /* Map of option value to count for badges */
}) {

  // Helper to determine display label
  const getLabel = (opt) => (typeof opt === 'object' ? opt.label : opt);
  const getValue = (opt) => (typeof opt === 'object' ? opt.value : opt);

  // Determine what to display in the header
  const displayLabel = selectedOption 
    ? (typeof options[0] === 'object' 
        ? options.find(o => o.value === selectedOption)?.label || selectedOption 
        : selectedOption)
    : placeholder;
  
  // If SelectedOption is passed but no label found (maybe pre-loading?), fallback to placeholder or raw value?
  // Logic: "label" prop overrides everything if passed as a fixed string (like in MessagesPage),
  // but for forms we usually pass "selectedOption" and want to derive the label.
  // In MessagesPage, we passed `label={activeFilter}` which was the string itself.
  // Let's support both: if `label` prop is explicit, use it. If not, derive from selectedOption.
  
  const finalDisplayLabel = label !== undefined ? label : displayLabel;
  
  // Get badge count for the currently selected option (for header display)
  const headerBadgeCount = badgeCounts[selectedOption] || 0;

  return (
    <div className={`select-container ${variant === 'borderless' ? 'borderless' : ''}`} style={{ width: width }}>
      <div className="selected-header">
        <span className="user-name-span">
            {finalDisplayLabel}
            {headerBadgeCount > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                marginLeft: '6px',
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#fff',
                backgroundColor: '#e74c3c',
                borderRadius: '9px'
              }}>{headerBadgeCount > 99 ? '99+' : headerBadgeCount}</span>
            )}
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
        {options.map((option, index) => {
            const optValue = getValue(option);
            const optLabel = getLabel(option);
            const isSelected = selectedOption === optValue;
            const badgeCount = badgeCounts[optValue] || 0;

            return (
                <button 
                    key={index} 
                    className={`option-item ${isSelected ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation(); 
                        onSelect(optValue);
                    }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <span>{optLabel}</span>
                    {badgeCount > 0 && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 5px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        color: '#fff',
                        backgroundColor: '#e74c3c',
                        borderRadius: '9px'
                      }}>{badgeCount > 99 ? '99+' : badgeCount}</span>
                    )}
                </button>
            );
        })}
      </div>
    </div>
  );
}
