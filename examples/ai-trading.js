/**
 * Example: AI-Powered Trading
 * Demonstrates AI insights and automated trading signals
 */

const Cryptex = require('../src/index');

async function aiTradingExample() {
  console.log('=== AI-Powered Trading Example ===\n');
  
  const platform = new Cryptex();
  await platform.initialize();
  
  const pair = 'BTC/USDT';
  
  // Get AI price prediction
  console.log('🤖 Getting AI price prediction...');
  const prediction = await platform.aiInsights.predictPrice(pair, '1h');
  console.log('\nPrice Prediction:', {
    current: prediction.currentPrice,
    predicted: prediction.predictedPrice.toFixed(2),
    direction: prediction.direction,
    confidence: `${(prediction.confidence * 100).toFixed(1)}%`,
    change: `${((prediction.predictedPrice / prediction.currentPrice - 1) * 100).toFixed(2)}%`
  });
  
  // Analyze market sentiment
  console.log('\n💭 Analyzing market sentiment...');
  const sentiment = await platform.aiInsights.analyzeSentiment(pair);
  console.log('\nMarket Sentiment:', {
    score: sentiment.score.toFixed(2),
    label: sentiment.label,
    sources: sentiment.sources
  });
  
  // Generate trading signal
  console.log('\n📊 Generating trading signal...');
  const signal = await platform.aiInsights.generateSignal(pair);
  console.log('\nTrading Signal:', {
    action: signal.action,
    strength: `${(signal.strength * 100).toFixed(1)}%`,
    confidence: `${(signal.confidence * 100).toFixed(1)}%`,
    entryPrice: signal.entryPrice,
    targetPrice: signal.targetPrice.toFixed(2),
    stopLoss: signal.stopLoss.toFixed(2),
    reasoning: signal.reasoning
  });
  
  // Detect chart patterns
  console.log('\n📈 Detecting chart patterns...');
  const patterns = platform.aiInsights.detectPatterns(pair, []);
  if (patterns.pattern) {
    console.log('\nPattern Detected:', {
      pattern: patterns.pattern,
      confidence: `${(patterns.confidence * 100).toFixed(1)}%`,
      implications: patterns.implications
    });
  } else {
    console.log('\nNo significant patterns detected at this time');
  }
  
  // Get model performance
  console.log('\n🎯 AI Model Performance:');
  const models = platform.aiInsights.getModelPerformance();
  models.forEach(model => {
    console.log(`  ${model.name}: ${(model.accuracy * 100).toFixed(1)}% accuracy`);
  });
  
  console.log('\n✅ AI trading example completed!');
}

// Run example
if (require.main === module) {
  aiTradingExample()
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = aiTradingExample;
