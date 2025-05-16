import React from 'react';

interface SavingsIndicatorProps {
  result: {
    savings: {
      savingsInMatic: number;
      savingsPercent: number;
      savingsLevel: 'high' | 'medium' | 'low' | 'none';
    };
    original: {
      estimatedCostInMatic: number;
    };
    optimized: {
      estimatedCostInMatic: number;
      estimatedWaitTime: number;
    };
    fee: {
      feeInMatic: number;
    };
    netSavings: number;
  };
}

const SavingsIndicator: React.FC<SavingsIndicatorProps> = ({ result }) => {
  // MATIC price in USD (in a real app, this would be fetched from an API)
  const maticPriceUsd = 1.40;
  
  // Format MATIC value with USD equivalent
  const formatMatic = (value: number) => {
    const usdValue = value * maticPriceUsd;
    return `${value.toFixed(6)} MATIC ($${usdValue.toFixed(4)})`;
  };
  
  // Get icon and text based on savings level
  const getSavingsInfo = () => {
    switch (result.savings.savingsLevel) {
      case 'high':
        return {
          icon: '🟢',
          text: `Optimal (Save ${result.savings.savingsPercent.toFixed(1)}%)`,
          className: 'level-high'
        };
      case 'medium':
        return {
          icon: '🟡',
          text: `Good (Save ${result.savings.savingsPercent.toFixed(1)}%)`,
          className: 'level-medium'
        };
      case 'low':
        return {
          icon: '🟠',
          text: `Fair (Save ${result.savings.savingsPercent.toFixed(1)}%)`,
          className: 'level-low'
        };
      case 'none':
      default:
        return {
          icon: '🔴',
          text: 'High Gas (Expensive)',
          className: 'level-none'
        };
    }
  };
  
  const savingsInfo = getSavingsInfo();
  
  return (
    <div className="savings-indicator">
      <div className="savings-meter">
        <div className={`meter-circle ${savingsInfo.className}`}>
          <div className="meter-icon">{savingsInfo.icon}</div>
        </div>
        <div className="meter-label">{savingsInfo.text}</div>
      </div>
      
      <div className="savings-details">
        <div className="savings-row">
          <span className="label">Default Cost:</span>
          <span className="value">{formatMatic(result.original.estimatedCostInMatic)}</span>
        </div>
        <div className="savings-row">
          <span className="label">Optimized Cost:</span>
          <span className="value">{formatMatic(result.optimized.estimatedCostInMatic)}</span>
        </div>
        <div className="savings-row">
          <span className="label">You Save:</span>
          <span className="value">{formatMatic(result.savings.savingsInMatic)}</span>
        </div>
        <div className="savings-row">
          <span className="label">Our Fee:</span>
          <span className="value">{formatMatic(result.fee.feeInMatic)}</span>
        </div>
        <div className="savings-row">
          <span className="label">Net Savings:</span>
          <span className="value">{formatMatic(result.netSavings)}</span>
        </div>
      </div>
      
      <div className="text-sm text-secondary-text mt-2">
        Estimated wait time: {result.optimized.estimatedWaitTime} seconds
      </div>
    </div>
  );
};

export default SavingsIndicator;
