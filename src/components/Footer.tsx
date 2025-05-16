import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">OneClickMatic</h3>
            <p className="text-secondary-text">
              The simplest way to optimize your Polygon gas fees with just one click.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Links</h3>
            <ul className="space-y-2">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li><a href="https://twitter.com/oneclickmatic" target="_blank" rel="noopener noreferrer">Twitter</a></li>
              <li><a href="https://discord.gg/oneclickmatic" target="_blank" rel="noopener noreferrer">Discord</a></li>
              <li><a href="https://github.com/oneclickmatic" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="mailto:support@oneclickmatic.com">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-tertiary-background text-center text-secondary-text text-sm">
          <p>© {new Date().getFullYear()} OneClickMatic. All rights reserved.</p>
          <p className="mt-2">
            OneClickMatic is not affiliated with Polygon (MATIC) or any cryptocurrency exchange.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
