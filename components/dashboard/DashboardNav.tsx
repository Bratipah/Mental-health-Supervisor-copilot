'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface Props {
  supervisorName: string
}

export default function DashboardNav({ supervisorName }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Sessions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Supervisor</p>
            <p className="text-xs text-blue-700 font-medium">Copilot</p>
          </div>
        </div>
      </div>

      {/* Supervisor info */}
      <div className="px-4 py-4 mx-3 my-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {supervisorName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{supervisorName}</p>
            <p className="text-xs text-blue-600">Tier 2 Supervisor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                ? 'bg-blue-700 text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Tiered Care info */}
      <div className="px-3 mb-4">
        <div className="px-3 py-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 mb-1">Tiered Care Model</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            AI Copilot Active
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 w-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
