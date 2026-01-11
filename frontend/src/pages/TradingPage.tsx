import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function TradingPage() {
  const { symbol = 'BTCUSDT' } = useParams();
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const { data: ticker } = useQuery({
    queryKey: ['ticker', symbol],
    queryFn: async () => {
      const res = await api.get(`/market/ticker/${symbol}`);
      return res.data;
    },
    refetchInterval: 1000,
  });

  const { data: orderBook } = useQuery({
    queryKey: ['orderbook', symbol],
    queryFn: async () => {
      const res = await api.get(`/trading/orderbook/${symbol}`);
      return res.data;
    },
    refetchInterval: 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/trading/orders', {
        symbol,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
      });
      // Reset form
      setQuantity('');
      setPrice('');
      alert('Order placed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to place order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{symbol}</h1>
          <p className="text-2xl mt-2">
            <span className={ticker?.priceChange >= 0 ? 'price-up' : 'price-down'}>
              ${ticker?.close_price || '0.00'}
            </span>
            <span className="text-sm ml-2 text-slate-400">
              {ticker?.priceChangePercent >= 0 ? '+' : ''}
              {ticker?.priceChangePercent || '0.00'}%
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 card h-96">
          <h3 className="text-lg font-semibold mb-4">Price Chart</h3>
          <div className="flex items-center justify-center h-full text-slate-400">
            Chart will be displayed here
          </div>
        </div>

        {/* Order Form */}
        <div className="card">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 py-2 rounded ${
                side === 'buy' ? 'buy-button' : 'bg-slate-700'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 py-2 rounded ${
                side === 'sell' ? 'sell-button' : 'bg-slate-700'
              }`}
            >
              Sell
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setOrderType('limit')}
              className={`flex-1 py-2 rounded ${
                orderType === 'limit' ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              Limit
            </button>
            <button
              onClick={() => setOrderType('market')}
              className={`flex-1 py-2 rounded ${
                orderType === 'market' ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              Market
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {orderType === 'limit' && (
              <div>
                <label className="block text-sm mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-2">Quantity</label>
              <input
                type="number"
                step="0.00000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>

            <button
              type="submit"
              className={side === 'buy' ? 'buy-button w-full' : 'sell-button w-full'}
            >
              {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
            </button>
          </form>
        </div>

        {/* Order Book */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold mb-4">Order Book</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">Asks (Sell Orders)</p>
              <div className="space-y-1">
                {orderBook?.asks?.slice(0, 10).map((ask: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-red-500">{ask.price}</span>
                    <span className="text-slate-400">{ask.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Bids (Buy Orders)</p>
              <div className="space-y-1">
                {orderBook?.bids?.slice(0, 10).map((bid: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-green-500">{bid.price}</span>
                    <span className="text-slate-400">{bid.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
