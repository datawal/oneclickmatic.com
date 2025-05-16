import React from 'react';
import ReactGA from 'react-ga4';

// Google Analytics Event Tracking Component
const AnalyticsTracker: React.FC = () => {
  React.useEffect(() => {
    // Track page view on component mount
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    
    // Set up custom event tracking for wallet connections
    const trackWalletConnection = () => {
      ReactGA.event({
        category: 'Wallet',
        action: 'Connected',
      });
    };
    
    // Set up custom event tracking for gas optimizations
    const trackGasOptimization = (savingsPercent: number) => {
      ReactGA.event({
        category: 'Optimization',
        action: 'Optimized Gas',
        value: Math.round(savingsPercent),
      });
    };
    
    // Make tracking functions available globally
    if (typeof window !== 'undefined') {
      window.trackWalletConnection = trackWalletConnection;
      window.trackGasOptimization = trackGasOptimization;
    }
    
    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        delete window.trackWalletConnection;
        delete window.trackGasOptimization;
      }
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default AnalyticsTracker;
