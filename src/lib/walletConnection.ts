/**
 * Wallet Connection Service
 * 
 * This module handles interaction with Ethereum wallets (primarily MetaMask)
 * for the OneClickMatic web application.
 */

import { ethers } from 'ethers';
import { TransactionType } from './gasOptimizer';

// Extend Window interface to include ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletConnectionConfig {
  defaultChainId: string; // Hex string of chain ID
  supportedChainIds: string[]; // Hex strings of supported chain IDs
  polygonRpcUrl: string;
  polygonChainName: string;
}

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  chainId: string | null;
  isPolygonNetwork: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
}

export interface TransactionParams {
  from: string;
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  [key: string]: any;
}

export class WalletConnection {
  private config: WalletConnectionConfig;
  private state: WalletState;
  private ethereum: any;
  private listeners: Array<(state: WalletState) => void>;

  constructor(config: Partial<WalletConnectionConfig> = {}) {
    // Default configuration
    this.config = {
      defaultChainId: '0x89', // Polygon Mainnet
      supportedChainIds: ['0x89', '0x13881'], // Polygon Mainnet and Mumbai Testnet
      polygonRpcUrl: 'https://polygon-rpc.com',
      polygonChainName: 'Polygon Mainnet',
      ...config
    };
    
    // Initial state
    this.state = {
      isConnected: false,
      account: null,
      chainId: null,
      isPolygonNetwork: false,
      provider: null,
      signer: null
    };
    
    this.ethereum = null;
    this.listeners = [];
  }

  /**
   * Initializes wallet connection and sets up listeners
   * @returns {Promise<boolean>} Connection success status
   */
  public async initialize(): Promise<boolean> {
    try {
      // Check if ethereum provider exists (MetaMask or compatible wallet)
      if (typeof window === 'undefined' || !window.ethereum) {
        console.warn('No Ethereum provider detected');
        return false;
      }
      
      this.ethereum = window.ethereum;
      
      // Create ethers provider
      const provider = new ethers.providers.Web3Provider(this.ethereum);
      this.state.provider = provider;
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Check connection status
      const accounts = await provider.listAccounts();
      this.state.account = accounts.length > 0 ? accounts[0] : null;
      this.state.isConnected = !!this.state.account;
      
      // Get current chain ID
      const network = await provider.getNetwork();
      this.state.chainId = '0x' + network.chainId.toString(16);
      
      // Check if on Polygon network
      this.state.isPolygonNetwork = this.config.supportedChainIds.includes(this.state.chainId);
      
      // Get signer if connected
      if (this.state.isConnected) {
        this.state.signer = provider.getSigner();
      }
      
      // Notify listeners
      this.notifyListeners();
      
      return this.state.isConnected;
    } catch (error) {
      console.error('Error initializing wallet connection:', error);
      return false;
    }
  }

  /**
   * Requests wallet connection if not already connected
   * @returns {Promise<string|null>} Connected account address or null
   */
  public async connect(): Promise<string | null> {
    if (!this.ethereum) {
      await this.initialize();
      if (!this.ethereum) return null;
    }
    
    try {
      // Request accounts
      const accounts = await this.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      this.state.account = accounts.length > 0 ? accounts[0] : null;
      this.state.isConnected = !!this.state.account;
      
      // Update signer
      if (this.state.isConnected && this.state.provider) {
        this.state.signer = this.state.provider.getSigner();
      }
      
      // Notify listeners
      this.notifyListeners();
      
      return this.state.account;
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      return null;
    }
  }

  /**
   * Requests switch to Polygon network
   * @returns {Promise<boolean>} Success status
   */
  public async switchToPolygonNetwork(): Promise<boolean> {
    if (!this.ethereum) return false;
    
    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.config.defaultChainId }]
      });
      
      return true;
    } catch (error: any) {
      // If the error code is 4902, the chain hasn't been added to MetaMask
      if (error.code === 4902) {
        return this.addPolygonNetwork();
      }
      
      console.error('Error switching network:', error);
      return false;
    }
  }

  /**
   * Adds Polygon network to wallet if not already added
   * @private
   */
  private async addPolygonNetwork(): Promise<boolean> {
    try {
      await this.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: this.config.defaultChainId,
          chainName: this.config.polygonChainName,
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          },
          rpcUrls: [this.config.polygonRpcUrl],
          blockExplorerUrls: ['https://polygonscan.com/']
        }]
      });
      
      return true;
    } catch (error) {
      console.error('Error adding Polygon network:', error);
      return false;
    }
  }

  /**
   * Sets up event listeners for wallet events
   * @private
   */
  private setupEventListeners(): void {
    if (!this.ethereum) return;
    
    // Account changed event
    this.ethereum.on('accountsChanged', (accounts: string[]) => {
      this.state.account = accounts.length > 0 ? accounts[0] : null;
      this.state.isConnected = !!this.state.account;
      
      // Update signer
      if (this.state.isConnected && this.state.provider) {
        this.state.signer = this.state.provider.getSigner();
      } else {
        this.state.signer = null;
      }
      
      this.notifyListeners();
    });
    
    // Chain changed event
    this.ethereum.on('chainChanged', (chainId: string) => {
      this.state.chainId = chainId;
      this.state.isPolygonNetwork = this.config.supportedChainIds.includes(chainId);
      
      // Refresh provider and signer
      if (this.ethereum) {
        this.state.provider = new ethers.providers.Web3Provider(this.ethereum);
        if (this.state.isConnected) {
          this.state.signer = this.state.provider.getSigner();
        }
      }
      
      this.notifyListeners();
    });
    
    // Disconnect event
    this.ethereum.on('disconnect', () => {
      this.state.isConnected = false;
      this.state.account = null;
      this.state.signer = null;
      this.notifyListeners();
    });
  }

  /**
   * Notifies all listeners of state changes
   * @private
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  /**
   * Adds a listener for wallet state changes
   * @param {Function} listener Function to call when state changes
   * @returns {Function} Function to remove the listener
   */
  public addStateListener(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    
    // Call listener immediately with current state
    listener({ ...this.state });
    
    // Return function to remove this listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Gets current wallet state
   * @returns {WalletState} Current wallet state
   */
  public getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Sends a transaction with optimized gas parameters
   * @param {TransactionParams} txParams Transaction parameters
   * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
   */
  public async sendTransaction(txParams: TransactionParams): Promise<ethers.providers.TransactionResponse> {
    if (!this.state.isConnected || !this.state.signer) {
      throw new Error('Wallet not connected');
    }
    
    if (!this.state.isPolygonNetwork) {
      throw new Error('Not connected to Polygon network');
    }
    
    try {
      // Convert hex strings to BigNumber where needed
      const transaction: any = {
        to: txParams.to,
        from: txParams.from
      };
      
      if (txParams.value) {
        transaction.value = ethers.BigNumber.from(txParams.value);
      }
      
      if (txParams.data) {
        transaction.data = txParams.data;
      }
      
      if (txParams.gasLimit) {
        transaction.gasLimit = ethers.BigNumber.from(txParams.gasLimit);
      }
      
      if (txParams.maxFeePerGas) {
        transaction.maxFeePerGas = ethers.BigNumber.from(txParams.maxFeePerGas);
      }
      
      if (txParams.maxPriorityFeePerGas) {
        transaction.maxPriorityFeePerGas = ethers.BigNumber.from(txParams.maxPriorityFeePerGas);
      }
      
      // Send transaction
      return await this.state.signer.sendTransaction(transaction);
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  /**
   * Optimizes transaction parameters with gas settings
   * @param {TransactionParams} txParams Original transaction parameters
   * @param {Object} gasSettings Optimized gas settings
   * @returns {TransactionParams} Modified transaction parameters
   */
  public optimizeTransaction(
    txParams: TransactionParams, 
    gasSettings: {
      maxFeePerGas: number;
      maxPriorityFeePerGas: number;
      gasLimit: number;
    }
  ): TransactionParams {
    // Create a copy of the transaction parameters
    const optimizedTx = { ...txParams };
    
    // Apply optimized gas settings
    if (gasSettings.maxFeePerGas) {
      optimizedTx.maxFeePerGas = this.toHex(gasSettings.maxFeePerGas);
    }
    
    if (gasSettings.maxPriorityFeePerGas) {
      optimizedTx.maxPriorityFeePerGas = this.toHex(gasSettings.maxPriorityFeePerGas);
    }
    
    if (gasSettings.gasLimit) {
      optimizedTx.gasLimit = this.toHex(gasSettings.gasLimit);
    }
    
    return optimizedTx;
  }

  /**
   * Converts number to hexadecimal string
   * @private
   */
  private toHex(number: number): string {
    return '0x' + Math.floor(number).toString(16);
  }

  /**
   * Gets transaction type based on parameters
   * @param {TransactionParams} txParams Transaction parameters
   * @returns {TransactionType} Transaction type
   */
  public getTransactionType(txParams: TransactionParams): TransactionType {
    // Default to contract interaction
    let type: TransactionType = 'contractInteraction';
    
    // Check if this is a simple transfer
    if (!txParams.data || txParams.data === '0x') {
      return 'transfer';
    }
    
    // Check for ERC-20 transfer (function signature: 0xa9059cbb)
    if (txParams.data.startsWith('0xa9059cbb')) {
      return 'erc20Transfer';
    }
    
    // Check for NFT transfer (ERC-721 transferFrom: 0x23b872dd)
    if (txParams.data.startsWith('0x23b872dd')) {
      return 'nftTransfer';
    }
    
    // Check for NFT minting (often contains 'mint' in the function name)
    if (txParams.data.includes('mint')) {
      return 'nftMint';
    }
    
    // Check for token swaps (common DEX function signatures)
    const swapSignatures = [
      '0x38ed1739', // swapExactTokensForTokens
      '0x8803dbee', // swapTokensForExactTokens
      '0x7ff36ab5', // swapExactETHForTokens
      '0x4a25d94a', // swapTokensForExactETH
      '0x18cbafe5', // swapExactTokensForETH
      '0xfb3bdb41', // swapETHForExactTokens
      '0x5c11d795'  // swapExactTokensForTokensSupportingFeeOnTransferTokens
    ];
    
    if (swapSignatures.some(sig => txParams.data?.startsWith(sig))) {
      return 'swap';
    }
    
    return type;
  }

  /**
   * Updates wallet connection configuration
   */
  public updateConfig(newConfig: Partial<WalletConnectionConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
}

export default WalletConnection;
