import { useState, useEffect } from 'react'
import {
  Radio,
  LayoutDashboard,
  ShoppingCart,
  Package2,
  Users,
  Settings,
  LogOut,
  CircleUser,
  ShieldX,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live',      label: 'Live',      icon: Radio },
  { href: '/products',  label: 'Inventory', icon: Package2 },
  { href: '/orders',    label: 'Orders',    icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/blacklist', label: 'Blacklist', icon: ShieldX },
]

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  currentPath?: string
  pendingShipments?: number
  bannedCount?: number
}

export default function Sidebar({ currentPath = '/', pendingShipments = 0, bannedCount = 0 }: SidebarProps) {
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + '/')
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
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-200 flex-col py-6 z-50">
      {/* Brand */}
      <div className="px-6 mb-6 flex items-center justify-center">
        <img src="/logo.svg" alt="LiveFlow" className="h-32 w-auto" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          const isOrders = href === '/orders'
          return (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                active
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <Icon
                size={18}
                className={active ? 'text-blue-600' : 'text-gray-400'}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span>{label}</span>

              {href === '/live' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}

              {isOrders && pendingShipments > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingShipments > 99 ? '99+' : pendingShipments}
                </span>
              )}

              {href === '/blacklist' && bannedCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {bannedCount > 99 ? '99+' : bannedCount}
                </span>
              )}
            </a>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="mt-auto px-2 pt-4 border-t border-gray-100 flex flex-col gap-1">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                active
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <Icon
                size={18}
                className={active ? 'text-blue-600' : 'text-gray-400'}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span>{label}</span>
            </a>
          )
        })}

        {/* User info + logout */}
        {userEmail && (
          <div className="mt-2 mx-1 flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-50 border border-gray-100">
            <CircleUser size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{userEmail}</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="ออกจากระบบ"
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0 disabled:opacity-50"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
