/**
 * Utility functions for Cryptex platform
 */

class Utils {
  /**
   * Format currency with proper decimals
   */
  static formatCurrency(amount, currency = 'USD', decimals = 2) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  }

  /**
   * Format percentage
   */
  static formatPercent(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  /**
   * Calculate percentage change
   */
  static percentChange(oldValue, newValue) {
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Validate trading pair format
   */
  static isValidPair(pair) {
    return /^[A-Z]{3,}\/[A-Z]{3,}$/.test(pair);
  }

  /**
   * Generate unique ID
   */
  static generateId(prefix = 'ID') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Delay execution
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate moving average
   */
  static movingAverage(values, period) {
    if (values.length < period) return null;
    
    const sum = values.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Sanitize input
   */
  static sanitize(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>'"]/g, '');
  }

  /**
   * Rate limiter
   */
  static createRateLimiter(maxRequests, timeWindow) {
    const requests = new Map();
    
    return (key) => {
      const now = Date.now();
      const userRequests = requests.get(key) || [];
      const recentRequests = userRequests.filter(time => now - time < timeWindow);
      
      if (recentRequests.length >= maxRequests) {
        return false;
      }
      
      recentRequests.push(now);
      requests.set(key, recentRequests);
      return true;
    };
  }

  /**
   * Deep clone object
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Format timestamp
   */
  static formatTimestamp(timestamp) {
    return new Date(timestamp).toISOString();
  }

  /**
   * Calculate Sharpe ratio
   */
  static sharpeRatio(returns, riskFreeRate = 0.02) {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Utils.standardDeviation(returns);
    return (avgReturn - riskFreeRate) / stdDev;
  }
}

module.exports = Utils;
