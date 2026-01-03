# Cryptex API Documentation

## Overview

Cryptex is a next-generation crypto trading platform that combines lightning-fast execution, ultra-secure asset protection, and AI-driven insights. This documentation covers all major components and their APIs.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Trading Engine](#trading-engine)
3. [Security Manager](#security-manager)
4. [AI Insights](#ai-insights)
5. [Risk Manager](#risk-manager)
6. [Community Hub](#community-hub)

## Getting Started

### Installation

```bash
npm install
```

### Basic Usage

```javascript
const Cryptex = require('./src/index');

const platform = new Cryptex();
await platform.initialize();

// Check platform status
console.log(platform.getStatus());
```

## Trading Engine

The Trading Engine provides lightning-fast order execution and market data management.

### Place an Order

```javascript
const order = await platform.tradingEngine.placeOrder({
  pair: 'BTC/USDT',
  type: 'market',
  side: 'buy',
  amount: 0.1
});

console.log('Order executed:', order);
```

### Order Types

- **Market Order**: Execute immediately at current price
- **Limit Order**: Execute at specified price or better
- **Stop-Loss Order**: Trigger sell when price drops to specified level

### Get Market Data

```javascript
const marketData = platform.tradingEngine.getMarketData('BTC/USDT');
console.log('Current price:', marketData.price);
```

### Get Order Book

```javascript
const orderBook = platform.tradingEngine.getOrderBook('BTC/USDT');
console.log('Best bid:', orderBook.bids[0]);
console.log('Best ask:', orderBook.asks[0]);
```

## Security Manager

Ultra-secure asset protection with encryption and secure wallet management.

### Create Wallet

```javascript
const wallet = platform.securityManager.createWallet('user123');
console.log('Wallet created:', wallet.id);
console.log('Public key:', wallet.publicKey);
```

### Generate API Keys

```javascript
const credentials = platform.securityManager.generateApiKey('user123');
console.log('API Key:', credentials.apiKey);
console.log('API Secret:', credentials.apiSecret);
```

### Encrypt Data

```javascript
const sensitive = { privateKey: 'abc123...' };
const encrypted = platform.securityManager.encrypt(sensitive);
const decrypted = platform.securityManager.decrypt(encrypted);
```

### Sign Transaction

```javascript
const transaction = {
  from: wallet.publicKey,
  to: 'recipient_address',
  amount: 1.5,
  timestamp: Date.now()
};

const signature = platform.securityManager.signTransaction(
  transaction,
  privateKey
);
```

## AI Insights

AI-driven market analysis and trading signals.

### Get Price Prediction

```javascript
const prediction = await platform.aiInsights.predictPrice('BTC/USDT', '1h');
console.log('Predicted price:', prediction.predictedPrice);
console.log('Confidence:', prediction.confidence);
console.log('Direction:', prediction.direction);
```

### Analyze Market Sentiment

```javascript
const sentiment = await platform.aiInsights.analyzeSentiment('BTC/USDT');
console.log('Sentiment score:', sentiment.score);
console.log('Sentiment label:', sentiment.label);
```

### Generate Trading Signal

```javascript
const signal = await platform.aiInsights.generateSignal('BTC/USDT');
console.log('Action:', signal.action); // BUY, SELL, or HOLD
console.log('Strength:', signal.strength);
console.log('Entry price:', signal.entryPrice);
console.log('Target price:', signal.targetPrice);
```

### Detect Chart Patterns

```javascript
const patterns = platform.aiInsights.detectPatterns('BTC/USDT', priceHistory);
if (patterns.pattern) {
  console.log('Pattern detected:', patterns.pattern);
  console.log('Implications:', patterns.implications);
}
```

## Risk Manager

Comprehensive risk management and portfolio analysis.

### Calculate Position Size

```javascript
const portfolio = {
  cash: 10000,
  positions: []
};

const positionSize = platform.riskManager.calculatePositionSize(
  portfolio,
  'BTC/USDT',
  'moderate' // or 'conservative' or 'aggressive'
);

console.log('Max position value:', positionSize.maxPositionValue);
console.log('Recommended risk:', positionSize.recommendedRisk);
```

### Assess Portfolio Risk

```javascript
const portfolio = {
  cash: 5000,
  positions: [
    { asset: 'BTC', amount: 0.5, currentPrice: 45000 },
    { asset: 'ETH', amount: 10, currentPrice: 2500 }
  ]
};

const riskAssessment = platform.riskManager.assessPortfolioRisk(portfolio);
console.log('Total value:', riskAssessment.totalValue);
console.log('Risk level:', riskAssessment.riskLevel);
console.log('Risk score:', riskAssessment.riskScore);
console.log('Recommendations:', riskAssessment.recommendations);
```

### Set Stop-Loss

```javascript
const position = {
  id: 'POS123',
  entryPrice: 45000,
  amount: 0.5
};

const stopLoss = platform.riskManager.setStopLoss(position, 0.05); // 5%
console.log('Stop loss at:', stopLoss.triggerPrice);
```

### Calculate Diversification

```javascript
const divScore = platform.riskManager.calculateDiversificationScore(portfolio);
console.log('Diversification score:', divScore.score);
console.log('Number of assets:', divScore.assets);
console.log('Recommendation:', divScore.recommendation);
```

## Community Hub

Social trading features, copy trading, and strategy sharing.

### Get Leaderboard

```javascript
const topTraders = platform.communityHub.getLeaderboard(10);
topTraders.forEach(trader => {
  console.log(`${trader.rank}. ${trader.username} - Return: ${trader.totalReturn}%`);
});
```

### Enable Copy Trading

```javascript
const copyTrade = platform.communityHub.enableCopyTrading(
  'user123',
  'TRADER-xyz',
  {
    copyRatio: 0.1,      // Copy 10% of position sizes
    maxPositionSize: 1000,
    stopLoss: 0.05        // 5% stop loss
  }
);

console.log('Copy trading enabled:', copyTrade.id);
```

### Share Trading Strategy

```javascript
const strategy = platform.communityHub.shareStrategy('user123', {
  name: 'MA Crossover Strategy',
  description: 'Buy when 50 MA crosses above 200 MA',
  type: 'technical',
  indicators: ['MA50', 'MA200'],
  entryRules: ['MA50 crosses above MA200'],
  exitRules: ['MA50 crosses below MA200'],
  backtest: {
    winRate: 0.68,
    totalReturn: 145.2,
    trades: 234
  }
});

console.log('Strategy shared:', strategy.id);
```

### Get Popular Strategies

```javascript
const strategies = platform.communityHub.getPopularStrategies(10);
strategies.forEach(strat => {
  console.log(`${strat.name} - Win rate: ${(strat.backtest.winRate * 100).toFixed(1)}%`);
});
```

### Create Discussion

```javascript
const discussion = platform.communityHub.createDiscussion(
  'user123',
  'What do you think about BTC breaking $50k?'
);

// Add comment
const comment = platform.communityHub.addComment(
  discussion.id,
  'user456',
  'Bullish! Target $60k by Q2'
);
```

### Get Trader Profile

```javascript
const profile = platform.communityHub.getTraderProfile('TRADER-xyz');
console.log('Username:', profile.username);
console.log('Win rate:', profile.winRate);
console.log('Total return:', profile.totalReturn);
console.log('Followers:', profile.followers);
console.log('Recent trades:', profile.recentTrades);
```

## Error Handling

All async methods may throw errors. Always use try-catch:

```javascript
try {
  const order = await platform.tradingEngine.placeOrder(orderData);
} catch (error) {
  console.error('Order failed:', error.message);
}
```

## Events

The platform emits various events you can listen to:

```javascript
platform.tradingEngine.on('orderExecuted', (order) => {
  console.log('Order executed:', order.id);
});
```

## Best Practices

1. **Always initialize the platform** before using any features
2. **Use appropriate risk profiles** based on your risk tolerance
3. **Enable stop-losses** for all positions
4. **Diversify your portfolio** across multiple assets
5. **Monitor AI signals** but make informed decisions
6. **Follow top traders** to learn from their strategies
7. **Keep API keys secure** and never share them

## Support

For issues and questions, please visit our GitHub repository or community forum.

## License

MIT License - see LICENSE file for details
