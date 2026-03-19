import { useState, useEffect } from 'react'
import { Globe, Clock } from 'lucide-react'

interface TimeData {
  label: string
  timezone: string
  city: string
}

const TIMEZONES: TimeData[] = [
  { label: 'UTC', timezone: 'UTC', city: 'UTC' },
  { label: 'TEHRAN', timezone: 'Asia/Tehran', city: 'Tehran' },
  { label: 'TEL AVIV', timezone: 'Asia/Jerusalem', city: 'Tel Aviv' },
  { label: 'DC', timezone: 'America/New_York', city: 'Washington DC' },
]

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(date)
}

function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  }).format(date)
}

export function Clocks() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass rounded-lg flex flex-col max-h-[320px]">
      <div className="flex items-center gap-2 p-3 border-b border-gray-800 bg-[#0f0f14] flex-shrink-0">
        <Globe className="w-4 h-4 text-cyan-500" />
        <h2 className="text-sm font-bold tracking-wider text-cyan-400">
          GLOBAL CLOCKS
        </h2>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <div className="grid grid-cols-2 gap-3">
          {TIMEZONES.map((tz) => (
            <div
              key={tz.label}
              className="p-3 bg-[#1a1a24] border border-gray-800 rounded"
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-[10px] text-gray-500 tracking-wider">
                  {tz.label}
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-white">
                {formatTime(now, tz.timezone)}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {formatDate(now, tz.timezone)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
