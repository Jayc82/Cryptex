from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import logging

# Import services
from services.predictions import PredictionService
from services.insights import InsightService
from services.risk import RiskAssessmentService
from services.sentiment import SentimentAnalysisService

load_dotenv()

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
prediction_service = PredictionService()
insight_service = InsightService()
risk_service = RiskAssessmentService()
sentiment_service = SentimentAnalysisService()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'ai-service'})

@app.route('/api/predict', methods=['POST'])
def predict_price():
    """Predict future price movements"""
    try:
        data = request.get_json()
        symbol = data.get('symbol')
        timeframe = data.get('timeframe', '24h')
        
        prediction = prediction_service.predict(symbol, timeframe)
        
        return jsonify({
            'symbol': symbol,
            'timeframe': timeframe,
            'prediction': prediction
        })
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/insights', methods=['POST'])
def get_insights():
    """Get trading insights for a symbol"""
    try:
        data = request.get_json()
        symbol = data.get('symbol')
        user_id = data.get('userId')
        
        insights = insight_service.generate_insights(symbol, user_id)
        
        return jsonify({
            'symbol': symbol,
            'insights': insights
        })
    except Exception as e:
        logger.error(f"Insights error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/risk-assessment', methods=['POST'])
def assess_risk():
    """Assess portfolio risk"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        
        assessment = risk_service.assess_portfolio(user_id)
        
        return jsonify({
            'userId': user_id,
            'riskAssessment': assessment
        })
    except Exception as e:
        logger.error(f"Risk assessment error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """Get trading recommendations"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        risk_tolerance = data.get('riskTolerance', 'medium')
        
        recommendations = insight_service.generate_recommendations(
            user_id, 
            risk_tolerance
        )
        
        return jsonify({
            'recommendations': recommendations
        })
    except Exception as e:
        logger.error(f"Recommendations error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-trade', methods=['POST'])
def analyze_trade():
    """Analyze a potential trade"""
    try:
        data = request.get_json()
        
        analysis = insight_service.analyze_trade_opportunity(
            data.get('userId'),
            data.get('symbol'),
            data.get('side'),
            data.get('quantity'),
            data.get('price')
        )
        
        return jsonify({
            'analysis': analysis
        })
    except Exception as e:
        logger.error(f"Trade analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sentiment', methods=['POST'])
def get_sentiment():
    """Get market sentiment for a symbol"""
    try:
        data = request.get_json()
        symbol = data.get('symbol')
        
        sentiment = sentiment_service.analyze_sentiment(symbol)
        
        return jsonify({
            'symbol': symbol,
            'sentiment': sentiment
        })
    except Exception as e:
        logger.error(f"Sentiment analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('DEBUG', 'False') == 'True')
