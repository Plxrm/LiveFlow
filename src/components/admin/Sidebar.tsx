import {
  Radio,
  LayoutDashboard,
  ShoppingCart,
  Package2,
  Users,
  Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live',      label: 'Live',      icon: Radio },
  { href: '/products',  label: 'Inventory', icon: Package2 },
  { href: '/orders',    label: 'Orders',    icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
]

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  currentPath?: string
  /** จำนวน orders ที่ status=paid (พร้อมจัดส่ง) */
  pendingShipments?: number
}

export default function Sidebar({ currentPath = '/', pendingShipments = 0 }: SidebarProps) {
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + '/')

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-200 flex-col py-6 z-50">
      {/* Brand */}
      <div className="px-6 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-blue-700 leading-tight">Pluem Admin</h1>
          <p className="text-[11px] text-gray-400 leading-none">TikTok Live Management</p>
        </div>
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

              {/* Live pulse indicator */}
              {href === '/live' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}

              {/* Orders: pending shipments badge */}
              {isOrders && pendingShipments > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingShipments > 99 ? '99+' : pendingShipments}
                </span>
              )}
            </a>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="mt-auto px-2 pt-4 border-t border-gray-100">
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
      </div>
    </aside>
  )
}
