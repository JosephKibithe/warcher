import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Article } from '../services/api'
import { MapPin, Crosshair, Anchor, AlertTriangle, Users, Flame } from 'lucide-react'
import { renderToString } from 'react-dom/server'

interface MapProps {
  articles: Article[]
}

type LayerKey = 'bases' | 'forces' | 'strikes' | 'naval' | 'proxy'

// Custom marker icons using Lucide icons
function createCustomIcon(icon: React.ReactNode, color: string) {
  const svgString = renderToString(
    <div style={{ color, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
      {icon}
    </div>
  )
  
  return new DivIcon({
    html: svgString,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

// Map controller to fit bounds
function MapController({ articles }: { articles: Article[] }) {
  const map = useMap()
  
  useEffect(() => {
    const locations = articles.filter(a => a.location).map(a => a.location!)
    if (locations.length > 0) {
      const bounds = locations.map(l => [l.lat, l.lng] as [number, number])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 })
    }
  }, [articles, map])
  
  return null
}

// Layer toggle buttons
interface LayerToggleProps {
  activeLayers: Record<LayerKey, boolean>
  onToggle: (layer: LayerKey) => void
}

function LayerToggles({ activeLayers, onToggle }: LayerToggleProps) {
  const layers: { key: LayerKey; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'bases', label: 'BASES', icon: <MapPin className="w-3 h-3" />, color: 'text-blue-400' },
    { key: 'forces', label: 'FORCES', icon: <Users className="w-3 h-3" />, color: 'text-green-400' },
    { key: 'strikes', label: 'STRIKES', icon: <Crosshair className="w-3 h-3" />, color: 'text-red-400' },
    { key: 'naval', label: 'MARITIME', icon: <Anchor className="w-3 h-3" />, color: 'text-cyan-400' },
    { key: 'proxy', label: 'PROXY', icon: <AlertTriangle className="w-3 h-3" />, color: 'text-yellow-400' },
  ]

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
      {layers.map(layer => (
        <button
          key={layer.key}
          onClick={() => onToggle(layer.key)}
          className={`
            flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold tracking-wider
            bg-[#1a1a24] border border-gray-700 rounded
            transition-all hover:bg-[#2a2a3a]
            ${activeLayers[layer.key] ? 'text-white' : 'text-gray-500'}
          `}
        >
          <span className={layer.color}>{layer.icon}</span>
          {layer.label}
        </button>
      ))}
    </div>
  )
}

// Static conflict zone data
const CONFLICT_ZONES = [
  { name: 'Gaza Strip', lat: 31.5017, lng: 34.4668, type: 'conflict', radius: 15000 },
  { name: 'West Bank', lat: 31.9522, lng: 35.2332, type: 'conflict', radius: 25000 },
  { name: 'Southern Lebanon', lat: 33.2700, lng: 35.3500, type: 'proxy', radius: 20000 },
  { name: 'Yemen Conflict Zone', lat: 15.5527, lng: 48.5164, type: 'proxy', radius: 100000 },
  { name: 'Syria Active Zone', lat: 35.0000, lng: 38.0000, type: 'conflict', radius: 80000 },
  { name: 'Persian Gulf', lat: 26.0000, lng: 52.0000, type: 'naval', radius: 120000 },
  { name: 'Strait of Hormuz (Chokepoint)', lat: 26.5000, lng: 56.5000, type: 'naval', radius: 50000 },
  { name: 'Bab el-Mandeb (Chokepoint)', lat: 12.5833, lng: 43.3333, type: 'naval', radius: 45000 },
  { name: 'Suez Canal', lat: 30.5852, lng: 32.2654, type: 'naval', radius: 30000 },
  { name: 'Gulf of Aden', lat: 12.0000, lng: 48.0000, type: 'naval', radius: 120000 },
]

const MILITARY_BASES = [
  { name: 'Al Udeid Air Base (US)', lat: 25.1178, lng: 51.3150, country: 'Qatar' },
  { name: 'Naval Support Activity Bahrain (US)', lat: 26.1500, lng: 50.6167, country: 'Bahrain' },
  { name: 'Prince Sultan Air Base (US)', lat: 24.0625, lng: 47.5806, country: 'Saudi Arabia' },
  { name: 'Al Dhafra Air Base (US)', lat: 24.2482, lng: 54.5477, country: 'UAE' },
  { name: 'Muwaffaq Salti Air Base (US)', lat: 31.8256, lng: 36.7783, country: 'Jordan' },
  { name: 'Incirlik Air Base (US)', lat: 37.0022, lng: 35.4258, country: 'Turkey' },
  { name: 'Tel Aviv (IDF HQ)', lat: 32.0853, lng: 34.7818, country: 'Israel' },
  { name: 'Haifa Naval Base (IDF)', lat: 32.8192, lng: 34.9995, country: 'Israel' },
  { name: 'Tehran (IRGC HQ)', lat: 35.6892, lng: 51.3890, country: 'Iran' },
  { name: 'Bandar Abbas Naval Base (IRGC)', lat: 27.1386, lng: 56.2167, country: 'Iran' },
]

export function Map({ articles }: MapProps) {
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    bases: true,
    forces: true,
    strikes: true,
    naval: true,
    proxy: true,
  })

  const toggleLayer = (layer: LayerKey) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

  // Get articles with locations
  const locatedArticles = useMemo(() => {
    return articles.filter(a => a.location)
  }, [articles])

  // Default center (Middle East)
  const defaultCenter: [number, number] = [31.5, 45.0]
  const defaultZoom = 5

  return (
    <div className="glass rounded-lg overflow-hidden h-[600px] relative">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 bg-gradient-to-b from-[#0a0a0f] to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-wider text-white">
              THEATER OF OPERATIONS
            </h2>
            <p className="text-xs text-gray-500">
              Middle East · LIVE OSINT TRACKING · Hover for details
            </p>
          </div>
        </div>
      </div>

      {/* Layer Toggles */}
      <LayerToggles activeLayers={activeLayers} onToggle={toggleLayer} />

      {/* Leaflet Map */}
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapController articles={articles} />
        
        {/* Dark themed tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Conflict Zones */}
        {activeLayers.strikes && CONFLICT_ZONES.filter(z => z.type === 'conflict').map((zone, idx) => (
          <Circle
            key={`conflict-${idx}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.15,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong className="text-red-500">{zone.name}</strong>
                <p className="text-gray-400">Active Conflict Zone</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Proxy Zones */}
        {activeLayers.proxy && CONFLICT_ZONES.filter(z => z.type === 'proxy').map((zone, idx) => (
          <Circle
            key={`proxy-${idx}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: '#eab308',
              fillColor: '#eab308',
              fillOpacity: 0.15,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong className="text-yellow-500">{zone.name}</strong>
                <p className="text-gray-400">Proxy Activity Zone</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Naval Zones */}
        {activeLayers.naval && CONFLICT_ZONES.filter(z => z.type === 'naval').map((zone, idx) => (
          <Circle
            key={`naval-${idx}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.1,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong className="text-cyan-500">{zone.name}</strong>
                <p className="text-gray-400">Maritime Operations Area</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Military Bases */}
        {activeLayers.bases && MILITARY_BASES.map((base, idx) => (
          <Marker
            key={`base-${idx}`}
            position={[base.lat, base.lng]}
            icon={createCustomIcon(
              <MapPin className="w-5 h-5" />,
              '#3b82f6'
            )}
          >
            <Popup>
              <div className="text-xs">
                <strong className="text-blue-400">{base.name}</strong>
                <p className="text-gray-400">{base.country}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Article Locations */}
        {locatedArticles.map((article) => (
          <Marker
            key={`article-${article.id}`}
            position={[article.location!.lat, article.location!.lng]}
            icon={createCustomIcon(
              <Flame className="w-5 h-5" />,
              article.priority === 'HIGH' ? '#ef4444' : '#f97316'
            )}
          >
            <Popup>
              <div className="text-xs max-w-xs">
                <strong className={article.priority === 'HIGH' ? 'text-red-400' : 'text-orange-400'}>
                  {article.title}
                </strong>
                <p className="text-gray-400 mt-1">{article.source}</p>
                <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${
                  article.category === 'CONFLICT' ? 'bg-red-500/20 text-red-400' :
                  article.category === 'MILITARY' ? 'bg-blue-500/20 text-blue-400' :
                  article.category === 'DIPLOMATIC' ? 'bg-gray-500/20 text-gray-400' :
                  article.category === 'PROXY' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {article.category}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] p-2 bg-[#1a1a24]/90 border border-gray-800 rounded text-[10px]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-400">Iran/IRGC</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-400">Israel/IDF</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-400">US Forces</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-gray-400">Proxy Forces</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full" />
            <span className="text-gray-400">Maritime/Choke</span>
          </div>
        </div>
      </div>
    </div>
  )
}
