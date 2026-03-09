import { TrendingUp, TrendingDown } from 'lucide-react'
import type { PriceData } from '../services/api'

interface MarketTickerProps {
  prices: PriceData | null
}

export function MarketTicker({ prices }: MarketTickerProps) {
  if (!prices) return null

  const renderPrice = (label: string, data: { price: number; change24h: number }, prefix = '$', dp = 2) => {
    const isUp = data.change24h >= 0
    return (
      <div className="flex items-center gap-3 px-6 border-r border-gray-800 last:border-0 hover:bg-white/5 transition-colors cursor-default">
        <span className="text-gray-400 font-bold">{label}</span>
        <span className="text-white font-black tracking-wide">
          {prefix}{data.price.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp })}
        </span>
        <span className={`text-xs flex items-center font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(data.change24h).toFixed(2)}%
        </span>
      </div>
    )
  }

  return (
    <div className="bg-[#0f0f14] border-b border-gray-800 h-12 flex items-center overflow-x-auto text-sm font-mono shrink-0 scrollbar-hide w-full shadow-lg z-10">
      <div className="flex items-center min-w-max h-full">
        {renderPrice('WTI CRUDE', prices.oil, '$', 2)}
        {renderPrice('NAT GAS', prices.gas, '$', 3)}
        {renderPrice('GOLD', prices.gold, '$', 2)}
        {renderPrice('SILVER', prices.silver, '$', 2)}
        {renderPrice('BTC', prices.btc, '$', 0)}
        {renderPrice('ETH', prices.eth, '$', 2)}
        {renderPrice('SOL', prices.sol, '$', 2)}
      </div>
    </div>
  )
}
