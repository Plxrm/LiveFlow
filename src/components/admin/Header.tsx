import { useState, useEffect } from 'react'
import { Bell, LogOut, Menu, CircleUser } from 'lucide-react'
import { APP_NAME } from '../../lib/constants'

interface HeaderProps {
  title?: string
}

export default function Header({ title = APP_NAME }: HeaderProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.email && setUserEmail(d.email))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 md:px-8 shrink-0 sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <h2 className="text-xl font-extrabold text-blue-700 hidden md:block">{title}</h2>
        <span className="text-xl font-bold text-gray-800 md:hidden">{title}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Stats (desktop only) */}
        <div className="hidden lg:flex items-center gap-6 mr-2 pr-6 border-r border-gray-200">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Revenue Today</span>
            <span className="text-base font-bold text-blue-700">฿-</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">Orders</span>
            <span className="text-base font-bold text-gray-800">-</span>
          </div>
        </div>

        {/* Bell */}
        <button className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* User info + logout */}
        {userEmail && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
              <CircleUser size={18} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 font-medium max-w-[140px] truncate">{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="ออกจากระบบ"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        {/* Mobile logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="sm:hidden p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
