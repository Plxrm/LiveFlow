import { Bell, CircleUser, Menu } from 'lucide-react'

interface HeaderProps {
  title?: string
}

export default function Header({ title = 'Pluem' }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 md:px-8 shrink-0 sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <h2 className="text-xl font-extrabold text-blue-700 hidden md:block">{title}</h2>
        <span className="text-xl font-bold text-gray-800 md:hidden">{title}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4">
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

        {/* Actions */}
        <button className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
          <CircleUser size={20} />
        </button>

      </div>
    </header>
  )
}
