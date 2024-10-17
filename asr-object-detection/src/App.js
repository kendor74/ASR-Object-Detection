import React, { useState, useEffect } from "react";
// import './App.css';
import AudioRecorder from './AudioRecorder';
import LoadingSpinner from './SpinnerLoader';


const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  return (
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <AudioRecorder /> // Your main component
      )}
    </div>
  );
};

export default App;