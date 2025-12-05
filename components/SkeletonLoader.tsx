'use client';

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-3 sm:px-4 py-2 sm:py-3 text-left">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-16 sm:w-24"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-3 sm:px-4 py-2 sm:py-3">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-1.5 sm:space-y-2">
              <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="h-2.5 sm:h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-1/2 sm:w-1/4"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
