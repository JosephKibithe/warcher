import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Activity } from 'lucide-react'
import { format } from 'date-fns'

export interface EscalationDataPoint {
  timestamp: string
  level: number
}

interface EscalationTimelineProps {
  data: EscalationDataPoint[]
}

export function EscalationTimeline({ data }: EscalationTimelineProps) {
  // Format the time for the X-axis
  const formattedData = data.map(d => ({
    ...d,
    timeLabel: format(new Date(d.timestamp), 'HH:mm')
  }))

  const currentValue = data.length > 0 ? data[data.length - 1].level : 0

  return (
    <div className="glass rounded-lg overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold tracking-wider text-orange-400">
            ESCALATION TIMELINE
          </h2>
        </div>
        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded font-mono">
          CURRENT: {currentValue.toFixed(1)}
        </span>
      </div>

      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis 
              dataKey="timeLabel" 
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              minTickGap={20}
            />
            <YAxis 
              domain={[0, 10]} 
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickCount={6}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #333', fontSize: '12px' }}
              itemStyle={{ color: '#f97316' }}
              labelStyle={{ color: '#999' }}
            />
            <Line 
              type="monotone" 
              dataKey="level" 
              stroke="#f97316" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, fill: '#f97316' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 flex justify-between text-[10px] text-gray-500">
        <span>Updates every 30s. Displaying last 24H history.</span>
      </div>
    </div>
  )
}
