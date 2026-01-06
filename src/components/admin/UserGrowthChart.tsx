// COMPLETE FILE
// Location: src/components/admin/UserGrowthChart.tsx
// Action: CREATE NEW FILE

'use client'

interface ChartDataPoint {
  date: string
  users: number
}

interface UserGrowthChartProps {
  data: ChartDataPoint[]
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">User Growth (Last 30 Days)</h3>
        <div className="h-64 flex items-center justify-center text-neutral-500">
          No data available
        </div>
      </div>
    )
  }

  // Find max value for scaling
  const maxUsers = Math.max(...data.map(d => d.users))
  const chartHeight = 200

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">User Growth (Last 30 Days)</h3>
        <div className="text-sm text-neutral-600">
          Total: {data.reduce((sum, d) => sum + d.users, 0)} new users
        </div>
      </div>

      <div className="relative" style={{ height: `${chartHeight}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-neutral-500 pr-2">
          <span>{maxUsers}</span>
          <span>{Math.floor(maxUsers * 0.75)}</span>
          <span>{Math.floor(maxUsers * 0.5)}</span>
          <span>{Math.floor(maxUsers * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-8 h-full flex items-end justify-between gap-1">
          {data.map((point, index) => {
            const height = maxUsers > 0 ? (point.users / maxUsers) * 100 : 0
            const isWeekend = new Date(point.date).getDay() === 0 || new Date(point.date).getDay() === 6

            return (
              <div
                key={point.date}
                className="flex-1 group relative cursor-pointer"
                style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
              >
                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all ${
                    isWeekend 
                      ? 'bg-primary-300 hover:bg-primary-400' 
                      : 'bg-primary-500 hover:bg-primary-600'
                  }`}
                  style={{ height: `${height}%` }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-neutral-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    <div className="font-semibold">{point.users} users</div>
                    <div className="text-neutral-300">{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels (show every 5 days) */}
      <div className="ml-8 mt-2 flex justify-between text-xs text-neutral-500">
        {data
          .filter((_, index) => index % 5 === 0)
          .map(point => (
            <span key={point.date}>
              {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ))}
      </div>
    </div>
  )
}