/**
 * Example: Community Features
 * Demonstrates copy trading, leaderboards, and strategy sharing
 */

const Cryptex = require('../src/index');

async function communityExample() {
  console.log('=== Community Features Example ===\n');
  
  const platform = new Cryptex();
  await platform.initialize();
  
  // Get leaderboard
  console.log('🏆 Top Traders Leaderboard:');
  const leaderboard = platform.communityHub.getLeaderboard(5);
  leaderboard.forEach(trader => {
    console.log(`  ${trader.rank}. ${trader.username}`);
    console.log(`     Return: ${trader.totalReturn}%`);
    console.log(`     Win Rate: ${(trader.winRate * 100).toFixed(1)}%`);
    console.log(`     Followers: ${trader.followers}`);
    console.log('');
  });
  
  // Share a strategy
  console.log('\n📝 Sharing a trading strategy...');
  const strategy = platform.communityHub.shareStrategy('user123', {
    name: 'RSI Momentum Strategy',
    description: 'Buy on RSI oversold, sell on overbought',
    type: 'technical',
    indicators: ['RSI', 'Volume'],
    entryRules: ['RSI < 30', 'Volume increasing'],
    exitRules: ['RSI > 70', 'Volume decreasing'],
    backtest: {
      winRate: 0.68,
      totalReturn: 156.3,
      trades: 89
    }
  });
  
  console.log('Strategy Shared:', {
    id: strategy.id,
    name: strategy.name,
    winRate: `${(strategy.backtest.winRate * 100).toFixed(1)}%`,
    return: `${strategy.backtest.totalReturn}%`
  });
  
  console.log('\n✅ Community features example completed!');
}

// Run example
if (require.main === module) {
  communityExample()
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = communityExample;
