/**
 * Gas Optimizer Module
 * 
 * This module provides the core functionality for optimizing gas fees on Polygon (MATIC) network.
 * It analyzes current network conditions, transaction types, and user preferences to recommend
 * optimal gas settings that balance cost savings with transaction speed.
 */

export interface GasOptimizerConfig {
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  maxWaitTime: number; // maximum acceptable wait time in seconds
  minSavingsPercent: number; // minimum savings percentage to recommend optimization
  feePercent: number; // our fee as percentage of savings
}

export interface TransactionDetails {
  type: TransactionType;
  gasLimit?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
  originalTx?: any;
}

export interface GasData {
  baseFee: number;
  priorityFeeRange: number[];
  networkCongestion: number;
  estimatedPrices: {
    safeLow: {
      maxFeePerGas: number;
      maxPriorityFeePerGas: number;
    };
    standard: {
      maxFeePerGas: number;
      maxPriorityFeePerGas: number;
    };
    fast: {
      maxFeePerGas: number;
      maxPriorityFeePerGas: number;
    };
    fastest: {
      maxFeePerGas: number;
      maxPriorityFeePerGas: number;
    };
  };
  source: string;
  timestamp: number;
}

export interface OptimizationResult {
  original: {
    maxFeePerGas: number;
    maxPriorityFeePerGas: number;
    gasLimit: number;
    estimatedCostInMatic: number;
  };
  optimized: {
    maxFeePerGas: number;
    maxPriorityFeePerGas: number;
    gasLimit: number;
    estimatedCostInMatic: number;
    estimatedWaitTime: number;
  };
  savings: {
    savingsInMatic: number;
    savingsPercent: number;
    savingsLevel: 'high' | 'medium' | 'low' | 'none';
  };
  fee: {
    feeInMatic: number;
    feePercent: number;
  };
  netSavings: number;
  shouldOptimize: boolean;
}

export type TransactionType = 'transfer' | 'erc20Transfer' | 'swap' | 'nftMint' | 'nftTransfer' | 'contractInteraction';

export class GasOptimizer {
  private config: GasOptimizerConfig;
  private gasLimitRecommendations: Record<TransactionType, number>;

  constructor(config: Partial<GasOptimizerConfig> = {}) {
    // Default configuration
    this.config = {
      aggressiveness: 'balanced',
      maxWaitTime: 30,
      minSavingsPercent: 5,
      feePercent: 10,
      ...config
    };
    
    // Transaction type gas limit recommendations
    this.gasLimitRecommendations = {
      'transfer': 21000,
      'erc20Transfer': 65000,
      'swap': 200000,
      'nftMint': 250000,
      'nftTransfer': 100000,
      'contractInteraction': 150000,
    };
  }

  /**
   * Analyzes current gas prices and recommends optimal settings
   */
  public optimizeGas(currentGasData: GasData, transactionDetails: TransactionDetails): OptimizationResult {
    // Extract relevant data
    const { baseFee, priorityFeeRange, networkCongestion } = currentGasData;
    const { 
      type, 
      gasLimit: userGasLimit = 21000, 
      maxFeePerGas: userMaxFee = 0, 
      maxPriorityFeePerGas: userPriorityFee = 0 
    } = transactionDetails;
    
    // Calculate optimal gas settings based on network conditions and user preferences
    const optimizedSettings = this.calculateOptimalGasSettings(
      baseFee,
      priorityFeeRange,
      networkCongestion
    );
    
    // Recommend appropriate gas limit based on transaction type
    const recommendedGasLimit = this.recommendGasLimit(type, userGasLimit);
    
    // Calculate potential savings
    const savings = this.calculateSavings(
      userMaxFee,
      optimizedSettings.maxFeePerGas,
      recommendedGasLimit
    );
    
    // Calculate our fee (only if there are savings)
    const fee = savings.savingsInMatic > 0 
      ? (savings.savingsInMatic * this.config.feePercent / 100)
      : 0;
    
    // Determine if optimization is worthwhile
    const shouldOptimize = this.shouldOptimize(savings.savingsPercent, optimizedSettings.estimatedWaitTime);
    
    // Determine savings level for UI indicator
    const savingsLevel = this.determineSavingsLevel(savings.savingsPercent, networkCongestion);
    
    return {
      original: {
        maxFeePerGas: userMaxFee,
        maxPriorityFeePerGas: userPriorityFee,
        gasLimit: userGasLimit,
        estimatedCostInMatic: this.estimateCost(userMaxFee, userGasLimit)
      },
      optimized: {
        maxFeePerGas: optimizedSettings.maxFeePerGas,
        maxPriorityFeePerGas: optimizedSettings.maxPriorityFeePerGas,
        gasLimit: recommendedGasLimit,
        estimatedCostInMatic: this.estimateCost(optimizedSettings.maxFeePerGas, recommendedGasLimit),
        estimatedWaitTime: optimizedSettings.estimatedWaitTime
      },
      savings: {
        savingsInMatic: savings.savingsInMatic,
        savingsPercent: savings.savingsPercent,
        savingsLevel: savingsLevel
      },
      fee: {
        feeInMatic: fee,
        feePercent: this.config.feePercent
      },
      netSavings: savings.savingsInMatic - fee,
      shouldOptimize: shouldOptimize
    };
  }

  /**
   * Calculates optimal gas settings based on network conditions
   * @private
   */
  private calculateOptimalGasSettings(
    baseFee: number, 
    priorityFeeRange: number[], 
    networkCongestion: number
  ): {
    maxFeePerGas: number;
    maxPriorityFeePerGas: number;
    estimatedWaitTime: number;
  } {
    // Adjust strategy based on network congestion and user preference
    let priorityFeePercentile: number;
    let maxFeePadding: number;
    let estimatedWaitTime: number;
    
    switch (this.config.aggressiveness) {
      case 'conservative':
        // Prioritize speed over savings
        priorityFeePercentile = networkCongestion > 0.7 ? 0.8 : 0.6;
        maxFeePadding = 1.3; // 30% padding
        estimatedWaitTime = 15;
        break;
      case 'aggressive':
        // Prioritize savings over speed
        priorityFeePercentile = networkCongestion > 0.8 ? 0.4 : 0.2;
        maxFeePadding = 1.1; // 10% padding
        estimatedWaitTime = networkCongestion > 0.8 ? 60 : 30;
        break;
      case 'balanced':
      default:
        // Balance between savings and speed
        priorityFeePercentile = networkCongestion > 0.7 ? 0.6 : 0.4;
        maxFeePadding = 1.2; // 20% padding
        estimatedWaitTime = networkCongestion > 0.7 ? 30 : 20;
        break;
    }
    
    // Calculate optimal priority fee based on percentile of current range
    const priorityFeeRange_sorted = [...priorityFeeRange].sort((a, b) => a - b);
    const index = Math.floor(priorityFeeRange_sorted.length * priorityFeePercentile);
    const optimalPriorityFee = priorityFeeRange_sorted[index] || priorityFeeRange_sorted[0];
    
    // Calculate max fee with appropriate padding
    const optimalMaxFee = Math.ceil((baseFee + optimalPriorityFee) * maxFeePadding);
    
    return {
      maxFeePerGas: optimalMaxFee,
      maxPriorityFeePerGas: optimalPriorityFee,
      estimatedWaitTime: estimatedWaitTime
    };
  }

  /**
   * Recommends appropriate gas limit based on transaction type
   * @private
   */
  private recommendGasLimit(transactionType: TransactionType, userGasLimit: number): number {
    // If user didn't provide a gas limit or it's suspiciously low
    if (!userGasLimit || userGasLimit < 21000) {
      // Use recommended gas limit based on transaction type
      return this.gasLimitRecommendations[transactionType] || 100000; // default fallback
    }
    
    // If user's gas limit is reasonable, use it
    const recommendedLimit = this.gasLimitRecommendations[transactionType];
    if (!recommendedLimit) {
      return userGasLimit; // keep user's limit if we don't have a recommendation
    }
    
    // If user's limit is significantly lower than recommendation, use recommendation
    if (userGasLimit < recommendedLimit * 0.8) {
      return recommendedLimit;
    }
    
    // Otherwise, keep user's gas limit
    return userGasLimit;
  }

  /**
   * Calculates potential savings from optimization
   * @private
   */
  private calculateSavings(
    originalMaxFee: number, 
    optimizedMaxFee: number, 
    gasLimit: number
  ): {
    savingsInMatic: number;
    savingsPercent: number;
  } {
    // Estimate original cost
    const originalCost = this.estimateCost(originalMaxFee, gasLimit);
    
    // Estimate optimized cost
    const optimizedCost = this.estimateCost(optimizedMaxFee, gasLimit);
    
    // Calculate savings
    const savingsInMatic = Math.max(0, originalCost - optimizedCost);
    const savingsPercent = originalCost > 0 
      ? (savingsInMatic / originalCost) * 100 
      : 0;
    
    return {
      savingsInMatic,
      savingsPercent
    };
  }

  /**
   * Estimates transaction cost based on gas parameters
   * @private
   */
  private estimateCost(maxFeePerGas: number, gasLimit: number): number {
    return (maxFeePerGas * gasLimit) / 1e9; // Convert from wei to MATIC
  }

  /**
   * Determines if optimization is worthwhile based on savings and wait time
   * @private
   */
  private shouldOptimize(savingsPercent: number, estimatedWaitTime: number): boolean {
    // Only recommend optimization if:
    // 1. Savings percentage exceeds minimum threshold
    // 2. Estimated wait time is acceptable
    return (
      savingsPercent >= this.config.minSavingsPercent &&
      estimatedWaitTime <= this.config.maxWaitTime
    );
  }

  /**
   * Determines savings level for UI indicator
   * @private
   */
  private determineSavingsLevel(
    savingsPercent: number, 
    networkCongestion: number
  ): 'high' | 'medium' | 'low' | 'none' {
    // High savings: >20% savings or high congestion with >10% savings
    if (savingsPercent > 20 || (networkCongestion > 0.7 && savingsPercent > 10)) {
      return 'high';
    }
    
    // Medium savings: 10-20% savings
    if (savingsPercent >= 10) {
      return 'medium';
    }
    
    // Low savings: 5-10% savings
    if (savingsPercent >= 5) {
      return 'low';
    }
    
    // No significant savings
    return 'none';
  }

  /**
   * Updates optimizer configuration
   */
  public updateConfig(newConfig: Partial<GasOptimizerConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }
}

export default GasOptimizer;
