import type { FilterCategory } from '../App'

interface FilterBarProps {
  activeFilter: FilterCategory
  onFilterChange: (filter: FilterCategory) => void
}

const filters: { key: FilterCategory; label: string; color: string }[] = [
  { key: 'ALL', label: 'ALL', color: 'bg-gray-700' },
  { key: 'CONFLICT', label: 'CONFLICT', color: 'bg-red-600' },
  { key: 'MILITARY', label: 'MILITARY', color: 'bg-blue-600' },
  { key: 'DIPLOMATIC', label: 'DIPLOMATIC', color: 'bg-gray-500' },
  { key: 'PROXY', label: 'PROXY', color: 'bg-yellow-600' },
  { key: 'NUCLEAR', label: 'NUCLEAR', color: 'bg-purple-600' },
  { key: 'CYBER', label: 'CYBER', color: 'bg-violet-700' },
  { key: 'SANCTIONS', label: 'SANCTIONS', color: 'bg-pink-700' },
  { key: 'ECON', label: 'ECON', color: 'bg-teal-700' },
]

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`
              px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-all
              ${activeFilter === filter.key 
                ? `${filter.color} text-white shadow-lg` 
                : 'bg-[#2a2a3a] text-gray-400 hover:bg-[#3a3a4a] hover:text-gray-200'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  )
}
