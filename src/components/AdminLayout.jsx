import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, Search, X, BarChart2, Monitor, Globe, Package, Users, FileText, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  const modules = [
    { id: 'dashboard', label: 'Grafik', path: '/', icon: BarChart2 },
    { id: 'pos', label: 'Kasir POS', path: '/pos', icon: Monitor },
    { id: 'website', label: 'Toko Online', path: '/website-builder', icon: Globe },
    { id: 'inventory', label: 'Inventaris', path: '/stock-opname', icon: Package },
    { id: 'hr', label: 'HR & Karyawan', path: '/hr', icon: Users },
    { id: 'reports', label: 'Laporan', path: '/reports', icon: FileText },
    { id: 'settings', label: 'Pengaturan', path: '/settings', icon: Sliders },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-[52px] bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setNavOpen(!navOpen)} className="h-9 w-9">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">TK</div>
            <span className="font-bold text-sm text-slate-900 hidden sm:inline">Toko Kita</span>
          </div>
        </div>

        {/* Sliding Pill Navigation */}
        <div className="hidden 2xl:flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70">
            {modules.map(m => (
              <NavLink key={m.id} to={m.path}
                className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${isActive ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </NavLink>
            ))}
        </div>

        <Button variant="outline" className="w-48 justify-start text-xs text-slate-400 font-normal h-9 rounded-xl">
          <Search className="w-3.5 h-3.5 mr-2" />
          Cari...
        </Button>
      </header>

      {/* Drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/10" onClick={() => setNavOpen(false)} />
          <aside className="w-72 bg-white h-full border-r border-slate-200 p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">Menu Utama</p>
              <Button variant="ghost" size="icon" onClick={() => setNavOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
            <nav className="space-y-1">
              {modules.map(m => (
                <NavLink key={m.id} to={m.path} onClick={() => setNavOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${location.pathname === m.path ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}