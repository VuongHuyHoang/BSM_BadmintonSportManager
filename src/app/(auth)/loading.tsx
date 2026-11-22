export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-[#dceeff] flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
      {/* Top Screen Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-black/20 z-50 overflow-hidden">
        <div className="animate-progress-bar rounded-full shadow-[0_0_8px_#55db9c]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-full bg-[#f1f3f6] border border-black animate-pulse" />
          <div className="h-6 w-16 bg-zinc-300 rounded animate-pulse" />
        </div>
        <div className="h-8 w-48 bg-zinc-300 rounded mx-auto animate-pulse mb-2" />
        <div className="h-4 w-64 bg-zinc-200 rounded mx-auto animate-pulse" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-black rounded-[24px] p-6 sm:p-8 shadow-[6px_6px_0px_#000000] relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-100 overflow-hidden">
            <div className="animate-progress-bar" />
          </div>

          <div className="space-y-2">
            <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-100 rounded-xl border border-black/10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-100 rounded-xl border border-black/10 animate-pulse" />
          </div>

          <div className="h-12 w-full bg-zinc-200 rounded-full border border-black animate-pulse mt-4" />
        </div>
      </div>
    </div>
  );
}
