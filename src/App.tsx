import { useState, useEffect } from 'react'
import './App.css'
import { Map } from './components/Map'
import { NewsFeed } from './components/NewsFeed'
import { PriceTicker } from './components/PriceTicker'
import { Clocks } from './components/Clocks'
import { SitRep } from './components/SitRep'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { fetchNews, fetchPrices, type Article, type PriceData } from './services/api'

export type FilterCategory = 'ALL' | 'CONFLICT' | 'MILITARY' | 'DIPLOMATIC' | 'PROXY' | 'NUCLEAR'

function App() {
  const [articles, setArticles] = useState<Article[]>([])
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
      
      <main className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - SITREP & News */}
        <div className="lg:col-span-3 space-y-4">
          <SitRep articles={articles} />
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <NewsFeed articles={filteredArticles} loading={loading} />
        </div>

        {/* Center Column - Map */}
        <div className="lg:col-span-6">
          <Map articles={articles} />
        </div>

        {/* Right Column - Clocks & Stats */}
        <div className="lg:col-span-3 space-y-4">
          <Clocks />
          <PriceTicker data={prices} />
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-600 border-t border-gray-800">
        <p>WARCHER — Middle East Live OSINT Monitor | Built with free data sources</p>
        <p className="mt-1">Data: RSS Feeds, CoinGecko, OpenStreetMap | Updates every 30s</p>
      </footer>
    </div>
  )
}

export default App
