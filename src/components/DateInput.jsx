import React, { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Reliable Date Input Component
 * Handles date picker interactions with proper focus management and validation
 */
const DateInput = ({
  id,
  name,
  value,
  onChange,
  min,
  max,
  required = false,
  label,
  error,
  className = '',
  type = 'date', // 'date' or 'datetime-local'
  placeholder
}) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Validate date on change
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        setLocalError('Invalid date format');
        return;
      }
      
      // Check min date
      if (min) {
        const minDate = new Date(min);
        if (date < minDate) {
          setLocalError(`Date must be after ${minDate.toLocaleDateString()}`);
          return;
        }
      }
      
      // Check max date
      if (max) {
        const maxDate = new Date(max);
        if (date > maxDate) {
          setLocalError(`Date must be before ${maxDate.toLocaleDateString()}`);
          return;
        }
      }
      
      // Check if date is in the past (for deadlines)
      if (type === 'date') {
        const today = new Date(now.toDateString());
        if (date < today) {
          setLocalError('Date cannot be in the past');
          return;
        }
      } else if (type === 'datetime-local') {
        // For datetime-local, check if it's in the past
        if (date < now) {
          setLocalError('Date and time cannot be in the past');
          return;
        }
      }
      
      setLocalError(null);
    } else if (required && !isFocused) {
      setLocalError(null); // Don't show error while typing
    }
  }, [value, min, max, type, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalError(null);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (required && !value) {
      setLocalError('This field is required');
    }
  };

  const handleIconClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.showPicker?.(); // Modern browsers support showPicker()
    }
  };

  const handleInputClick = () => {
    if (inputRef.current) {
      // Ensure picker opens on click
      inputRef.current.focus();
      // Try to open picker if supported
      if (inputRef.current.showPicker) {
        try {
          inputRef.current.showPicker();
        } catch (err) {
          // showPicker() may throw if not user-initiated, that's okay
          console.debug('showPicker not available:', err);
        }
      }
    }
  };

  const displayError = error || localError;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e);
            setLocalError(null);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleInputClick}
          min={min}
          max={max}
          required={required}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 pr-12 border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500
            text-base min-h-[44px]
            ${displayError 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300'
            }
            ${className}
          `}
        />
        <button
          type="button"
          onClick={handleIconClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open date picker"
          tabIndex={-1}
        >
          <Calendar size={20} />
        </button>
      </div>
      {displayError && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
};

export default DateInput;

