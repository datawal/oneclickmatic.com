import React from 'react';
import { useWallet } from '../hooks/useWalletAndGas';

const Header: React.FC = () => {
  const { walletState, connect, switchToPolygon } = useWallet();
  
  const handleConnectClick = async () => {
    if (!walletState.isConnected) {
      await connect();
    } else if (!walletState.isPolygonNetwork) {
      await switchToPolygon();
    }
  };
  
  return (
    <header className="header">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src="/logo.svg" alt="OneClickMatic Logo" className="h-8 w-8 mr-2" />
          <h1 className="text-xl font-bold">OneClickMatic</h1>
        </div>
        
        <div className="flex items-center">
          <div className="network-status mr-4">
            {walletState.isConnected ? (
              walletState.isPolygonNetwork ? (
                <div className="flex items-center">
                  <div className="indicator connected mr-2"></div>
                  <span>Polygon Network</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="indicator disconnected mr-2"></div>
                  <span>Wrong Network</span>
                </div>
              )
            ) : (
              <div className="flex items-center">
                <div className="indicator disconnected mr-2"></div>
                <span>Not Connected</span>
              </div>
            )}
          </div>
          
          <button 
            className="btn"
            onClick={handleConnectClick}
          >
            {!walletState.isConnected 
              ? 'Connect Wallet' 
              : !walletState.isPolygonNetwork 
                ? 'Switch to Polygon' 
                : `${walletState.account?.substring(0, 6)}...${walletState.account?.substring(38)}`}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
