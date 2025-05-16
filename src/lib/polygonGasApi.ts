/**
 * Polygon Gas API Service
 * 
 * This module handles communication with Polygon gas price APIs and provides
 * real-time gas data for the optimizer.
 */

import { GasData } from './gasOptimizer';

export interface PolygonGasAPIConfig {
  primaryApiUrl: string;
  fallbackApiUrl: string;
  polygonscanApiKey?: string;
  refreshInterval: number;
  maxRetries: number;
}

export class PolygonGasAPI {
  private config: PolygonGasAPIConfig;
  private lastFetchedData: GasData | null;
  private lastFetchTime: number;
  private fetchPromise: Promise<GasData> | null;
  private retryCount: number;

  constructor(config: Partial<PolygonGasAPIConfig> = {}) {
    // Default configuration
    this.config = {
      primaryApiUrl: 'https://gasstation-mainnet.matic.network/v2',
      fallbackApiUrl: 'https://api.polygonscan.com/api?module=gastracker&action=gasoracle',
      polygonscanApiKey: '', // Optional API key for Polygonscan
      refreshInterval: 15000, // 15 seconds
      maxRetries: 3,
      ...config
    };
    
    this.lastFetchedData = null;
    this.lastFetchTime = 0;
    this.fetchPromise = null;
    this.retryCount = 0;
  }

  /**
   * Fetches current gas data from Polygon network
   * @returns {Promise<GasData>} Gas data including base fee and priority fee range
   */
  public async fetchGasData(): Promise<GasData> {
    // Check if we have recently fetched data (within refresh interval)
    const now = Date.now();
    if (
      this.lastFetchedData && 
      (now - this.lastFetchTime < this.config.refreshInterval) &&
      !this.fetchPromise
    ) {
      return this.lastFetchedData;
    }
    
    // If a fetch is already in progress, wait for it
    if (this.fetchPromise) {
      return this.fetchPromise;
    }
    
    // Start a new fetch
    this.fetchPromise = this.fetchFromPrimaryApi()
      .catch(error => {
        console.error('Error fetching from primary API:', error);
        // Increment retry count
        this.retryCount++;
        
        // If we've exceeded max retries, try fallback API
        if (this.retryCount > this.config.maxRetries) {
          this.retryCount = 0;
          return this.fetchFromFallbackApi();
        }
        
        // Otherwise, retry primary API
        return this.fetchFromPrimaryApi();
      })
      .finally(() => {
        this.fetchPromise = null;
      });
    
    const gasData = await this.fetchPromise;
    this.lastFetchedData = gasData;
    this.lastFetchTime = now;
    return gasData;
  }

  /**
   * Fetches gas data from primary API (Polygon Gas Station)
   * @private
   */
  private async fetchFromPrimaryApi(): Promise<GasData> {
    try {
      const response = await fetch(this.config.primaryApiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process and normalize the data
      return this.normalizeGasStationData(data);
    } catch (error) {
      console.error('Error in primary API fetch:', error);
      throw error;
    }
  }

  /**
   * Fetches gas data from fallback API (Polygonscan)
   * @private
   */
  private async fetchFromFallbackApi(): Promise<GasData> {
    try {
      let url = this.config.fallbackApiUrl;
      if (this.config.polygonscanApiKey) {
        url += `&apikey=${this.config.polygonscanApiKey}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process and normalize the data
      return this.normalizePolygonscanData(data);
    } catch (error) {
      console.error('Error in fallback API fetch:', error);
      throw error;
    }
  }

  /**
   * Normalizes data from Polygon Gas Station API
   * @private
   */
  private normalizeGasStationData(data: any): GasData {
    // Extract relevant fields from Gas Station API response
    const baseFee = parseInt(data.standard.maxFee) - parseInt(data.standard.maxPriorityFee);
    
    // Collect priority fees from different speed levels
    const priorityFeeRange = [
      parseInt(data.safeLow.maxPriorityFee),
      parseInt(data.standard.maxPriorityFee),
      parseInt(data.fast.maxPriorityFee),
      parseInt(data.fastest.maxPriorityFee)
    ];
    
    // Calculate network congestion (0-1 scale)
    // Higher values indicate more congestion
    const maxBaseFee = 100; // Assuming 100 GWEI as a high base fee
    const networkCongestion = Math.min(1, baseFee / maxBaseFee);
    
    return {
      baseFee,
      priorityFeeRange,
      networkCongestion,
      estimatedPrices: {
        safeLow: {
          maxFeePerGas: parseInt(data.safeLow.maxFee),
          maxPriorityFeePerGas: parseInt(data.safeLow.maxPriorityFee)
        },
        standard: {
          maxFeePerGas: parseInt(data.standard.maxFee),
          maxPriorityFeePerGas: parseInt(data.standard.maxPriorityFee)
        },
        fast: {
          maxFeePerGas: parseInt(data.fast.maxFee),
          maxPriorityFeePerGas: parseInt(data.fast.maxPriorityFee)
        },
        fastest: {
          maxFeePerGas: parseInt(data.fastest.maxFee),
          maxPriorityFeePerGas: parseInt(data.fastest.maxPriorityFee)
        }
      },
      source: 'gasStation',
      timestamp: Date.now()
    };
  }

  /**
   * Normalizes data from Polygonscan API
   * @private
   */
  private normalizePolygonscanData(data: any): GasData {
    if (data.status !== '1' || !data.result) {
      throw new Error('Invalid response from Polygonscan API');
    }
    
    const result = data.result;
    
    // Extract gas prices
    const safeLowGas = parseInt(result.SafeGasPrice);
    const standardGas = parseInt(result.ProposeGasPrice);
    const fastGas = parseInt(result.FastGasPrice);
    
    // Estimate base fee (Polygonscan doesn't provide it directly)
    // We'll use a heuristic based on the standard gas price
    const baseFee = Math.floor(standardGas * 0.8);
    
    // Estimate priority fees
    const safeLowPriorityFee = safeLowGas - baseFee;
    const standardPriorityFee = standardGas - baseFee;
    const fastPriorityFee = fastGas - baseFee;
    
    // Create a priority fee range
    const priorityFeeRange = [
      Math.max(1, safeLowPriorityFee),
      standardPriorityFee,
      fastPriorityFee,
      Math.ceil(fastPriorityFee * 1.2) // Estimate for "fastest"
    ];
    
    // Calculate network congestion (0-1 scale)
    const maxBaseFee = 100; // Assuming 100 GWEI as a high base fee
    const networkCongestion = Math.min(1, baseFee / maxBaseFee);
    
    return {
      baseFee,
      priorityFeeRange,
      networkCongestion,
      estimatedPrices: {
        safeLow: {
          maxFeePerGas: safeLowGas,
          maxPriorityFeePerGas: Math.max(1, safeLowPriorityFee)
        },
        standard: {
          maxFeePerGas: standardGas,
          maxPriorityFeePerGas: standardPriorityFee
        },
        fast: {
          maxFeePerGas: fastGas,
          maxPriorityFeePerGas: fastPriorityFee
        },
        fastest: {
          maxFeePerGas: Math.ceil(fastGas * 1.2),
          maxPriorityFeePerGas: Math.ceil(fastPriorityFee * 1.2)
        }
      },
      source: 'polygonscan',
      timestamp: Date.now()
    };
  }

  /**
   * Updates API configuration
   */
  public updateConfig(newConfig: Partial<PolygonGasAPIConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
}

export default PolygonGasAPI;
