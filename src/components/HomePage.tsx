import React from 'react';
import { useWallet, useGas } from '../hooks/useWalletAndGas';
import { FaGasPump, FaBolt, FaCog } from 'react-icons/fa';
import SavingsIndicator from './SavingsIndicator';
import GoogleAd from './GoogleAd';
import { TransactionType } from '../lib/gasOptimizer';

const HomePage: React.FC = () => {
  const { walletState, connect, switchToPolygon } = useWallet();
  const { gasData, isLoading, error, refreshGasData, optimizeGas } = useGas();
  
  const [transactionDetails, setTransactionDetails] = React.useState({
    type: 'transfer' as TransactionType,
    gasLimit: 21000,
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 0
  });
  
  const [optimizationResult, setOptimizationResult] = React.useState<any>(null);
  const [aggressiveness, setAggressiveness] = React.useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  
  // Update optimization result when gas data or transaction details change
  React.useEffect(() => {
    if (gasData && walletState.isConnected && walletState.isPolygonNetwork) {
      const result = optimizeGas({
        ...transactionDetails,
        maxFeePerGas: gasData.estimatedPrices.standard.maxFeePerGas,
        maxPriorityFeePerGas: gasData.estimatedPrices.standard.maxPriorityFeePerGas
      });
      
      setOptimizationResult(result);
    }
  }, [gasData, transactionDetails, walletState.isConnected, walletState.isPolygonNetwork, optimizeGas]);
  
  const handleConnectClick = async () => {
    if (!walletState.isConnected) {
      await connect();
    } else if (!walletState.isPolygonNetwork) {
      await switchToPolygon();
    }
  };
  
  const handleTransactionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as TransactionType;
    let gasLimit = 21000;
    
    // Set default gas limit based on transaction type
    switch (type) {
      case 'transfer':
        gasLimit = 21000;
        break;
      case 'erc20Transfer':
        gasLimit = 65000;
        break;
      case 'swap':
        gasLimit = 200000;
        break;
      case 'nftMint':
        gasLimit = 250000;
        break;
      case 'nftTransfer':
        gasLimit = 100000;
        break;
      case 'contractInteraction':
        gasLimit = 150000;
        break;
    }
    
    setTransactionDetails({
      ...transactionDetails,
      type,
      gasLimit
    });
  };
  
  const handleAggressivenessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAggressiveness(e.target.value as 'conservative' | 'balanced' | 'aggressive');
  };
  
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Save on Polygon Gas Fees</h1>
      
      {/* Top Ad Banner */}
      <GoogleAd slot="1234567890" format="banner" className="mb-8" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaGasPump className="mr-2" /> Current Gas Prices
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-danger p-4 text-center">
                Error loading gas data. Please try again.
                <button 
                  className="btn mt-2"
                  onClick={() => refreshGasData()}
                >
                  Retry
                </button>
              </div>
            ) : gasData ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-tertiary-background p-3 rounded-md">
                    <div className="text-secondary-text text-sm">Base Fee</div>
                    <div className="text-xl font-bold">{gasData.baseFee} GWEI</div>
                  </div>
                  <div className="bg-tertiary-background p-3 rounded-md">
                    <div className="text-secondary-text text-sm">Network Load</div>
                    <div className="text-xl font-bold">
                      {gasData.networkCongestion < 0.3 ? 'Low' : 
                       gasData.networkCongestion < 0.7 ? 'Medium' : 'High'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-tertiary-background p-2 rounded-md">
                    <div className="text-secondary-text text-xs">Safe Low</div>
                    <div className="font-bold">{gasData.estimatedPrices.safeLow.maxFeePerGas}</div>
                  </div>
                  <div className="bg-tertiary-background p-2 rounded-md">
                    <div className="text-secondary-text text-xs">Standard</div>
                    <div className="font-bold">{gasData.estimatedPrices.standard.maxFeePerGas}</div>
                  </div>
                  <div className="bg-tertiary-background p-2 rounded-md">
                    <div className="text-secondary-text text-xs">Fast</div>
                    <div className="font-bold">{gasData.estimatedPrices.fast.maxFeePerGas}</div>
                  </div>
                  <div className="bg-tertiary-background p-2 rounded-md">
                    <div className="text-secondary-text text-xs">Fastest</div>
                    <div className="font-bold">{gasData.estimatedPrices.fastest.maxFeePerGas}</div>
                  </div>
                </div>
                
                <div className="text-right mt-2 text-xs text-secondary-text">
                  Last updated: {new Date(gasData.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                No gas data available. Please connect your wallet.
              </div>
            )}
          </div>
          
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaCog className="mr-2" /> Transaction Settings
            </h2>
            
            <div className="mb-4">
              <label className="block text-secondary-text mb-2">Transaction Type</label>
              <select 
                className="input"
                value={transactionDetails.type}
                onChange={handleTransactionTypeChange}
              >
                <option value="transfer">MATIC Transfer</option>
                <option value="erc20Transfer">Token Transfer</option>
                <option value="swap">Token Swap</option>
                <option value="nftMint">NFT Minting</option>
                <option value="nftTransfer">NFT Transfer</option>
                <option value="contractInteraction">Contract Interaction</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-secondary-text mb-2">Gas Limit</label>
              <input 
                type="number" 
                className="input"
                value={transactionDetails.gasLimit}
                onChange={(e) => setTransactionDetails({
                  ...transactionDetails,
                  gasLimit: parseInt(e.target.value)
                })}
                min="21000"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-secondary-text mb-2">Optimization Strategy</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="aggressiveness" 
                    value="conservative"
                    checked={aggressiveness === 'conservative'}
                    onChange={handleAggressivenessChange}
                    className="mr-2"
                  />
                  Conservative (safer, smaller savings)
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="aggressiveness" 
                    value="balanced"
                    checked={aggressiveness === 'balanced'}
                    onChange={handleAggressivenessChange}
                    className="mr-2"
                  />
                  Balanced (recommended)
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="aggressiveness" 
                    value="aggressive"
                    checked={aggressiveness === 'aggressive'}
                    onChange={handleAggressivenessChange}
                    className="mr-2"
                  />
                  Aggressive (higher savings, may be slower)
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FaBolt className="mr-2" /> Gas Optimization
            </h2>
            
            {!walletState.isConnected ? (
              <div className="text-center p-6">
                <p className="mb-4">Connect your wallet to optimize gas fees</p>
                <button className="btn" onClick={handleConnectClick}>
                  Connect Wallet
                </button>
              </div>
            ) : !walletState.isPolygonNetwork ? (
              <div className="text-center p-6">
                <p className="mb-4">Please switch to Polygon network</p>
                <button className="btn" onClick={handleConnectClick}>
                  Switch to Polygon
                </button>
              </div>
            ) : !gasData ? (
              <div className="text-center p-6">
                <p className="mb-4">Loading gas data...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div>
                {optimizationResult && (
                  <SavingsIndicator result={optimizationResult} />
                )}
                
                <button 
                  className="btn w-full mt-4"
                  disabled={!optimizationResult?.shouldOptimize}
                >
                  {optimizationResult?.shouldOptimize 
                    ? 'Optimize Gas' 
                    : 'No Significant Savings Available'}
                </button>
                
                <div className="mt-4 text-sm text-secondary-text text-center">
                  We only charge when you save money!<br />
                  Our fee: 10% of your savings
                </div>
              </div>
            )}
          </div>
          
          {/* Side Ad */}
          <GoogleAd slot="0987654321" format="rectangle" className="mb-6" />
          
          <div className="card">
            <h2 className="text-xl font-bold mb-4">How It Works</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Connect your wallet to the Polygon network</li>
              <li>Select your transaction type and settings</li>
              <li>View potential savings with our optimized gas settings</li>
              <li>Click "Optimize Gas" to apply the optimal settings</li>
              <li>Complete your transaction with lower fees!</li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* Bottom Ad Banner */}
      <GoogleAd slot="5678901234" format="leaderboard" className="mt-8" />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Why Choose OneClickMatic?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-2">Save Money</h3>
            <p>Our advanced algorithm analyzes current network conditions to find the optimal gas settings, saving you up to 30% on transaction fees.</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold mb-2">Simple to Use</h3>
            <p>No technical knowledge required. Just connect your wallet, and our one-click optimization does all the work for you.</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold mb-2">Fair Pricing</h3>
            <p>We only make money when you save money. Our fee is just 10% of what you save, with no upfront costs.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
