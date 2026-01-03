/**
 * CommunityHub - Social trading and community features
 * Copy trading, leaderboards, strategy sharing
 */

class CommunityHub {
  constructor() {
    this.traders = new Map();
    this.strategies = new Map();
    this.leaderboard = [];
    this.discussions = [];
    this.copyTrades = new Map();
  }

  async initialize() {
    // Initialize with sample top traders
    this.initializeSampleTraders();
    return this;
  }

  initializeSampleTraders() {
    const sampleTraders = [
      { username: 'CryptoMaster', winRate: 0.78, totalReturn: 245.5, followers: 1523 },
      { username: 'AITrader', winRate: 0.82, totalReturn: 312.8, followers: 2104 },
      { username: 'DiamondHands', winRate: 0.71, totalReturn: 189.3, followers: 987 },
      { username: 'MoonShot', winRate: 0.69, totalReturn: 167.2, followers: 756 },
      { username: 'SafeInvestor', winRate: 0.85, totalReturn: 128.4, followers: 1342 }
    ];
    
    for (const trader of sampleTraders) {
      const id = `TRADER-${Math.random().toString(36).substring(2, 11)}`;
      this.traders.set(id, {
        id,
        ...trader,
        joinDate: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
        totalTrades: Math.floor(Math.random() * 1000) + 100,
        copiers: 0
      });
    }
    
    this.updateLeaderboard();
  }

  /**
   * Get leaderboard of top traders
   */
  getLeaderboard(limit = 10) {
    this.updateLeaderboard();
    return this.leaderboard.slice(0, limit);
  }

  updateLeaderboard() {
    this.leaderboard = Array.from(this.traders.values())
      .sort((a, b) => b.totalReturn - a.totalReturn)
      .map((trader, index) => ({
        rank: index + 1,
        username: trader.username,
        totalReturn: trader.totalReturn,
        winRate: trader.winRate,
        followers: trader.followers,
        traderId: trader.id
      }));
  }

  /**
   * Enable copy trading for a user
   */
  enableCopyTrading(userId, traderId, settings = {}) {
    const trader = this.traders.get(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }
    
    const copyTradeId = `COPY-${Date.now()}`;
    const copyTrade = {
      id: copyTradeId,
      userId,
      traderId,
      traderName: trader.username,
      enabled: true,
      settings: {
        copyRatio: settings.copyRatio || 0.1, // Copy 10% of position sizes
        maxPositionSize: settings.maxPositionSize || 1000,
        stopLoss: settings.stopLoss || 0.05,
        ...settings
      },
      created: Date.now(),
      totalCopied: 0
    };
    
    this.copyTrades.set(copyTradeId, copyTrade);
    trader.copiers = (trader.copiers || 0) + 1;
    
    return copyTrade;
  }

  /**
   * Share a trading strategy
   */
  shareStrategy(userId, strategy) {
    const strategyId = `STRAT-${Date.now()}`;
    const sharedStrategy = {
      id: strategyId,
      userId,
      name: strategy.name,
      description: strategy.description,
      type: strategy.type || 'technical',
      indicators: strategy.indicators || [],
      entryRules: strategy.entryRules || [],
      exitRules: strategy.exitRules || [],
      backtest: {
        winRate: strategy.backtest?.winRate || Math.random() * 0.4 + 0.5,
        totalReturn: strategy.backtest?.totalReturn || Math.random() * 200,
        trades: strategy.backtest?.trades || Math.floor(Math.random() * 500) + 50
      },
      likes: 0,
      uses: 0,
      comments: [],
      created: Date.now()
    };
    
    this.strategies.set(strategyId, sharedStrategy);
    return sharedStrategy;
  }

  /**
   * Get popular strategies
   */
  getPopularStrategies(limit = 10) {
    return Array.from(this.strategies.values())
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  }

  /**
   * Create a discussion post
   */
  createDiscussion(userId, content) {
    const discussion = {
      id: `DISC-${Date.now()}`,
      userId,
      username: this.getUserName(userId),
      content,
      likes: 0,
      comments: [],
      timestamp: Date.now()
    };
    
    this.discussions.push(discussion);
    return discussion;
  }

  /**
   * Get recent discussions
   */
  getDiscussions(limit = 20) {
    return this.discussions.slice(-limit).reverse();
  }

  /**
   * Add comment to discussion
   */
  addComment(discussionId, userId, comment) {
    const discussion = this.discussions.find(d => d.id === discussionId);
    if (!discussion) {
      throw new Error('Discussion not found');
    }
    
    const commentObj = {
      id: `COMM-${Date.now()}`,
      userId,
      username: this.getUserName(userId),
      content: comment,
      timestamp: Date.now()
    };
    
    discussion.comments.push(commentObj);
    return commentObj;
  }

  /**
   * Get trader profile
   */
  getTraderProfile(traderId) {
    const trader = this.traders.get(traderId);
    if (!trader) return null;
    
    return {
      ...trader,
      recentTrades: this.getTraderRecentTrades(traderId),
      performance: this.getTraderPerformance(traderId)
    };
  }

  getTraderRecentTrades(traderId) {
    // Simulated recent trades
    return Array(5).fill(0).map((_, i) => ({
      pair: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'][Math.floor(Math.random() * 3)],
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: Math.random() * 10,
      profit: Math.random() * 1000 - 500,
      timestamp: Date.now() - i * 3600000
    }));
  }

  getTraderPerformance(traderId) {
    const trader = this.traders.get(traderId);
    if (!trader) return null;
    
    return {
      winRate: trader.winRate,
      totalReturn: trader.totalReturn,
      sharpeRatio: 1.5 + Math.random(),
      maxDrawdown: Math.random() * 20,
      avgWin: Math.random() * 500 + 200,
      avgLoss: Math.random() * 200 + 50
    };
  }

  getUserName(userId) {
    return `User-${userId.substring(0, 8)}`;
  }

  getStatus() {
    return {
      active: true,
      totalTraders: this.traders.size,
      totalStrategies: this.strategies.size,
      activeCopyTrades: this.copyTrades.size,
      discussions: this.discussions.length,
      features: [
        'Copy Trading',
        'Strategy Marketplace',
        'Leaderboards',
        'Social Feed',
        'Trader Profiles',
        'Performance Analytics'
      ]
    };
  }
}

module.exports = CommunityHub;
