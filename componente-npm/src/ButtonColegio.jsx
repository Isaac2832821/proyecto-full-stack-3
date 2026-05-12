import React from 'react';

const ButtonColegio = ({ onClick, children, type = 'button', variant = 'primary' }) => {
  const baseStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.3s ease',
  };

  const variants = {
    primary: {
      backgroundColor: '#1F3A5F',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#f1f5f9',
      color: '#1F3A5F',
      border: '1px solid #cbd5e1'
    }
  };

  const style = { ...baseStyle, ...variants[variant] };

  return (
    <button type={type} onClick={onClick} style={style}>
      {children}
    </button>
  );
};

export default ButtonColegio;
