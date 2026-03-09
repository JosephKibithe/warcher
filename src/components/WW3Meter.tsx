import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { AlertOctagon } from 'lucide-react'

interface WW3MeterProps {
  level: number // 0 to 10
}

export function WW3Meter({ level }: WW3MeterProps) {
  // Map 0-10 level to a gauge format
  // We use 3 sections: Low/Moderate (0-4), Elevated (5-7), Critical (8-10)
  const data = [
    { name: 'Low', value: 40, color: '#10b981' }, // Green
    { name: 'Elevated', value: 30, color: '#f59e0b' }, // Yellow
    { name: 'Critical', value: 30, color: '#ef4444' } // Red
  ]
  
  // Map level 0-10 to angle -90 to 90 degrees for CSS rotate
  // At level 0, it should point left (-90deg), at level 10 it should point right (90deg)
  const rotateAngle = -90 + (level / 10) * 180

  const getStatusText = (l: number) => {
    if (l >= 8) return { text: 'CRITICAL THREAT', color: 'text-red-500' }
    if (l >= 5) return { text: 'ELEVATED RISK', color: 'text-yellow-500' }
    return { text: 'MODERATE', color: 'text-green-500' }
  }

  const status = getStatusText(level)

  return (
    <div className="glass rounded-lg overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-2 w-full border-b border-gray-800 pb-2">
        <AlertOctagon className="w-4 h-4 text-red-500" />
        <h2 className="text-sm font-bold tracking-wider text-red-400">
          WW3 THREAT METER
        </h2>
      </div>
      
      <div className="relative w-full h-[120px] mt-4 flex justify-center items-end">
        <ResponsiveContainer width="100%" height="200%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-1 h-[70px] bg-white origin-bottom rounded-t-full shadow-lg transition-transform duration-1000 ease-in-out"
          style={{ 
            transform: `translateX(-50%) rotate(${rotateAngle}deg)`,
            marginLeft: '-2px'
          }}
        />
        
        {/* Needle base */}
        <div className="absolute bottom-[-8px] left-1/2 w-4 h-4 bg-white rounded-full transform -translate-x-1/2 shadow-lg z-10" />
      </div>
      
      <div className="mt-4 text-center">
        <div className={`text-2xl font-black ${status.color}`}>
          DEFCON {Math.max(1, 6 - Math.ceil(level / 2))}
        </div>
        <div className={`text-xs font-bold tracking-widest mt-1 ${status.color}`}>
          {status.text} ({level.toFixed(1)}/10)
        </div>
      </div>
    </div>
  )
}
