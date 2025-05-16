/**
 * React hooks for wallet connection and gas optimization
 * 
 * These hooks provide React components with access to wallet connection
 * and gas optimization functionality.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import WalletConnection, { WalletState, TransactionParams } from '../lib/walletConnection';
import PolygonGasAPI from '../lib/polygonGasApi';
import GasOptimizer, { GasData, OptimizationResult, TransactionDetails } from '../lib/gasOptimizer';

// Extend Window interface to include custom properties
declare global {
  interface Window {
    trackWalletConnection?: () => void;
    trackGasOptimization?: (savingsPercent: number) => void;
    ReactGA?: any;
    adsbygoogle?: any[];
  }
}

// Create context types
interface WalletContextType {
  walletState: WalletState;
  connect: () => Promise<string | null>;
  switchToPolygon: () => Promise<boolean>;
  sendTransaction: (txParams: TransactionParams) => Promise<any>;
  optimizeTransaction: (txParams: TransactionParams, gasSettings: any) => TransactionParams;
}

interface GasContextType {
  gasData: GasData | null;
  isLoading: boolean;
  error: Error | null;
  refreshGasData: () => Promise<void>;
  optimizeGas: (transactionDetails: TransactionDetails) => OptimizationResult | null;
  updateOptimizerConfig: (config: any) => void;
}

// Create contexts
export const WalletContext = createContext<WalletContextType | undefined>(undefined);
export const GasContext = createContext<GasContextType | undefined>(undefined);

// Wallet connection hook
export function useWalletConnection() {
  const [walletConnection] = useState(() => new WalletConnection());
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    chainId: null,
    isPolygonNetwork: false,
    provider: null,
    signer: null
  });

  // Initialize wallet connection
  useEffect(() => {
    const init = async () => {
      await walletConnection.initialize();
    };
    
    init();
    
    // Set up state listener
    const removeListener = walletConnection.addStateListener((state) => {
      setWalletState(state);
    });
    
    // Clean up listener on unmount
    return () => {
      removeListener();
    };
  }, [walletConnection]);

  // Connect wallet
  const connect = useCallback(async () => {
    return await walletConnection.connect();
  }, [walletConnection]);

  // Switch to Polygon network
  const switchToPolygon = useCallback(async () => {
    return await walletConnection.switchToPolygonNetwork();
  }, [walletConnection]);

  // Send transaction
  const sendTransaction = useCallback(async (txParams: TransactionParams) => {
    return await walletConnection.sendTransaction(txParams);
  }, [walletConnection]);

  // Optimize transaction
  const optimizeTransaction = useCallback((txParams: TransactionParams, gasSettings: any) => {
    return walletConnection.optimizeTransaction(txParams, gasSettings);
  }, [walletConnection]);

  return {
    walletState,
    connect,
    switchToPolygon,
    sendTransaction,
    optimizeTransaction
  };
}

// Gas data and optimization hook
export function useGasOptimization() {
  const [gasAPI] = useState(() => new PolygonGasAPI());
  const [gasOptimizer] = useState(() => new GasOptimizer());
  const [gasData, setGasData] = useState<GasData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch gas data
  const refreshGasData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await gasAPI.fetchGasData();
      setGasData(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch gas data'));
      console.error('Error fetching gas data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gasAPI]);

  // Optimize gas
  const optimizeGas = useCallback((transactionDetails: TransactionDetails): OptimizationResult | null => {
    if (!gasData) return null;
    
    try {
      return gasOptimizer.optimizeGas(gasData, transactionDetails);
    } catch (err) {
      console.error('Error optimizing gas:', err);
      return null;
    }
  }, [gasData, gasOptimizer]);

  // Update optimizer config
  const updateOptimizerConfig = useCallback((config: any) => {
    gasOptimizer.updateConfig(config);
  }, [gasOptimizer]);

  // Initial gas data fetch
  useEffect(() => {
    refreshGasData();
    
    // Set up interval to refresh gas data
    const intervalId = setInterval(() => {
      refreshGasData();
    }, 15000); // Refresh every 15 seconds
    
    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshGasData]);

  return {
    gasData,
    isLoading,
    error,
    refreshGasData,
    optimizeGas,
    updateOptimizerConfig
  };
}

// Provider components
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const walletMethods = useWalletConnection();
  
  return (
    <WalletContext.Provider value={walletMethods}>
      {children}
    </WalletContext.Provider>
  );
}

export function GasProvider({ children }: { children: React.ReactNode }) {
  const gasMethods = useGasOptimization();
  
  return (
    <GasContext.Provider value={gasMethods}>
      {children}
    </GasContext.Provider>
  );
}

// Custom hooks to use the contexts
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function useGas() {
  const context = useContext(GasContext);
  if (context === undefined) {
    throw new Error('useGas must be used within a GasProvider');
  }
  return context;
}
