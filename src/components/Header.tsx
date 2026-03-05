import { Radio, RefreshCw } from 'lucide-react'

interface HeaderProps {
  articleCount: number
  lastUpdate: Date
  loading: boolean
}

export function Header({ articleCount, lastUpdate, loading }: HeaderProps) {
  const formatTime = (date: Date) => {
    return date.toISOString().split('T')[1].slice(0, 8)
  }

  return (
    <header className="border-b border-gray-800 bg-[#0f0f14]">
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse-red" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white">
                WARCHER
              </h1>
              <p className="text-xs text-gray-500 tracking-widest">
                MIDDLE EAST — LIVE OSINT
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded">
              <Radio className="w-3 h-3 text-green-500" />
              <span className="text-green-400">ALL FEEDS ACTIVE</span>
            </div>
            
            <div className="flex items-center gap-4 px-3 py-1.5 bg-[#1a1a24] border border-gray-800 rounded">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">NEWS:</span>
                <span className="text-cyan-400 font-mono">{articleCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">APIS:</span>
                <span className="text-cyan-400 font-mono">3</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] border border-gray-800 rounded">
              <RefreshCw className={`w-3 h-3 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-gray-500">UPDATED:</span>
              <span className="text-gray-300 font-mono">{formatTime(lastUpdate)} UTC</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
