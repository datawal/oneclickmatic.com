import React from 'react';

interface GoogleAdProps {
  slot: string;
  format: 'banner' | 'rectangle' | 'leaderboard';
  className?: string;
}

const GoogleAd: React.FC<GoogleAdProps> = ({ slot, format, className = '' }) => {
  const adRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    // Load Google Ads script if not already loaded
    if (typeof window !== 'undefined' && !window.adsbygoogle) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.adClient = 'ca-pub-XXXXXXXXXXXXXXXX'; // Replace with your actual ad client ID
      document.head.appendChild(script);
    }
    
    // Initialize ad
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('Ad error:', error);
    }
  }, []);
  
  // Determine ad size based on format
  const getAdSize = () => {
    switch (format) {
      case 'banner':
        return { width: '728px', height: '90px' };
      case 'rectangle':
        return { width: '300px', height: '250px' };
      case 'leaderboard':
        return { width: '970px', height: '90px' };
      default:
        return { width: '300px', height: '250px' };
    }
  };
  
  const adSize = getAdSize();
  
  return (
    <div className={`ad-container relative ${className}`} style={adSize} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: adSize.width, height: adSize.height }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your actual ad client ID
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAd;
