import './App.css'
import { Map } from './components/Map'
import { NewsFeed } from './components/NewsFeed'
import { Clocks } from './components/Clocks'
import { SitRep } from './components/SitRep'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { WW3Meter } from './components/WW3Meter'
import { EscalationTimeline } from './components/EscalationTimeline'
import { SituationContext } from './components/SituationContext'
import { LiveFeeds } from './components/LiveFeeds'
import { MarketTicker } from './components/MarketTicker'
import { SweepAlerts } from './components/SweepAlerts'
import { NuclearSpaceWatch } from './components/NuclearSpaceWatch'
import { RiskGauges } from './components/RiskGauges'
import { useSweepFeed } from './hooks/useSweepFeed'
import { useState } from 'react'

export type FilterCategory = 'ALL' | 'CONFLICT' | 'MILITARY' | 'DIPLOMATIC' | 'PROXY' | 'NUCLEAR' | 'ECON' | 'SANCTIONS' | 'CYBER'

function App() {
  const {
    articles,
    prices,
    escalationData,
    delta,
    sweepNumber,
    nextSweepIn,
    loading,
    connected,
    lastUpdate,
  } = useSweepFeed()

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL')

  const currentEscalationLevel = escalationData.length > 0
    ? escalationData[escalationData.length - 1].level
    : 0

  const filteredArticles = activeFilter === 'ALL'
    ? articles
    : articles.filter(a => a.category === activeFilter)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-mono">
      <Header
        articleCount={articles.length}
        lastUpdate={lastUpdate}
        loading={loading}
        sweepNumber={sweepNumber}
        nextSweepIn={nextSweepIn}
        connected={connected}
      />
      <MarketTicker prices={prices} />

      {/* Sweep Alert Banners */}
      <SweepAlerts delta={delta} />

      <main className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - SITREP & News */}
        <div className="lg:col-span-3 space-y-4">
          <SitRep articles={articles} />
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <NewsFeed articles={filteredArticles} loading={loading} />
        </div>

        {/* Center Column - Map & Context */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex-1 min-h-[400px]">
            <Map articles={articles} />
          </div>
          <SituationContext articles={articles} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WW3Meter level={currentEscalationLevel} />
            <EscalationTimeline data={escalationData} />
          </div>

          <RiskGauges
            articles={articles}
            prices={prices}
            escalationLevel={currentEscalationLevel}
          />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-4 flex flex-col">
          <Clocks />
          <NuclearSpaceWatch articles={articles} />
          <LiveFeeds />
        </div>
      </main>

      <footer className="bg-[#0f0f14] border-t border-gray-800 h-8 flex items-center overflow-hidden shrink-0 mt-4">
        <div className="flex gap-8 text-[11px] text-gray-400 whitespace-nowrap ticker-animation font-mono font-bold tracking-widest pl-4">
          <span className="text-cyan-500">WARCHER OSINT SYSTEM</span>
          <span>•</span>
          <span>FEEDS: RSS · TELEGRAM · REDDIT · GDELT · OPENSKY · NOAA</span>
          <span>•</span>
          <span className="text-red-500 animate-pulse">DEFCON LEVEL {Math.max(1, 6 - Math.ceil(currentEscalationLevel / 2))}</span>
          <span>•</span>
          <span>SWEEP #{sweepNumber}</span>
          <span>•</span>
          <span className="text-yellow-500">CORROBORATED: {articles.filter(a => a.corroborated).length}</span>
          <span>•</span>
          <span className={connected ? 'text-green-400' : 'text-red-400 animate-pulse'}>
            {connected ? '● BACKEND LIVE' : '● BACKEND OFFLINE'}
          </span>
          <span>•</span>
          <span className="text-cyan-500">WARCHER OSINT SYSTEM</span>
          <span>•</span>
          <span>FEEDS: RSS · TELEGRAM · REDDIT · GDELT · OPENSKY · NOAA</span>
          <span>•</span>
          <span className="text-red-500 animate-pulse">DEFCON LEVEL {Math.max(1, 6 - Math.ceil(currentEscalationLevel / 2))}</span>
          <span>•</span>
          <span>SWEEP #{sweepNumber}</span>
        </div>
      </footer>
    </div>
  )
}

export default App
