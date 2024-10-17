import React from 'react';
import spinner from './infinite-spinner.svg'; // Adjust the path according to your project structure
import './spinner.css'; // Optional: Create a CSS file for styling

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <img src={spinner} alt="Loading..." />
    </div>
  );
};

export default LoadingSpinner;