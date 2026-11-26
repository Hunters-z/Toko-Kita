import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart2, Monitor, Globe, Boxes, Users, TrendingUp, Settings2,
  ShoppingCart, FileText, Package, Truck, Wallet, Megaphone, Menu, X,
} from 'lucide-react'

export default function AdminLayout() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Tutup drawer saat pindah halaman
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // Tutup dengan Escape
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = e => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const groups = [
    {
      label: 'Utama',
      items: [
        { label: 'Grafik', path: '/', icon: BarChart2 },
        { label: 'Kasir', path: '/pos', icon: Monitor },
        { label: 'Toko Online', path: '/website', icon: Globe },
      ],
    },
    {
      label: 'Operasional',
      items: [
        { label: 'Inventori', path: '/inventori', icon: Boxes },
        { label: 'Pembelian', path: '/pembelian', icon: ShoppingCart },
        { label: 'Pemasok', path: '/pemasok', icon: Truck },
        { label: 'Produksi', path: '/produksi', icon: Package },
      ],
    },
    {
      label: 'Keuangan',
      items: [
        { label: 'Invoice', path: '/invoice', icon: FileText },
        { label: 'Pengeluaran', path: '/pengeluaran', icon: Wallet },
        { label: 'Laporan', path: '/laporan', icon: TrendingUp },
      ],
    },
    {
      label: 'Toko',
      items: [
        { label: 'Pelanggan', path: '/pelanggan', icon: Users },
        { label: 'Pegawai', path: '/pegawai', icon: Users },
        { label: 'Marketing', path: '/marketing', icon: Megaphone },
        { label: 'Pengaturan', path: '/pengaturan', icon: Settings2 },
      ],
    },
  ]

  const nav = (
    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
      {groups.map(g => (
        <div key={g.label}>
          <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{g.label}</p>
          <div className="space-y-0.5">
            {g.items.map(m => (
              <NavLink key={m.path} to={m.path}
                className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                {({ isActive }) => (
                  <>
                    <m.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {m.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Desktop: fixed sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-200 flex-col z-40">
        <div className="h-[52px] flex items-center gap-2 px-4 border-b border-slate-100 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">TK</div>
          <span className="font-bold text-sm text-slate-900">Toko Kita</span>
        </div>
        {nav}
        <div className="px-4 py-3 border-t border-slate-100 shrink-0">
          <p className="text-[11px] text-slate-400">Admin · Toko Kita</p>
        </div>
      </aside>

      {/* Mobile: off-canvas drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/30" onClick={() => setDrawerOpen(false)} />
          <aside className="w-64 bg-white h-full flex flex-col shadow-xl relative">
            <div className="h-[52px] flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">TK</div>
                <span className="font-bold text-sm text-slate-900">Toko Kita</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} aria-label="Tutup menu" className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            {nav}
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">Admin · Toko Kita</p>
            </div>
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="md:ml-60 flex flex-col min-h-screen">
        <header className="h-[52px] bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
              className="md:hidden w-9 h-9 grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-slate-900 capitalize">
              {location.pathname === '/' ? 'Grafik' : location.pathname.slice(1).replace(/-/g, ' ')}
            </span>
          </div>
          <NavLink to="/pos" className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shrink-0">
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buka Kasir</span>
            <span className="sm:hidden">Kasir</span>
          </NavLink>
        </header>

        <main className="flex-1 p-3 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
