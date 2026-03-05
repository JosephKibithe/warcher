import { TrendingUp, TrendingDown, Bitcoin, CircleDollarSign, Gem } from 'lucide-react'
import type { PriceData } from '../services/api'

interface PriceTickerProps {
  data: PriceData | null
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return price.toFixed(2)
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export function PriceTicker({ data }: PriceTickerProps) {
  if (!data) {
    return (
      <div className="glass rounded-lg p-4">
        <div className="flex items-center justify-center h-24">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const assets = [
    {
      name: 'BTC',
      fullName: 'Bitcoin',
      price: data.btc.price,
      change: data.btc.change24h,
      icon: <Bitcoin className="w-4 h-4" />,
      color: 'text-orange-400',
    },
    {
      name: 'ETH',
      fullName: 'Ethereum',
      price: data.eth.price,
      change: data.eth.change24h,
      icon: <Gem className="w-4 h-4" />,
      color: 'text-purple-400',
    },
    {
      name: 'GOLD',
      fullName: 'Gold',
      price: data.gold.price,
      change: data.gold.change24h,
      icon: <CircleDollarSign className="w-4 h-4" />,
      color: 'text-yellow-400',
    },
  ]

  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-gray-800 bg-[#0f0f14]">
        <TrendingUp className="w-4 h-4 text-green-500" />
        <h2 className="text-sm font-bold tracking-wider text-green-400">
          MARKET INDICATORS
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {assets.map((asset) => (
          <div
            key={asset.name}
            className="flex items-center justify-between p-3 bg-[#1a1a24] border border-gray-800 rounded"
          >
            <div className="flex items-center gap-3">
              <span className={asset.color}>{asset.icon}</span>
              <div>
                <span className="text-sm font-bold text-white">{asset.name}</span>
                <span className="text-[10px] text-gray-500 ml-2">{asset.fullName}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-white">
                ${formatPrice(asset.price)}
              </div>
              <div className={`text-[10px] flex items-center justify-end gap-1 ${
                asset.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {asset.change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatChange(asset.change)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mini Ticker */}
      <div className="px-4 pb-4">
        <div className="p-2 bg-[#0f0f14] border border-gray-800 rounded overflow-hidden">
          <div className="flex gap-4 text-[10px] text-gray-500 whitespace-nowrap ticker-animation">
            <span>WTI CRUDE: $78.45 (+1.2%)</span>
            <span>BRENT: $82.18 (+1.1%)</span>
            <span>VIX: 14.23 (-2.1%)</span>
            <span>DXY: 103.45 (+0.3%)</span>
            <span>WTI CRUDE: $78.45 (+1.2%)</span>
            <span>BRENT: $82.18 (+1.1%)</span>
            <span>VIX: 14.23 (-2.1%)</span>
            <span>DXY: 103.45 (+0.3%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
