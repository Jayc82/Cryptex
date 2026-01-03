/**
 * RiskManager - Comprehensive risk management system
 * Position sizing, stop-loss automation, and portfolio analysis
 */

class RiskManager {
  constructor() {
    this.portfolios = new Map();
    this.riskProfiles = new Map();
    this.alerts = [];
    this.maxDrawdown = 0.20; // 20% max drawdown
  }

  async initialize() {
    // Initialize risk management rules
    this.initializeRiskProfiles();
    return this;
  }

  initializeRiskProfiles() {
    this.riskProfiles.set('conservative', {
      maxPositionSize: 0.05, // 5% per position
      maxPortfolioRisk: 0.10, // 10% total risk
      stopLossPercent: 0.02, // 2% stop loss
      leverageLimit: 1
    });
    
    this.riskProfiles.set('moderate', {
      maxPositionSize: 0.10,
      maxPortfolioRisk: 0.20,
      stopLossPercent: 0.05,
      leverageLimit: 2
    });
    
    this.riskProfiles.set('aggressive', {
      maxPositionSize: 0.20,
      maxPortfolioRisk: 0.30,
      stopLossPercent: 0.10,
      leverageLimit: 5
    });
  }

  /**
   * Calculate optimal position size based on risk
   */
  calculatePositionSize(portfolio, pair, riskProfile = 'moderate') {
    const profile = this.riskProfiles.get(riskProfile);
    const portfolioValue = this.calculatePortfolioValue(portfolio);
    
    const maxPositionValue = portfolioValue * profile.maxPositionSize;
    const riskAmount = portfolioValue * profile.stopLossPercent;
    
    return {
      maxPositionValue,
      recommendedRisk: riskAmount,
      profile: riskProfile,
      stopLossPercent: profile.stopLossPercent * 100,
      reasoning: `Based on ${riskProfile} profile, max ${(profile.maxPositionSize * 100).toFixed(0)}% per position`
    };
  }

  /**
   * Assess portfolio risk
   */
  assessPortfolioRisk(portfolio) {
    const positions = portfolio.positions || [];
    const totalValue = this.calculatePortfolioValue(portfolio);
    
    let totalRisk = 0;
    let concentrationRisk = 0;
    const assetDistribution = {};
    
    for (const position of positions) {
      const positionValue = position.amount * position.currentPrice;
      const positionRisk = positionValue * 0.05; // Assume 5% risk per position
      totalRisk += positionRisk;
      
      assetDistribution[position.asset] = (assetDistribution[position.asset] || 0) + positionValue;
    }
    
    // Calculate concentration risk
    for (const value of Object.values(assetDistribution)) {
      const concentration = value / totalValue;
      if (concentration > 0.3) concentrationRisk += concentration - 0.3;
    }
    
    const riskScore = this.calculateRiskScore(totalRisk / totalValue, concentrationRisk);
    
    return {
      totalValue,
      totalRisk,
      riskPercentage: (totalRisk / totalValue * 100).toFixed(2),
      concentrationRisk: (concentrationRisk * 100).toFixed(2),
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      diversification: Object.keys(assetDistribution).length,
      recommendations: this.generateRecommendations(riskScore, concentrationRisk)
    };
  }

  calculateRiskScore(riskRatio, concentrationRisk) {
    // Score from 0-100, higher is riskier
    return Math.min(100, (riskRatio * 100) + (concentrationRisk * 50));
  }

  getRiskLevel(score) {
    if (score < 20) return 'Very Low';
    if (score < 40) return 'Low';
    if (score < 60) return 'Moderate';
    if (score < 80) return 'High';
    return 'Very High';
  }

  generateRecommendations(riskScore, concentrationRisk) {
    const recommendations = [];
    
    if (riskScore > 60) {
      recommendations.push('Consider reducing position sizes');
      recommendations.push('Implement stop-loss orders');
    }
    
    if (concentrationRisk > 0.1) {
      recommendations.push('Diversify portfolio across more assets');
      recommendations.push('Reduce exposure to concentrated positions');
    }
    
    if (riskScore < 30) {
      recommendations.push('Portfolio well-balanced');
      recommendations.push('Consider gradual position increases if opportunities arise');
    }
    
    return recommendations;
  }

  /**
   * Calculate portfolio value
   */
  calculatePortfolioValue(portfolio) {
    const positions = portfolio.positions || [];
    return positions.reduce((total, pos) => total + (pos.amount * pos.currentPrice), portfolio.cash || 0);
  }

  /**
   * Set automated stop-loss
   */
  setStopLoss(position, stopLossPercent) {
    const stopLossPrice = position.entryPrice * (1 - stopLossPercent);
    
    return {
      positionId: position.id,
      type: 'stop-loss',
      triggerPrice: stopLossPrice,
      action: 'sell',
      amount: position.amount,
      status: 'active',
      created: Date.now()
    };
  }

  /**
   * Monitor and trigger alerts
   */
  checkAlerts(portfolio) {
    const risk = this.assessPortfolioRisk(portfolio);
    const alerts = [];
    
    if (risk.riskScore > 80) {
      alerts.push({
        level: 'critical',
        message: 'Portfolio risk is critically high',
        action: 'Reduce positions immediately'
      });
    }
    
    if (risk.concentrationRisk > 30) {
      alerts.push({
        level: 'warning',
        message: 'High concentration risk detected',
        action: 'Diversify portfolio'
      });
    }
    
    this.alerts.push(...alerts);
    return alerts;
  }

  /**
   * Calculate portfolio diversification score
   */
  calculateDiversificationScore(portfolio) {
    const positions = portfolio.positions || [];
    if (positions.length === 0) return 0;
    
    const totalValue = this.calculatePortfolioValue(portfolio);
    const assetValues = {};
    
    for (const position of positions) {
      const value = position.amount * position.currentPrice;
      assetValues[position.asset] = value;
    }
    
    // Calculate Herfindahl index (lower is more diversified)
    const herfindahl = Object.values(assetValues).reduce((sum, value) => {
      const share = value / totalValue;
      return sum + (share * share);
    }, 0);
    
    // Convert to 0-100 scale (higher is better)
    const diversificationScore = (1 - herfindahl) * 100;
    
    return {
      score: diversificationScore.toFixed(2),
      assets: Object.keys(assetValues).length,
      recommendation: diversificationScore > 70 ? 'Well diversified' :
                     diversificationScore > 40 ? 'Moderately diversified' :
                     'Poorly diversified - increase variety'
    };
  }

  getStatus() {
    return {
      active: true,
      portfolios: this.portfolios.size,
      activeAlerts: this.alerts.length,
      riskProfiles: Array.from(this.riskProfiles.keys()),
      features: [
        'Position Sizing Calculator',
        'Automated Stop-Loss',
        'Portfolio Risk Assessment',
        'Diversification Analysis',
        'Real-time Risk Monitoring',
        'Custom Risk Profiles'
      ]
    };
  }
}

module.exports = RiskManager;
