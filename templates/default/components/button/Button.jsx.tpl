import React, { useState } from 'react';

const Button = ({
  type = 'primary',
  children,
  disabled = false,
  className = '',
  showCounter = true,
}) => {
  const [clickCount, setClickCount] = useState(0);

  const baseColor = type === 'primary' ? '#4f46e5' : '#dc2626';
  const hoverColor = type === 'primary' ? '#4338ca' : '#b91c1c';

  const handleClick = () => {
    if (!disabled) {
      setClickCount((prev) => prev + 1);
    }
  };

  const variantStyle = {
    backgroundColor: baseColor,
    color: '#ffffff',
    border: 'none',
    borderRadius: '100px',
    fontSize: '1rem',
    padding: '0.625rem 1rem',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.15s ease-in-out',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      style={variantStyle}
      className={`btn btn-${type} ${className}`.trim()}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = hoverColor;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = baseColor;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <span>{children}</span>
      {showCounter && <span>{clickCount}</span>}
    </button>
  );
};

export default Button;
