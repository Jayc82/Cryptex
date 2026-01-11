import numpy as np
from typing import Dict, Any, List

class InsightService:
    def generate_insights(self, symbol: str, user_id: str) -> List[Dict[str, Any]]:
        """Generate trading insights"""
        insights = []
        
        # Technical analysis insight
        insights.append({
            'type': 'technical',
            'title': 'Strong Buy Signal',
            'description': f'{symbol} shows strong bullish indicators with RSI at 35 and MACD crossover.',
            'confidence': 0.78,
            'timestamp': 'now'
        })
        
        # Market sentiment insight
        insights.append({
            'type': 'sentiment',
            'title': 'Positive Market Sentiment',
            'description': 'Social media sentiment is 72% positive with increasing volume.',
            'confidence': 0.65,
            'timestamp': 'now'
        })
        
        return insights

    def generate_recommendations(self, user_id: str, risk_tolerance: str) -> List[Dict[str, Any]]:
        """Generate personalized recommendations"""
        recommendations = []
        
        risk_multiplier = {
            'low': 0.5,
            'medium': 1.0,
            'high': 1.5
        }.get(risk_tolerance, 1.0)
        
        recommendations.append({
            'symbol': 'BTC/USDT',
            'action': 'buy',
            'reason': 'Strong technical indicators and positive sentiment',
            'targetPrice': 48000,
            'stopLoss': 43000,
            'confidence': 0.75 * risk_multiplier
        })
        
        recommendations.append({
            'symbol': 'ETH/USDT',
            'action': 'hold',
            'reason': 'Consolidation phase, wait for breakout',
            'targetPrice': 2800,
            'stopLoss': 2400,
            'confidence': 0.68 * risk_multiplier
        })
        
        return recommendations

    def analyze_trade_opportunity(
        self, 
        user_id: str, 
        symbol: str, 
        side: str, 
        quantity: float, 
        price: float
    ) -> Dict[str, Any]:
        """Analyze a potential trade"""
        
        risk_score = np.random.uniform(0.3, 0.7)
        reward_ratio = np.random.uniform(1.5, 3.0)
        
        is_favorable = risk_score < 0.5 and reward_ratio > 2.0
        
        return {
            'recommendation': 'proceed' if is_favorable else 'reconsider',
            'riskScore': round(risk_score, 2),
            'rewardRatio': round(reward_ratio, 2),
            'analysis': {
                'marketCondition': 'favorable' if is_favorable else 'unfavorable',
                'timing': 'good' if is_favorable else 'poor',
                'priceLevel': 'optimal' if is_favorable else 'suboptimal'
            },
            'suggestedEntry': price * 0.98,
            'suggestedExit': price * 1.05,
            'stopLoss': price * 0.95
        }
