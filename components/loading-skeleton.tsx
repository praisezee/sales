export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <div className="h-12 w-3/4 mx-auto skeleton rounded-lg" />
        <div className="h-6 w-1/2 mx-auto skeleton rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-lg p-6 space-y-3">
            <div className="h-4 w-1/2 skeleton rounded" />
            <div className="h-8 w-3/4 skeleton rounded" />
            <div className="h-3 w-1/3 skeleton rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="glass-card rounded-lg p-6">
        <div className="h-6 w-1/4 skeleton rounded mb-4" />
        <div className="h-64 skeleton rounded-lg" />
      </div>
    </div>
  )
}
