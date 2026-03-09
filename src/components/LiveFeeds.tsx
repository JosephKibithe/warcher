import { Radio, MonitorPlay } from 'lucide-react'
import { useState } from 'react'

const FEEDS = [
  { id: 'aljazeera', name: 'Al Jazeera', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg' },
  { id: 'skynews', name: 'Sky News', channelId: 'UCoMdktPbSTixAyNGwb-UYkQ' },
  { id: 'dw', name: 'DW News', channelId: 'UCknLrEdhRCp1aegoMqRaCZg' },
]

export function LiveFeeds() {
  const [activeFeed, setActiveFeed] = useState(FEEDS[0])

  return (
    <div className="bg-[#12121a] border border-gray-800 rounded-lg p-4 flex flex-col h-full section-glow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-red-500 uppercase flex items-center gap-2">
          <MonitorPlay className="w-4 h-4" />
          Live OSINT Feeds
        </h2>
        <div className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-red-500 animate-pulse" />
          <span className="text-xs text-red-500 font-mono tracking-widest">LIVE</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide shrink-0">
        {FEEDS.map((feed) => (
          <button
            key={feed.id}
            onClick={() => setActiveFeed(feed)}
            className={`px-3 py-1 text-xs font-mono rounded ${
              activeFeed.id === feed.id
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-[#0a0a0f] text-gray-500 border border-gray-800 hover:border-gray-600'
            } transition-colors whitespace-nowrap`}
          >
            {feed.name}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-black rounded-lg overflow-hidden border border-gray-800 relative min-h-[300px]">
        {/* Using standard YouTube embed format for live streams by channel ID */}
        <iframe
          src={`https://www.youtube.com/embed/live_stream?channel=${activeFeed.channelId}&autoplay=1&mute=1`}
          title={`${activeFeed.name} Live Stream`}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      
      <div className="mt-3 text-xs text-gray-500 font-mono">
        Transmission intercepted. Signals re-routed via public broadcast networks.
      </div>
    </div>
  )
}
