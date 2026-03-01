import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './ServerStatusIndicator.css';

const ServerStatusIndicator = ({ isServerDown, onRetry, isChecking }) => {
  useEffect(() => {
    let retryInterval;
    
    if (isServerDown && !isChecking) {
      retryInterval = setInterval(() => {
        onRetry();
      }, 3000);
    }
    
    return () => {
      if (retryInterval) {
        clearInterval(retryInterval);
      }
    };
  }, [isServerDown, isChecking, onRetry]);

  if (!isServerDown) return null;

  return (
    <div className="server-status-overlay">
      <div className="server-status-box">
        <div className="server-status-icon">
          <AlertTriangle size={48} />
        </div>
        <h3>Server Unavailable</h3>
        <p>We're experiencing connection issues. Please try again shortly.</p>
       
        <p className="retry-info">Auto-retrying in 3 seconds...</p>
        
        <button 
          onClick={onRetry} 
          className="server-retry-btn"
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <RefreshCw size={18} className="spin-icon" />
              Checking...
            </>
          ) : (
            'Retry'
          )}
        </button>
        
      </div>
      
    </div>
  );
};

export default ServerStatusIndicator;