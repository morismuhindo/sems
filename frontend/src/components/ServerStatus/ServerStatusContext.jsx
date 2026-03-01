import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Create context for server status
const ServerStatusContext = createContext();

// Hook to use server status
export const useServerStatus = () => useContext(ServerStatusContext);

// Provider component to manage server status state
export const ServerStatusProvider = ({ children }) => {
  // Track if server is down
  const [isServerDown, setIsServerDown] = useState(false);
  // Track if health check is in progress
  const [isChecking, setIsChecking] = useState(false);

  // Function to check server health
  const checkServerHealth = useCallback(async () => {
    // Skip if already checking
    if (isChecking) return;
    
    // Start checking
    setIsChecking(true);
    
    try {
      // Try to call health endpoint
      await fetch('https://sems-backend-s2my.onrender.com/api/health', {
        method: 'GET',
        headers: { 
          'Accept': 'application/json' 
        },
      });
      
      // If fetch succeeds, server responded
      setIsServerDown(false);
      
    } catch (error) {
      // Check error type
      if (error.name === 'TypeError') {
        // Network error - server not reachable
        setIsServerDown(true);
      } else {
        // Other errors - server responded with error
        setIsServerDown(false);
      }
    } finally {
      // Done checking
      setIsChecking(false);
    }
  }, [isChecking]);

  // Set up periodic health checks
  useEffect(() => {
    // Initial check on mount
    checkServerHealth();
    
    // Set up interval for regular checks
    const checkInterval = setInterval(checkServerHealth, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(checkInterval);
  }, [checkServerHealth]);

  // Provide state and function to children
  return (
    <ServerStatusContext.Provider value={{ 
      isServerDown, 
      isChecking, 
      checkServerHealth 
    }}>
      {children}
    </ServerStatusContext.Provider>
  );
};
