import { useState, useEffect, useCallback } from 'react'
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
import { fetchNews, generateEscalationHistory, fetchPrices, type Article, type EscalationDataPoint, type PriceData } from './services/api'
import { computeSweepDelta, getSweepNumber, type SweepDelta } from './services/sweep'

export type FilterCategory = 'ALL' | 'CONFLICT' | 'MILITARY' | 'DIPLOMATIC' | 'PROXY' | 'NUCLEAR' | 'ECON' | 'SANCTIONS' | 'CYBER'

// Crucix-style sweep interval: 15 minutes.
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

function App() {
  const [articles, setArticles] = useState<Article[]>([])
  const [escalationData, setEscalationData] = useState<EscalationDataPoint[]>([])
  const [prices, setPrices] = useState<PriceData | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [sweepDelta, setSweepDelta] = useState<SweepDelta | null>(null)
  const [sweepNumber, setSweepNumber] = useState(0)
  const [nextSweepIn, setNextSweepIn] = useState(SWEEP_INTERVAL_MS)

  const loadData = useCallback(async () => {
    try {
      const [newsData, priceData] = await Promise.all([
        fetchNews(),
        fetchPrices()
      ])

      // Compute sweep delta BEFORE updating state
      const delta = computeSweepDelta(newsData)
      setSweepDelta(delta)
      setSweepNumber(getSweepNumber())

      setArticles(newsData)
      setEscalationData(generateEscalationHistory(newsData))
      setPrices(priceData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()

    let elapsed = 0
    const interval = setInterval(() => {
      loadData()
      elapsed = 0
    }, SWEEP_INTERVAL_MS)

    // Countdown ticker (updates every second)
    const ticker = setInterval(() => {
      elapsed += 1000
      setNextSweepIn(Math.max(0, SWEEP_INTERVAL_MS - elapsed))
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(ticker)
    }
  }, [loadData])

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
      />
      <MarketTicker prices={prices} />

      {/* Sweep Alert Banners */}
      <SweepAlerts delta={sweepDelta} />

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

          {/* Risk Gauges */}
          <RiskGauges
            articles={articles}
            prices={prices}
            escalationLevel={currentEscalationLevel}
          />
        </div>

        {/* Right Column - Clocks, Nuclear/Space Watch, Live Feeds */}
        <div className="lg:col-span-3 space-y-4 flex flex-col">
          <Clocks />
          <NuclearSpaceWatch articles={articles} />
          <LiveFeeds />
        </div>
      </main>

      {/* Footer ticker */}
      <footer className="bg-[#0f0f14] border-t border-gray-800 h-8 flex items-center overflow-hidden shrink-0 mt-4">
        <div className="flex gap-8 text-[11px] text-gray-400 whitespace-nowrap ticker-animation font-mono font-bold tracking-widest pl-4">
          <span className="text-cyan-500">WARCHER OSINT SYSTEM</span>
          <span>•</span>
          <span>FEEDS: RSS · TELEGRAM · X · REDDIT · GDELT</span>
          <span>•</span>
          <span className="text-red-500 animate-pulse">DEFCON LEVEL {Math.max(1, 6 - Math.ceil(currentEscalationLevel / 2))}</span>
          <span>•</span>
          <span>SWEEP #{sweepNumber} COMPLETE</span>
          <span>•</span>
          <span className="text-yellow-500">CROSS-SOURCE SIGNALS: {articles.filter(a => a.corroborated).length}</span>
          <span>•</span>
          <span className="text-cyan-500">WARCHER OSINT SYSTEM</span>
          <span>•</span>
          <span>FEEDS: RSS · TELEGRAM · X · REDDIT · GDELT</span>
          <span>•</span>
          <span className="text-red-500 animate-pulse">DEFCON LEVEL {Math.max(1, 6 - Math.ceil(currentEscalationLevel / 2))}</span>
          <span>•</span>
          <span>SWEEP #{sweepNumber} COMPLETE</span>
          <span>•</span>
          <span className="text-yellow-500">CROSS-SOURCE SIGNALS: {articles.filter(a => a.corroborated).length}</span>
        </div>
      </footer>
    </div>
  )
}

export default App
