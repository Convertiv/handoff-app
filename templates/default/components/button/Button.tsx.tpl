import React, { useState } from 'react';

interface ButtonProps {
  type?: 'primary' | 'secondary';
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  showCounter?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  type = 'primary',
  children,
  disabled = false,
  className = '',
  showCounter = true
}) => {
  const [clickCount, setClickCount] = useState(0);
  
  const baseColor = type === 'primary' ? '#4f46e5' : '#dc2626';
  const hoverColor = type === 'primary' ? '#4338ca' : '#b91c1c';

  const handleClick = () => {
    if (!disabled) {
      setClickCount(prev => prev + 1);
    }
  };

  const variantStyle: React.CSSProperties = {
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
    gap: '8px'
  };

  const wrapperStyle: React.CSSProperties = {
    padding: '8px 0'
  };

  const counterBadgeStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    minWidth: '24px',
    textAlign: 'center'
  };

  return (
    <div style={wrapperStyle}>
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
        {showCounter && (
          <span style={counterBadgeStyle}>
            {clickCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default Button;
