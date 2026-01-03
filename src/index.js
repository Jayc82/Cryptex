/**
 * Cryptex - Next-Generation Crypto Trading Platform
 * Main entry point
 */

const TradingEngine = require('./core/TradingEngine');
const SecurityManager = require('./security/SecurityManager');
const AIInsights = require('./ai/AIInsights');
const RiskManager = require('./risk/RiskManager');
const CommunityHub = require('./community/CommunityHub');

class Cryptex {
  constructor() {
    this.tradingEngine = new TradingEngine();
    this.securityManager = new SecurityManager();
    this.aiInsights = new AIInsights();
    this.riskManager = new RiskManager();
    this.communityHub = new CommunityHub();
    this.isInitialized = false;
  }

  async initialize() {
    console.log('🚀 Initializing Cryptex Trading Platform...');
    
    await this.securityManager.initialize();
    console.log('✅ Security Manager initialized');
    
    await this.tradingEngine.initialize();
    console.log('✅ Trading Engine initialized');
    
    await this.aiInsights.initialize();
    console.log('✅ AI Insights Engine initialized');
    
    await this.riskManager.initialize();
    console.log('✅ Risk Manager initialized');
    
    await this.communityHub.initialize();
    console.log('✅ Community Hub initialized');
    
    this.isInitialized = true;
    console.log('✨ Cryptex is ready for trading!');
    
    return this;
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      components: {
        tradingEngine: this.tradingEngine.getStatus(),
        security: this.securityManager.getStatus(),
        aiInsights: this.aiInsights.getStatus(),
        riskManager: this.riskManager.getStatus(),
        community: this.communityHub.getStatus()
      }
    };
  }
}

// Start the platform if run directly
if (require.main === module) {
  const platform = new Cryptex();
  platform.initialize()
    .then(() => {
      console.log('\n📊 Platform Status:', JSON.stringify(platform.getStatus(), null, 2));
    })
    .catch((error) => {
      console.error('❌ Failed to initialize platform:', error);
      process.exit(1);
    });
}

module.exports = Cryptex;
