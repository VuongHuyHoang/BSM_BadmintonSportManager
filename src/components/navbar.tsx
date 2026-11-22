import Link from "next/link";
import { auth } from "@/lib/auth";
import { handleSignOut } from "@/server/actions/auth";
import { LogOut, User as UserIcon, PlusCircle, Shield, Home } from "lucide-react";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-black px-4 sm:px-8 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-full bg-[#55db9c] border border-black flex items-center justify-center font-black text-base shadow-[2px_2px_0px_#000000] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-transform">
            🏸
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-black block leading-none">BSM</span>
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Badminton Manager</span>
          </div>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-2.5">
          {session?.user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#dceeff] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#c7e4ff] transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/clubs/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#ffd731] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#ffcf10] transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tạo CLB</span>
              </Link>

              {/* User Pill */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#f1f3f6] border border-black shadow-[2px_2px_0px_#000000]">
                <div className="h-5 w-5 rounded-full bg-[#e9ccff] border border-black flex items-center justify-center text-[10px] font-black">
                  {session.user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="max-w-[120px] truncate hidden md:inline">{session.user.name}</span>
                
                {/* Sign out button */}
                <form action={handleSignOut}>
                  <button
                    type="submit"
                    title="Đăng xuất"
                    className="ml-1 text-zinc-500 hover:text-black p-0.5 rounded transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all"
              >
                Đăng Nhập
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#55db9c] text-black border border-black shadow-[2px_2px_0px_#000000] hover:bg-[#43c487] transition-all"
              >
                Đăng Ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
