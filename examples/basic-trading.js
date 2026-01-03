/**
 * Example: Basic Trading
 * Demonstrates basic order placement and execution
 */

const Cryptex = require('../src/index');

async function basicTradingExample() {
  console.log('=== Basic Trading Example ===\n');
  
  // Initialize platform
  const platform = new Cryptex();
  await platform.initialize();
  
  // Get available trading pairs
  const pairs = platform.tradingEngine.getTradingPairs();
  console.log('Available pairs:', pairs);
  
  // Get market data
  const btcData = platform.tradingEngine.getMarketData('BTC/USDT');
  console.log('\nBTC/USDT Market Data:', btcData);
  
  // Place a market buy order
  console.log('\n📈 Placing BUY order...');
  const buyOrder = await platform.tradingEngine.placeOrder({
    pair: 'BTC/USDT',
    type: 'market',
    side: 'buy',
    amount: 0.01
  });
  
  console.log('Order placed:', {
    id: buyOrder.id,
    status: buyOrder.status,
    executionTime: `${buyOrder.executionTime.toFixed(3)}ms`
  });
  
  // Place a limit sell order
  console.log('\n📉 Placing SELL limit order...');
  const sellOrder = await platform.tradingEngine.placeOrder({
    pair: 'BTC/USDT',
    type: 'limit',
    side: 'sell',
    amount: 0.01,
    price: btcData.price * 1.05 // 5% above current price
  });
  
  console.log('Limit order placed:', {
    id: sellOrder.id,
    status: sellOrder.status,
    price: sellOrder.price
  });
  
  // Get order book
  const orderBook = platform.tradingEngine.getOrderBook('BTC/USDT');
  console.log('\nOrder Book:');
  console.log('Top 3 Bids:', orderBook.bids.slice(0, 3));
  console.log('Top 3 Asks:', orderBook.asks.slice(0, 3));
  
  // Get trade history
  const trades = platform.tradingEngine.getTradeHistory(5);
  console.log('\nRecent Trades:', trades);
  
  console.log('\n✅ Basic trading example completed!');
}

// Run example
if (require.main === module) {
  basicTradingExample()
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = basicTradingExample;
