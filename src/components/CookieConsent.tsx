import React from 'react';

const CookieConsent: React.FC = () => {
  const [showConsent, setShowConsent] = React.useState(true);
  
  const acceptCookies = () => {
    // Set cookie consent in localStorage
    localStorage.setItem('cookieConsent', 'true');
    setShowConsent(false);
    
    // Enable analytics tracking
    if (typeof window !== 'undefined' && window.ReactGA) {
      window.ReactGA.initialize('G-XXXXXXXXXX', {
        gaOptions: {
          anonymizeIp: true
        }
      });
    }
  };
  
  // Check if consent was previously given
  React.useEffect(() => {
    const hasConsent = localStorage.getItem('cookieConsent') === 'true';
    if (hasConsent) {
      setShowConsent(false);
      
      // Enable analytics tracking
      if (typeof window !== 'undefined' && window.ReactGA) {
        window.ReactGA.initialize('G-XXXXXXXXXX', {
          gaOptions: {
            anonymizeIp: true
          }
        });
      }
    }
  }, []);
  
  if (!showConsent) {
    return null;
  }
  
  return (
    <div className="cookie-consent">
      <div>
        <p>
          We use cookies to improve your experience and analyze website traffic.
          By clicking "Accept", you agree to our website's cookie use as described in our Privacy Policy.
        </p>
      </div>
      <div>
        <button className="btn" onClick={acceptCookies}>
          Accept
        </button>
        <a href="/privacy" className="btn ml-2">
          Learn More
        </a>
      </div>
    </div>
  );
};

export default CookieConsent;
