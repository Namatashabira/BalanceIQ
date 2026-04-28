import React from 'react';

const Spinner = ({ size = 48, color = '#6366f1', className = '' }) => (
  <svg
    className={`animate-spin ${className}`}
    width={size}
    height={size}
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      strokeDasharray="31.415, 31.415"
      fill="none"
      opacity="0.2"
    />
    <path
      d="M45 25c0-11.046-8.954-20-20-20"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default Spinner;
