export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#dceeff] text-black">
      {/* Top Loading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#55db9c] z-50 animate-pulse" />

      {/* Navbar Skeleton */}
      <div className="sticky top-0 z-40 bg-white border-b border-black px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#f1f3f6] border border-black animate-pulse" />
            <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-full bg-zinc-100 border border-black animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-zinc-200 border border-black animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        {/* Banner Skeleton */}
        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-4">
          <div className="h-5 w-32 bg-[#ffd731]/60 rounded-full animate-pulse border border-black/20" />
          <div className="h-8 w-64 bg-zinc-200 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-zinc-100 rounded animate-pulse" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-black/10">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#f8fafc] border border-black/20 rounded-2xl p-4 h-24 animate-pulse flex flex-col justify-between"
              >
                <div className="h-3 w-16 bg-zinc-200 rounded" />
                <div className="h-6 w-24 bg-zinc-300 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white border border-black rounded-[22px] p-6 shadow-[4px_4px_0px_#000000] h-48 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-36 bg-zinc-200 rounded" />
                <div className="h-4 w-16 bg-zinc-100 rounded-full" />
              </div>
              <div className="h-3 w-48 bg-zinc-100 rounded" />
              <div className="h-16 bg-[#f8fafc] border border-black/10 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
