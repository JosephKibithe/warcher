import { Info } from 'lucide-react'
import type { Article } from '../services/api'

interface SituationContextProps {
  articles: Article[]
}

export function SituationContext({ articles }: SituationContextProps) {
  // Find the most recent high priority articles to use as context
  const highPriority = articles.filter(a => a.priority === 'HIGH').slice(0, 3)
  
  return (
    <div className="glass rounded-lg mt-4 p-4 border-l-2 border-cyan-500">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-bold tracking-widest text-cyan-400">SITUATION CONTEXT</h3>
        <span className="text-[10px] text-gray-500 ml-auto">
          {new Date().toISOString().split('T')[0]} {new Date().toISOString().split('T')[1].slice(0,5)} UTC
        </span>
      </div>
      
      <div className="text-sm text-gray-300 leading-relaxed font-sans">
        {highPriority.length > 0 ? (
          <p>
            The Middle East conflict involving Iran, the United States, and Israel is intensifying with active military operations. 
            <strong> {highPriority[0].title}.</strong> 
            {highPriority[1] && ` Secondary developments note: ${highPriority[1].title}.`}
            {highPriority[2] && ` Reports indicate ${highPriority[2].title}.`}
            <span className="text-gray-500 italic ml-2">Click any location on the map for detailed reports.</span>
          </p>
        ) : (
          <p>
            The security situation in the Middle East remains tense with ongoing military operations and diplomatic activities. 
            Active monitoring of regional proxies, naval assets, and military deployments is in progress. 
            <span className="text-gray-500 italic ml-2">Click any location on the map for detailed reports.</span>
          </p>
        )}
      </div>
    </div>
  )
}
