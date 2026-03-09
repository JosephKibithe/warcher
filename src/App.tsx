import { useState, useEffect } from 'react'
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
import { fetchNews, generateEscalationHistory, fetchPrices, type Article, type EscalationDataPoint, type PriceData } from './services/api'

export type FilterCategory = 'ALL' | 'CONFLICT' | 'MILITARY' | 'DIPLOMATIC' | 'PROXY' | 'NUCLEAR'

function App() {
  const [articles, setArticles] = useState<Article[]>([])
  const [escalationData, setEscalationData] = useState<EscalationDataPoint[]>([])
  const [prices, setPrices] = useState<PriceData | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Fetch data on mount and every 30 seconds
  useEffect(() => {
    const loadData = async () => {
      try {
        const [newsData, priceData] = await Promise.all([
          fetchNews(),
          fetchPrices()
        ])
        setArticles(newsData)
        setEscalationData(generateEscalationHistory(newsData))
        setPrices(priceData)
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const filteredArticles = activeFilter === 'ALL' 
    ? articles 
    : articles.filter(a => a.category === activeFilter)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-mono">
      <Header 
        articleCount={articles.length} 
        lastUpdate={lastUpdate}
        loading={loading}
      />
      <MarketTicker prices={prices} />
      
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
            <WW3Meter level={escalationData.length > 0 ? escalationData[escalationData.length - 1].level : 0} />
            <EscalationTimeline data={escalationData} />
          </div>
        </div>

        {/* Right Column - Clocks & Live Feeds */}
        <div className="lg:col-span-3 space-y-4 flex flex-col">
          <Clocks />
          <LiveFeeds />
        </div>
      </main>

      {/* Replaced standard footer with a scrolling ticker like the reference site */}
      <footer className="bg-[#0f0f14] border-t border-gray-800 h-8 flex items-center overflow-hidden shrink-0 mt-4">
        <div className="flex gap-8 text-[11px] text-gray-400 whitespace-nowrap ticker-animation font-mono font-bold tracking-widest pl-4">
          <span className="text-cyan-500">WARCHER OSINT SYSTEM</span>
          <span>•</span>
          <span>FEEDS: RSS, TELEGRAM, X/TWITTER, REDDIT</span>
          <span>•</span>
          <span className="text-red-500 animate-pulse">DEFCON LEVEL {Math.max(1, 6 - Math.ceil((escalationData[escalationData.length - 1]?.level || 0) / 2))}</span>
          <span>•</span>
          <span>US FORCES DEPLOYED</span>
          <span>•</span>
          <span>IRGC ON HIGH ALERT</span>
          <span>•</span>
          <span className="text-yellow-500">IDF OPERATIONS ACTIVE</span>
          <span>•</span>
          <span className="text-cyan-500">WARCHER OSINT SYSTEM</span>
          <span>•</span>
          <span>FEEDS: RSS, TELEGRAM, X/TWITTER, REDDIT</span>
          <span>•</span>
          <span className="text-red-500 animate-pulse">DEFCON LEVEL {Math.max(1, 6 - Math.ceil((escalationData[escalationData.length - 1]?.level || 0) / 2))}</span>
          <span>•</span>
          <span>US FORCES DEPLOYED</span>
          <span>•</span>
          <span>IRGC ON HIGH ALERT</span>
          <span>•</span>
          <span className="text-yellow-500">IDF OPERATIONS ACTIVE</span>
        </div>
      </footer>
    </div>
  )
}

export default App
